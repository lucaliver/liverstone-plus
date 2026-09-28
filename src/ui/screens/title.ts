import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { ENEMY_LIST } from '../../data/enemies';
import { enemyMet } from '../../game/meta';
import { currentNode, type RunState, totalFloors } from '../../game/run';
import { haptic } from '../fx/fx';
import type { Screen } from '../app';
import { h } from '../dom';
import { creature } from '../art/creatures';
import { icon } from '../art/icons';
import { openHowTo, openSettings } from '../components/modals';

export interface TitleCallbacks {
  /** The run in progress, if any: the time card shows it and clocks back in. */
  save: RunState | null;
  onContinue: () => void;
  onNewRun: () => void;
  onCompendium: () => void;
  /** Temporary: fight any enemy with any hero. */
  onDebugFight: () => void;
  onResetProgress: () => void;
}

/** How long the time card takes to slide into the clock before the next screen (ms). */
const PUNCH_MS = 380;

/** The boss on the poster: the first one not met yet (the last one once they all have been). */
function posterBoss(): string {
  const bosses = ENEMY_LIST.filter((e) => e.tier === 'boss').sort((a, b) => a.act - b.act);
  return (bosses.find((b) => !enemyMet(b.id)) ?? bosses[bosses.length - 1]).art;
}

/**
 * The home: a propaganda poster on the wall (the boss in two inks, the logo on a yellow block, a stamped slogan),
 * then a desk with the time card to punch in (a new run, or the one in progress) and the rest of the menu.
 */
export function titleScreen(cb: TitleCallbacks): Screen {
  let timer = 0;
  const btn = (ic: string, label: string, cls: string, fn: () => void): HTMLButtonElement =>
    h('button', {
      class: `btn block ${cls}`,
      onclick: () => {
        sfx('button');
        haptic('tap');
        fn();
      },
      html: `${icon(ic)}<span>${label}</span>`,
    });

  const poster = h('div', {
    class: 'poster',
    html: `<div class="poster-band"></div><div class="poster-boss">${creature(posterBoss())}</div><h1 class="logo">${t('app.title')}</h1><div class="poster-slogan">${t('menu.slogan')}</div><div class="poster-plate">${t('menu.plate')}</div>`,
  });

  // The time card: tap it and it slides into the clock (ka-chunk), then the shift starts.
  const save = cb.save;
  const node = save ? currentNode(save) : null;
  const card = h(
    'button',
    { class: 'timecard-cta', 'aria-label': save ? t('menu.continue') : t('menu.newRun') },
    h('span', { class: 'tc-holes', 'aria-hidden': 'true' }),
    h('span', { class: 'tc-title' }, t('combat.timeCard')),
    h('b', { class: 'tc-action' }, save ? t('menu.continue') : t('menu.newRun')),
    save && node
      ? h('span', {
          class: 'tc-run',
          html: `${creature(save.hero)}<span>${t(`hero.${save.hero}.name`)} · ${t('common.floorOf', { a: node.act, n: node.floor, total: totalFloors(save) })} · ${icon('heart')}${save.hp}/${save.maxHp}</span>`,
        })
      : h('span', { class: 'tc-run' }, t('menu.freshDay')),
  );
  card.addEventListener('click', () => {
    if (card.classList.contains('punching')) return;
    card.classList.add('punching');
    sfx('punchClock');
    haptic('tap');
    timer = window.setTimeout(save ? cb.onContinue : cb.onNewRun, PUNCH_MS);
  });

  const el = h(
    'div',
    { class: 'screen title-screen' },
    poster,
    h('div', { class: 'desk' }, card, h('div', { class: 'desk-clock', html: creature('timeClock') })),
    h(
      'div',
      { class: 'menu' },
      save ? btn('plus', t('menu.newRun'), 'secondary small', cb.onNewRun) : null,
      btn('book', t('menu.compendium'), 'secondary small', cb.onCompendium),
      btn('question', t('menu.howTo'), 'secondary small', () => openHowTo()),
      btn('gear', t('menu.settings'), 'secondary small', () => openSettings()),
      btn('bug', t('debug.button'), 'secondary small debug-btn', cb.onDebugFight),
      btn('trash', t('menu.reset'), 'danger small', cb.onResetProgress),
    ),
  );
  return {
    el,
    leave() {
      clearTimeout(timer);
    },
  };
}

/** The very first screen: one tap to start, which also lets the browser play sound. */
export function splashScreen(onStart: () => void): Screen {
  const el = h(
    'div',
    { class: 'screen splash' },
    h('div', { class: 'splash-band', 'aria-hidden': 'true' }),
    h('h1', { class: 'logo' }, t('app.title')),
    h('p', { class: 'splash-tagline' }, t('menu.tagline')),
    h('div', { class: 'splash-art', html: creature('timeClock') }),
    h('button', {
      class: 'btn cta',
      onclick: () => {
        sfx('button');
        haptic('tap');
        onStart();
      },
      html: `${icon('play')}<span>${t('menu.start')}</span>`,
    }),
    h('div', { class: 'version' }, `v${__APP_VERSION__}`),
  );
  return { el };
}
