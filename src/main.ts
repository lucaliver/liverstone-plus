import '@fontsource/silkscreen/400.css';
import '@fontsource/silkscreen/700.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import './styles/index.css';

import { setLocale, t } from './core/i18n';
import { randomSeed } from './core/rng';
import { setSfxEnabled, unlockAudio } from './audio/sfx';
import { playMusic, setMusicEnabled, suspendMusic } from './audio/music';
import { Combat } from './game/combat';
import { advance, applyCombat, clearRun, combatSetup, currentNode, loadRun, newRun, rollRewards, saveRun, type RunState } from './game/run';
import { settings } from './game/settings';
import type { HeroId } from './game/types';
import { confirmModal, initApp, show } from './ui/app';
import { initFx } from './ui/fx/fx';
import { preloadArt } from './ui/art/riso';
import { combatScreen } from './ui/combat/combatScreen';
import { endScreen } from './ui/screens/end';
import { heroSelectScreen } from './ui/screens/heroSelect';
import { journeyScreen } from './ui/screens/journey';
import { restScreen } from './ui/screens/rest';
import { rewardScreen } from './ui/screens/reward';
import { titleScreen } from './ui/screens/title';
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
        // A saved run whose node was already completed resumes at the next one.
        if (run.cleared && !advance(run)) {
          goTitle();
          return;
        }
        goJourney();
      },
      onNewRun: () => {
        if (loadRun()) confirmModal(t('menu.abandonConfirm'), t('common.confirm'), goHeroSelect, t('common.cancel'));
        else goHeroSelect();
      },
      onCompendium: () => show(compendiumScreen(goTitle)),
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

function goJourney(): void {
  if (!run) {
    goTitle();
    return;
  }
  playMusic('menu');
  saveRun(run);
  show(journeyScreen(run, enterNode, abandon));
}

function enterNode(): void {
  if (!run) return;
  const node = currentNode(run);
  if (node.type === 'rest') {
    playMusic('rest');
    show(restScreen(run, nextNode));
    return;
  }
  playMusic(node.type === 'boss' ? 'boss' : node.type === 'elite' ? 'elite' : 'combat');
  const combat = new Combat(combatSetup(run));
  if (import.meta.env.DEV) Object.assign(window, { __combat: combat });
  saveRun(run);
  show(combatScreen(run, combat, { onEnd: afterCombat, onQuit: abandon }));
}

function afterCombat(combat: Combat): void {
  if (!run) return;
  const r = run;
  applyCombat(r, combat);
  playMusic('menu');
  const node = currentNode(r);
  if (combat.result === 'lose') {
    clearRun();
    show(endScreen(r, false, () => goHeroSelect(), goTitle));
    return;
  }
  if (combat.result === 'win' && node.next.length === 0) {
    clearRun();
    show(endScreen(r, true, () => goHeroSelect(), goTitle));
    return;
  }
  const picks = node.type !== 'boss' ? rollRewards(r, node.type === 'elite' ? 'elite' : 'fight') : [];
  saveRun(r);
  show(rewardScreen(r, picks, nextNode));
}

function nextNode(): void {
  if (!run) return;
  if (!advance(run)) {
    clearRun();
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
  setSfxEnabled(settings.sound);
  setMusicEnabled(settings.music);
  document.addEventListener('visibilitychange', () => suspendMusic(document.hidden));
  document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion);
  const root = document.getElementById('app')!;
  initApp(root);
  initFx(root);
  // Browsers only allow audio after a user gesture.
  addEventListener('pointerdown', unlockAudio, { passive: true });
  addEventListener('keydown', unlockAudio);
  // Pixel art is generated from the vector sources once, before the first screen.
  await preloadArt();
  goTitle();
  if (import.meta.env.DEV)
    Object.assign(window, {
      __game: {
        get run() {
          return run;
        },
        nextNode,
        goJourney,
      },
    });
}

void boot();
