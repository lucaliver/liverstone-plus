import '@fontsource/silkscreen/400.css';
import '@fontsource/silkscreen/700.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import './styles/index.css';

import { setLocale, setStringValues, t } from './core/i18n';
import { randomSeed } from './core/rng';
import { setSfxVolume, unlockAudio } from './audio/sfx';
import { musicTrack, playMusic, setMusicVolume, suspendMusic } from './audio/music';
import { actDef } from './data/acts';
import type { RewardKind } from './data/config';
import { ENEMIES } from './data/enemies';
import { VALUES } from './data/values';
import { Combat } from './game/combat';
import {
  addCard,
  advance,
  applyCombat,
  clearRun,
  combatSetup,
  currentNode,
  FIRST_RUN_SEED,
  finishRun,
  loadRun,
  newRun,
  type NodeType,
  rollRewards,
  saveRun,
  type RunState,
} from './game/run';
import { chosenMemos, contractSigned, memosOpen, startingFirstRun } from './game/meta';
import { settings } from './game/settings';
import type { HeroId } from './game/types';
import { confirmModal, initApp, openModal, type Screen, show } from './ui/app';
import { h } from './ui/dom';
import { openDebugFight, openDebugMenu } from './ui/components/debugMenu';
import { initFx } from './ui/fx/fx';
import { preloadArt } from './ui/art/riso';
import { CREATURES } from './ui/art/creatures';
import { ICONS } from './ui/art/icons';
import { combatScreen } from './ui/combat/combatScreen';
import { endScreen } from './ui/screens/end';
import { heroSelectScreen } from './ui/screens/heroSelect';
import { journeyScreen, NODE_ICON } from './ui/screens/journey';
import { restScreen } from './ui/screens/rest';
import { promotionScreen } from './ui/screens/promotion';
import { copyRoomScreen } from './ui/screens/copyRoom';
import { tailorScreen } from './ui/screens/tailor';
import { lostFoundScreen } from './ui/screens/lostFound';
import { vendingScreen } from './ui/screens/vending';
import { crossTrainingScreen } from './ui/screens/crossTraining';
import { rewardScreen } from './ui/screens/reward';
import { splashScreen, titleScreen } from './ui/screens/title';
import { compendiumScreen } from './ui/screens/compendium';

let run: RunState | null = null;

/** A room or reward screen wears the colours of the act it is in (the map and the fights do it themselves). */
function inAct(screen: Screen, r: RunState): Screen {
  screen.el.dataset.act = String(currentNode(r).act);
  return screen;
}

/** The rooms that aren't fights: each one is a screen that calls back when the player is done. */
const ROOMS: Partial<Record<NodeType, (run: RunState, onDone: () => void) => Screen>> = {
  rest: restScreen,
  promotion: promotionScreen,
  copy: copyRoomScreen,
  tailor: tailorScreen,
  lostFound: lostFoundScreen,
  vending: vendingScreen,
  crossTraining: crossTrainingScreen,
};

function goTitle(): void {
  playMusic('menu');
  const saved = loadRun();
  show(
    titleScreen({
      save: saved,
      onContinue: () => {
        run = loadRun();
        if (!run) {
          goTitle();
          return;
        }
        // A saved run whose node was already completed resumes on the map, choosing the next one.
        goJourney();
      },
      onNewRun: () => {
        if (loadRun()) confirmModal(t('menu.abandonConfirm'), t('common.confirm'), goHeroSelect, t('common.cancel'));
        else goHeroSelect();
      },
      onCompendium: () => show(compendiumScreen(goTitle)),
      onDebugFight: () => {
        const pick = (): void => void openDebugFight(debugFight);
        if (loadRun()) confirmModal(t('menu.abandonConfirm'), t('common.confirm'), pick, t('common.cancel'));
        else pick();
      },
    }),
  );
}

function goHeroSelect(first?: HeroId): void {
  show(heroSelectScreen(startRun, goTitle, first));
}

function startRun(hero: HeroId): void {
  // The very first run always has the same map and enemies.
  const first = startingFirstRun();
  run = newRun(hero, first ? FIRST_RUN_SEED : randomSeed(), first, !first && memosOpen(hero) ? chosenMemos() : []);
  goJourney();
}

/** Debug: a fresh run whose first fight is against the chosen enemy. */
function debugFight(hero: HeroId, enemy: string, cards: string[]): void {
  run = newRun(hero, randomSeed());
  for (const id of cards) addCard(run, id);
  run.nodes[run.current].enemy = enemy;
  enterNode();
}

function goJourney(): void {
  if (!run) {
    goTitle();
    return;
  }
  playMusic(actDef(currentNode(run).act).mapMusic);
  saveRun(run);
  show(journeyScreen(run, enterNode, goTitle, debugMap));
}

