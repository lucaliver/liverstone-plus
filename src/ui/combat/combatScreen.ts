import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { CONFIG, GAME_SPEEDS } from '../../data/config';
import type { Combat } from '../../game/combat';
import type { RunState } from '../../game/run';
import { saveSettings, settings } from '../../game/settings';
import { type ModalHandle, openModal, type Screen } from '../app';
import { openHowTo, openSettings, speedSelector } from '../components/modals';
import { h, setText } from '../dom';
import { burst, haptic } from '../fx/fx';
import { createCardLayer } from './cardLayer';
import { bindCombatFx } from './combatFx';
import { createHud } from './hud';
import { createCombatView } from './view';

export { ABILITY_ICON } from './view';

export interface CombatCallbacks {
  onEnd: (c: Combat) => void;
  onQuit: () => void;
}

/** Fixed simulation step: the engine stays deterministic regardless of frame rate. */
const STEP = 1 / 60;

/** The combat screen: wires the view, HUD, card layer and FX together and owns pause and the game loop. */
export function combatScreen(run: RunState, combat: Combat, cb: CombatCallbacks): Screen {
  const v = createCombatView(run, combat);
  const { el, r, state } = v;
  let pauseModal: ModalHandle | null = null;
  let beltOffset = 0;
  let acc = 0;

  const hud = createHud(v);
  // Inspecting a card, status or ability pauses the fight; closing it resumes unless the pause menu is open.
  v.inspect = (open) => {
    state.paused = open || !!pauseModal;
  };
  const cards = createCardLayer(v);

  const finish = (result: 'win' | 'lose'): void => {
    if (state.ended) return;
    state.ended = true;
    cards.cancelDrag();
    if (result === 'win') {
      r.enemyArt.classList.add('dead');
      const p = v.enemyPoint();
      burst('gold', p.x, p.y, 40, 1.5);
      v.banner(t('reward.victory'));
      sfx('victory');
    } else {
      v.banner(t('end.defeat'), true);
      sfx('defeat');
      haptic([60, 60, 120]);
    }
    setTimeout(() => cb.onEnd(combat), 1500);
  };
  const unsubscribe = bindCombatFx(v, cards, finish);

  // ------------------------------------------------------------------ layout
  const layout = (): void => {
    state.beltW = r.belt.clientWidth || el.clientWidth;
    // Cards follow the belt width, but shrink on short screens so the layout always fits.
    const cw = Math.min(state.beltW * CONFIG.cardWidth, el.clientHeight * 0.118);
    el.style.setProperty('--cw-belt', `${Math.round(cw)}px`);
    // Measure the enemy's room once (with the belt size applied) and lock the sprite size.
    requestAnimationFrame(() => {
      // The wrapper is flex: 1 with min-height 0, so its height is the free room, independent of the sprite.
      const size = Math.max(72, Math.min(256, r.enemyWrap.clientHeight));
      el.style.setProperty('--enemy-size', `${size}px`);
    });
  };

  // ------------------------------------------------------------------ controls
  r.ability.addEventListener('click', () => {
    if (state.paused || state.ended) return;
    if (!combat.useAbility()) {
      sfx('error');
      v.toast(t(`hero.${v.heroId}.resourceDesc`));
    }
  });

  const renderSpeed = (): void => setText(r.speed, `${settings.speed}×`);
  r.speed.addEventListener('click', () => {
    const i = GAME_SPEEDS.indexOf(settings.speed as (typeof GAME_SPEEDS)[number]);
    settings.speed = GAME_SPEEDS[(i + 1) % GAME_SPEEDS.length];
    saveSettings();
    renderSpeed();
    sfx('tap');
  });

  const openPause = (): void => {
    if (pauseModal || state.ended) return;
    cards.cancelDrag();
    state.paused = true;
    sfx('button');
    const body = h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
      h('div', { class: 'setting' }, h('span', null, t('settings.speed')), speedSelector(renderSpeed)),
    );
    pauseModal = openModal({
      title: t('combat.paused'),
      body,
      actions: [
        { label: t('combat.resume') },
        {
          label: t('menu.howTo'),
          cls: 'secondary',
          onClick: () => {
            openHowTo();
            return false;
          },
        },
        {
          label: t('menu.settings'),
          cls: 'secondary',
          onClick: () => {
            openSettings(renderSpeed);
            return false;
          },
        },
        {
          label: t('combat.quit'),
          cls: 'danger',
          onClick: () => {
            openModal({
              body: t('journey.abandonConfirm'),
              actions: [
                { label: t('common.confirm'), cls: 'danger', onClick: () => cb.onQuit() },
                { label: t('common.cancel'), cls: 'secondary' },
              ],
            });
            return false;
          },
        },
      ],
      onClose: () => {
        pauseModal = null;
        state.paused = false;
      },
    });
  };
  r.pause.addEventListener('click', openPause);

  const onVisibility = (): void => {
    if (document.hidden) openPause();
  };
  const onResize = (): void => layout();

  // ------------------------------------------------------------------ loop
  const render = (dt: number): void => {
    state.frameNo++;
    hud.render();
    cards.render();
    if (!state.paused && !state.ended && combat.intro <= 0) {
      beltOffset -= (dt * settings.speed * combat.beltRate() * state.beltW) / CONFIG.beltTime;
      r.track.style.setProperty('--belt-x', `${Math.round(beltOffset % 26)}px`);
    }
  };

  return {
    el,
    enter() {
      layout();
      renderSpeed();
      addEventListener('resize', onResize);
      document.addEventListener('visibilitychange', onVisibility);
      render(0);
      const start = (): void => {
        v.banner(t('combat.fight'));
        state.paused = false;
      };
      if (!settings.seenTutorial) {
        state.paused = true;
        setTimeout(
          () =>
            openHowTo(() => {
              settings.seenTutorial = true;
              saveSettings();
              start();
            }, true),
          350,
        );
      } else {
        start();
      }
    },
    leave() {
      unsubscribe();
      removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    },
    frame(dt) {
      if (!state.paused && !state.ended) {
        acc += dt * settings.speed;
        let steps = 0;
        while (acc >= STEP && steps < 12) {
          combat.tick(STEP);
          acc -= STEP;
          steps++;
        }
        if (steps === 12) acc = 0;
      }
      render(dt);
    },
  };
}
