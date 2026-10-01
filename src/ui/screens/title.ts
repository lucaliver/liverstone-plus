import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { ENEMY_LIST } from '../../data/enemies';
import { enemyMet, neverPlayed, signContract } from '../../game/meta';
import { currentNode, type RunState, totalFloors } from '../../game/run';
import { burst, haptic } from '../fx/fx';
import type { Screen } from '../app';
import { h, onPress, retrigger } from '../dom';
import { creature } from '../art/creatures';
import { icon } from '../art/icons';
import { propArt } from '../art/rooms';
import { debugButton } from '../components/debugMenu';
import { darkEyes, dropLetters, motes } from '../components/decor';
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

/** A beat after the HIRED stamp lands, before the contract is pulled away (ms). */
const STAMP_BEAT_MS = 600;

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
    html: `<div class="poster-band"></div><div class="poster-boss">${creature(posterBoss())}</div><div class="poster-dim"></div><h1 class="logo">${t('app.title')}</h1><div class="poster-slogan">${t('menu.slogan')}</div><div class="poster-plate">${t('menu.plate')}</div>`,
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
  const first = !save && neverPlayed();
  const node = save ? currentNode(save) : null;
  const card = h(
    'button',
    {
      class: first ? 'timecard-cta first' : 'timecard-cta',
      'data-act': node ? String(node.act) : undefined,
      'aria-label': save ? t('menu.continue') : t('menu.newRun'),
    },
    h('span', { class: 'tc-holes', 'aria-hidden': 'true' }),
    h('span', { class: 'tc-title' }, t('combat.timeCard')),
    h('b', { class: 'tc-action', html: `${icon(save ? 'play' : 'plus')}<span>${save ? t('menu.continue') : t('menu.newRun')}</span>` }),
    save && node
      ? h('span', {
          class: 'tc-run',
          html: `${creature(save.hero)}<span>${t(`hero.${save.hero}.name`)} · ${t('common.floorOf', { a: node.act, n: node.floor, total: totalFloors(save) })} · ${icon('heart')}${save.hp}/${save.maxHp}</span>`,
        })
      : first
        ? // The very first launch: a hand taps the card so nobody wonders where to start.
          h('span', { class: 'tc-run tc-tap', html: `${icon('hand')}<span>${t('menu.tapHint')}</span>` })
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
    ),
    // Temporary: a small floating button, off the menu's layout.
    debugButton(t('debug.button'), cb.onDebugFight),
  );
  return {
    el,
    leave() {
      clearTimeout(timer);
    },
  };
}

/** How long the signature takes to hold (ms). */
const SIGN_MS = 900;

/**
 * The very first screen, until it's signed: a skeleton's hand slides an employment contract across the desk, and it is
 * signed with a hold (a pen writes the signature as the hold goes on), which teaches "hold to learn" (the terms can be held
 * to read them, and must be read first). That gesture also lets the browser play sound.
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
  const pen = h('div', { class: 'contract-pen', 'aria-hidden': 'true', html: propArt('pen') });
  const line = h('div', { class: 'contract-line' }, signature, stamp, pen, h('span', null, t('contract.signHere')));
  const action = h('button', { class: 'btn cta sign-btn', html: `<span class="fill"></span>${icon('pen')}<span>${t('contract.sign')}</span>` });
  const contract = h(
    'div',
    { class: 'contract' },
    h('h2', null, t('contract.title')),
    h('p', null, t('contract.intro')),
    h('ol', null, h('li', null, t('contract.c1')), h('li', null, t('contract.c2')), h('li', null, t('contract.c3'))),
    terms,
    h('div', { class: 'contract-fine', 'aria-hidden': 'true', html: SCRIBBLES }),
    line,
    h('div', { class: 'contract-hand', 'aria-hidden': 'true', html: propArt('hand') }),
  );
  const cancel = (): void => {
    clearTimeout(timer);
    action.classList.remove('holding');
    line.classList.remove('signing');
  };
  /** Once the HIRED stamp has landed: the desk jolts, paper flies, and the contract is pulled away before the title. */
  const stampLanded = (e: Event): void => {
    if (e.target !== stamp) return;
    stamp.removeEventListener('animationend', stampLanded);
    const r = stamp.getBoundingClientRect();
    burst('paper', r.left + r.width / 2, r.top + r.height / 2, 26, 1.3);
    retrigger(contract, 'shake-big');
    sfx('stamp');
    timer = window.setTimeout(() => {
      contract.classList.add('pulled');
      contract.addEventListener('animationend', (ev) => ev.target === contract && onStart(), { once: true });
    }, STAMP_BEAT_MS);
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
    line.classList.add('signing');
    haptic('tap');
    timer = window.setTimeout(() => {
      signContract();
      action.classList.remove('holding');
      action.classList.add('signed');
      line.classList.replace('signing', 'done');
      signature.classList.add('done');
      stamp.classList.add('in');
      stamp.addEventListener('animationend', stampLanded);
      sfx('punchClock');
      haptic('ability');
    }, SIGN_MS);
  });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel'])
    action.addEventListener(ev, () => !action.classList.contains('signed') && cancel());
  const el = h(
    'div',
    { class: 'screen splash' },
    h('div', { class: 'splash-band', 'aria-hidden': 'true' }),
    h('div', { class: 'splash-desk', 'aria-hidden': 'true' }),
    h('div', {
      class: 'splash-dark',
      html: `${motes(10, ['var(--y)', 'var(--p)'])}${darkEyes([
        { x: '7%', y: '7%' },
        { x: '84%', y: '12%' },
        { x: '5%', y: '58%' },
      ])}`,
    }),
    h('h1', { class: 'logo', 'aria-label': t('app.title'), html: dropLetters(t('app.title')) }),
    contract,
    action,
  );
  return {
    el,
    leave() {
      clearTimeout(timer);
    },
  };
}

/** Lines of tiny grey scribbles standing in for the fine print: wavy strokes of uneven height, each row ending short of the edge. */
const SCRIBBLES = (() => {
  const amp = [3, 5, 2, 4, 3, 2, 5, 3];
  const rows = [296, 288, 292, 190]
    .map((width, r) => {
      const y = 6 + r * 9;
      let d = `M2 ${y}`;
      for (let x = 2, i = r; x < width; x += 5, i++) d += `q2.5 ${-amp[i % amp.length]} 5 0`;
      return `<path d="${d}"/>`;
    })
    .join('');
  return `<svg viewBox="0 0 300 40" preserveAspectRatio="none"><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">${rows}</g></svg>`;
})();

/** A hand-written scribble for the signature line (drawn in steps when signing). */
const SIGNATURE = `<svg viewBox="0 0 200 50" aria-hidden="true"><path d="M8 34c10-22 18-26 20-14s-6 22 2 18 12-26 18-24-2 26 6 22 8-16 14-14 0 12 6 10 10-12 16-12 2 10 8 10 16-8 22-10 6 6 12 6 18-4 24-6" fill="none" stroke="#1c5fd0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
