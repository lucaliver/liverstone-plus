import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { ENEMY_LIST } from '../../data/enemies';
import { enemyMet, signContract } from '../../game/meta';
import { settings } from '../../game/settings';
import { currentNode, type RunState, totalFloors } from '../../game/run';
import { haptic } from '../fx/fx';
import type { Screen } from '../app';
import { h, onPress, retrigger } from '../dom';
import { creature } from '../art/creatures';
import { icon } from '../art/icons';
import { openHowTo, openInfo, openSettings } from '../components/modals';

export interface TitleCallbacks {
  /** The run in progress, if any: the time card shows it and clocks back in. */
  save: RunState | null;
  onContinue: () => void;
  onNewRun: () => void;
  onCompendium: () => void;
  /** Temporary: fight any enemy with any hero. */
  onDebugFight: () => void;
}

/** Holes the logo takes before it's swapped for a fresh one. */
const LOGO_HOLES = 7;

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
  // A little secret: tapping the logo punches a hole in it (a few at most, then the plate is fresh again).
  const logo = poster.querySelector<HTMLElement>('.logo')!;
  logo.addEventListener('click', () => {
    const holes = logo.querySelectorAll('.logo-hole');
    if (holes.length >= LOGO_HOLES) for (const x of holes) x.remove();
    logo.append(h('span', { class: 'logo-hole', style: { left: `${8 + Math.random() * 84}%`, top: `${12 + Math.random() * 60}%` } }));
    retrigger(logo, 'punched');
    sfx('punchClock');
    haptic('tap');
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

  // Sound carries the fight (hits are announced by ear): with it muted, a note suggests turning it on.
  const soundTip = h('button', {
    class: 'sound-tip',
    html: `${icon('speaker')}<span>${t('menu.soundTip')}</span>`,
    onclick: () => {
      sfx('tap');
      openSettings();
    },
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
    ),
    soundTip,
    // Temporary: a small floating button, off the menu's layout.
    h('button', {
      class: 'icon-btn debug-fab',
      'aria-label': t('debug.button'),
      html: icon('bug'),
      onclick: () => {
        sfx('tap');
        cb.onDebugFight();
      },
    }),
  );
  return {
    el,
    frame() {
      soundTip.hidden = settings.sfxVolume > 0;
    },
    leave() {
      clearTimeout(timer);
    },
  };
}

/** How long the signature takes to hold (ms). */
const SIGN_MS = 900;

/**
 * The very first screen, until it's signed: an employment contract, signed with a hold, which teaches "hold to learn"
 * (the terms can be held to read them, and must be read first). That gesture also lets the browser play sound.
 */
export function splashScreen(onStart: () => void): Screen {
  let timer = 0;
  /** The terms must be read before signing (that's where "hold to learn" is taught). */
  let read = false;
  const terms = h('button', { class: 'contract-terms', html: `${icon('magnifier')}<span>${t('contract.terms')}</span>` });
  onPress(terms, () => {
    read = true;
    sfx('tap');
    openInfo({ icon: 'magnifier', title: t('contract.termsTitle'), desc: t('contract.termsText') });
  });
  const signature = h('div', { class: 'contract-sig', html: SIGNATURE });
  const stamp = h('div', { class: 'contract-stamp' }, t('contract.hired'));
  const action = h('button', { class: 'btn cta sign-btn', html: `<span class="fill"></span>${icon('pen')}<span>${t('contract.sign')}</span>` });
  const cancel = (): void => {
    clearTimeout(timer);
    action.classList.remove('holding');
  };
  action.addEventListener('pointerdown', () => {
    if (!read) {
      retrigger(terms, 'shake-big');
      retrigger(action, 'shake-small');
      sfx('error');
      haptic('error');
      return;
    }
    action.classList.add('holding');
    haptic('tap');
    timer = window.setTimeout(() => {
      signContract();
      action.classList.remove('holding');
      action.classList.add('signed');
      signature.classList.add('done');
      stamp.classList.add('in');
      sfx('punchClock');
      haptic('ability');
      timer = window.setTimeout(onStart, 1100);
    }, SIGN_MS);
  });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel'])
    action.addEventListener(ev, () => !action.classList.contains('signed') && cancel());
  const el = h(
    'div',
    { class: 'screen splash' },
    h('div', { class: 'splash-band', 'aria-hidden': 'true' }),
    h('h1', { class: 'logo' }, t('app.title')),
    h(
      'div',
      { class: 'contract' },
      h('h2', null, t('contract.title')),
      h('p', null, t('contract.intro')),
      h('ol', null, h('li', null, t('contract.c1')), h('li', null, t('contract.c2')), h('li', null, t('contract.c3'))),
      terms,
      h('div', { class: 'contract-line' }, signature, stamp, h('span', null, t('contract.signHere'))),
    ),
    action,
    h('div', { class: 'version' }, `v${__APP_VERSION__}`),
  );
  return {
    el,
    leave() {
      clearTimeout(timer);
    },
  };
}

/** A hand-written scribble for the signature line (drawn in steps when signing). */
const SIGNATURE = `<svg viewBox="0 0 200 50" aria-hidden="true"><path d="M8 34c10-22 18-26 20-14s-6 22 2 18 12-26 18-24-2 26 6 22 8-16 14-14 0 12 6 10 10-12 16-12 2 10 8 10 16-8 22-10 6 6 12 6 18-4 24-6" fill="none" stroke="#1c5fd0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