/** Debug: the map's cheat menu. Rewards and rooms on demand, then back to the map with the current room as it was. */
function debugMap(): void {
  if (!run) return;
  const r = run;
  const cleared = r.cleared;
  const back = (): void => {
    r.cleared = cleared;
    goJourney();
  };
  const reward = (kind: RewardKind) => (): void => show(inAct(rewardScreen(r, rollRewards(r, kind), back), r));
  const rooms = Object.entries(ROOMS).map(([type, screen]) => ({
    label: t(`journey.node.${type as NodeType}`),
    icon: NODE_ICON[type as NodeType],
    run: () => {
      playMusic('rest');
      show(inAct(screen(r, back), r));
    },
  }));
  // As if the boss of the act on the map had just fallen: a new shift starts rested (the last act has nothing after it).
  const cur = currentNode(r);
  const mapAct = r.cleared && cur.type === 'boss' && cur.next.length ? r.nodes[cur.next[0]].act : cur.act;
  const boss = r.nodes.find((n) => n.act === mapAct && n.type === 'boss');
  const nextAct = boss?.next.length
    ? {
        label: t('debug.nextAct'),
        icon: NODE_ICON.boss,
        run: () => {
          r.current = boss.id;
          r.path.push(boss.id);
          r.cleared = true;
          r.hp = r.maxHp;
          goJourney();
        },
      }
    : null;
  openDebugMenu(t('debug.mapMenu'), [
    { label: t('debug.rewardFight'), icon: 'cards', run: reward('fight') },
    { label: t('debug.rewardElite'), icon: 'medal', run: reward('elite') },
    { label: t('debug.rewardBoss'), icon: 'tophat', run: reward('boss') },
    ...rooms,
    {
      label: t('debug.heal'),
      icon: 'heart',
      run: () => {
        r.hp = r.maxHp;
        goJourney();
      },
    },
    { label: t('debug.skipRoom'), icon: 'check', run: nextNode },
    ...(nextAct ? [nextAct] : []),
  ]);
}

/** Enters the current node, or first moves to `to` when the current one is already cleared. */
function enterNode(to?: number): void {
  if (!run) return;
  if (run.cleared && !advance(run, to)) return;
  const node = currentNode(run);
  const room = ROOMS[node.type];
  if (room) {
    playMusic('rest');
    show(inAct(room(run, nextNode), run));
    return;
  }
  // Each shift has its own fight music (by the enemy's act, so debug fights match too).
  playMusic(node.type === 'boss' ? 'boss' : node.type === 'elite' ? 'elite' : actDef(ENEMIES[node.enemy!].act).music);
  const combat = new Combat(combatSetup(run));
  if (import.meta.env.DEV) Object.assign(window, { __combat: combat });
  saveRun(run);
  show(combatScreen(run, combat, { onEnd: afterCombat, onQuit: abandon, onMenu: goTitle }));
}

function afterCombat(combat: Combat): void {
  if (!run) return;
  const r = run;
  applyCombat(r, combat);
  playMusic('menu');
  const node = currentNode(r);
  if (combat.result === 'lose') {
    show(endScreen(r, false, finishRun(r, false), goHeroSelect, goTitle));
    return;
  }
  if (combat.result === 'win' && node.next.length === 0) {
    show(endScreen(r, true, finishRun(r, true), goHeroSelect, goTitle));
    return;
  }
  // Elites and act bosses pay better (bosses in legendary cards only).
  const picks = rollRewards(r, node.type === 'fight' ? 'fight' : node.type === 'boss' ? 'boss' : 'elite');
  saveRun(r);
  show(inAct(rewardScreen(r, picks, nextNode), r));
}

/** After a node: back to the map to choose the next one, or the victory screen at the end of the run. */
function nextNode(): void {
  if (!run) return;
  run.cleared = true;
  if (!currentNode(run).next.length) {
    show(endScreen(run, true, finishRun(run, true), goHeroSelect, goTitle));
    return;
  }
  goJourney();
}

function abandon(): void {
  clearRun();
  run = null;
  goTitle();
}

/**
 * Last resort for a bug: after an uncaught error the game's state can't be trusted (a throw in a frame even stops the
 * loop), so the only way on is a reload; the run resumes from its save at the start of the floor.
 */
function catchCrashes(): void {
  let crashed = false;
  const crash = (err: unknown): void => {
    if (crashed) return;
    crashed = true;
    suspendMusic(true);
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    const report = [`Punchcard ${__APP_VERSION__}`, navigator.userAgent, (err instanceof Error && err.stack) || msg].join('\n');
    const modal = openModal({
      title: t('crash.title'),
      body: h('div', null, h('p', null, t('crash.body')), h('code', { class: 'crash-detail' }, msg)),
      dismissable: false,
      actions: [
        { label: t('crash.restart'), cls: 'cta', onClick: () => location.reload() },
        {
          label: t('crash.copy'),
          cls: 'secondary crash-copy',
          onClick: () => {
            // No clipboard outside secure contexts (e.g. the dev server on the LAN): the error stays readable on screen.
            void navigator.clipboard?.writeText(report).then(
              () => {
                modal.el.querySelector('.crash-copy')!.textContent = t('crash.copied');
              },
              () => {},
            );
            return false;
          },
        },
      ],
    });
  };
  // Errors without an Error object ("Script error." from other origins, ResizeObserver notices) aren't ours.
  addEventListener('error', (e) => {
    if (e.error) crash(e.error);
  });
  addEventListener('unhandledrejection', (e) => crash(e.reason));
}

async function boot(): Promise<void> {
  setLocale(settings.locale);
  setStringValues(VALUES);
  setSfxVolume(settings.sfxVolume);
  setMusicVolume(settings.musicVolume);
  document.addEventListener('visibilitychange', () => suspendMusic(document.hidden));
  document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion);
  const root = document.getElementById('app')!;
  initApp(root);
  catchCrashes();
  initFx(root);
  // Browsers only allow audio after a user gesture.
  addEventListener('pointerdown', unlockAudio, { passive: true });
  addEventListener('keydown', unlockAudio);
  // Pixel art is generated from the vector sources once, before the first screen.
  await preloadArt({ creatures: CREATURES, icons: ICONS });
  // The employment contract only until it's signed; afterwards the game opens on the title.
  if (contractSigned()) goTitle();
  else show(splashScreen(goTitle));
  if (import.meta.env.DEV)
    Object.assign(window, {
      __game: {
        get run() {
          return run;
        },
        nextNode,
        goJourney,
        musicTrack,
      },
    });
}

void boot();
