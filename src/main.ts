import '@fontsource/silkscreen/400.css';
import '@fontsource/silkscreen/700.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import './styles/index.css';

import { setLocale, t } from './core/i18n';
import { randomSeed } from './core/rng';
import { clearAll } from './core/save';
import { setSfxVolume, unlockAudio } from './audio/sfx';
import { musicTrack, playMusic, setMusicVolume, suspendMusic } from './audio/music';
import { Combat } from './game/combat';
import {
  advance,
  applyCombat,
  clearRun,
  combatSetup,
  currentNode,
  finishRun,
  loadRun,
  newRun,
  rollRewards,
  saveRun,
  type RunState,
} from './game/run';
import { settings } from './game/settings';
import type { HeroId } from './game/types';
import { confirmModal, initApp, show } from './ui/app';
import { openDebugFight } from './ui/components/modals';
import { initFx } from './ui/fx/fx';
import { preloadArt } from './ui/art/riso';
import { CREATURES } from './ui/art/creatures';
import { ICONS } from './ui/art/icons';
import { combatScreen } from './ui/combat/combatScreen';
import { endScreen } from './ui/screens/end';
import { heroSelectScreen } from './ui/screens/heroSelect';
import { journeyScreen } from './ui/screens/journey';
import { restScreen } from './ui/screens/rest';
import { promotionScreen } from './ui/screens/promotion';
import { rewardScreen } from './ui/screens/reward';
import { splashScreen, titleScreen } from './ui/screens/title';
import { compendiumScreen } from './ui/screens/compendium';

let run: RunState | null = null;

function goTitle(): void {
  playMusic('menu');
  const saved = loadRun();
  show(
    titleScreen({
      hasSave: !!saved,
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
      onResetProgress: () =>
        confirmModal(
          t('menu.resetConfirm'),
          t('common.confirm'),
          () => {
            clearAll();
            location.reload();
          },
          t('common.cancel'),
        ),
      onDebugFight: () => {
        const pick = (): void => void openDebugFight(debugFight);
        if (loadRun()) confirmModal(t('menu.abandonConfirm'), t('common.confirm'), pick, t('common.cancel'));
        else pick();
      },
    }),
  );
}

function goHeroSelect(): void {
  show(heroSelectScreen(startRun, goTitle));
}

function startRun(hero: HeroId): void {
  run = newRun(hero, randomSeed());
  goJourney();
}

/** Debug: a fresh run whose first fight is against the chosen enemy. */
function debugFight(hero: HeroId, enemy: string): void {
  run = newRun(hero, randomSeed());
  run.nodes[run.current].enemy = enemy;
  enterNode();
}

function goJourney(): void {
  if (!run) {
    goTitle();
    return;
  }
  playMusic('menu');
  saveRun(run);
  show(journeyScreen(run, enterNode, goTitle));
}

/** Enters the current node, or first moves to `to` when the current one is already cleared. */
function enterNode(to?: number): void {
  if (!run) return;
  if (run.cleared && !advance(run, to)) return;
  const node = currentNode(run);
  if (node.type === 'rest' || node.type === 'promotion') {
    playMusic('rest');
    show(node.type === 'rest' ? restScreen(run, nextNode) : promotionScreen(run, nextNode));
    return;
  }
  playMusic(node.type === 'boss' ? 'boss' : node.type === 'elite' ? 'elite' : 'combat');
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
    finishRun(r);
    show(endScreen(r, false, () => goHeroSelect(), goTitle));
    return;
  }
  if (combat.result === 'win' && node.next.length === 0) {
    finishRun(r);
    show(endScreen(r, true, () => goHeroSelect(), goTitle));
    return;
  }
  // Elites and act bosses pay better.
  const picks = rollRewards(r, node.type === 'fight' ? 'fight' : 'elite');
  saveRun(r);
  show(rewardScreen(r, picks, nextNode));
}

/** After a node: back to the map to choose the next one, or the victory screen at the end of the run. */
function nextNode(): void {
  if (!run) return;
  run.cleared = true;
  if (!currentNode(run).next.length) {
    finishRun(run);
    show(endScreen(run, true, () => goHeroSelect(), goTitle));
    return;
  }
  goJourney();
}

function abandon(): void {
  clearRun();
  run = null;
  goTitle();
}

async function boot(): Promise<void> {
  setLocale(settings.locale);
  setSfxVolume(settings.sfxVolume);
  setMusicVolume(settings.musicVolume);
  document.addEventListener('visibilitychange', () => suspendMusic(document.hidden));
  document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion);
  const root = document.getElementById('app')!;
  initApp(root);
  initFx(root);
  // Browsers only allow audio after a user gesture.
  addEventListener('pointerdown', unlockAudio, { passive: true });
  addEventListener('keydown', unlockAudio);
  // Pixel art is generated from the vector sources once, before the first screen.
  await preloadArt({ creatures: CREATURES, icons: ICONS });
  show(splashScreen(goTitle));
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
