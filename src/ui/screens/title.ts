import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import type { Screen } from '../app';
import { h } from '../dom';
import { creature } from '../art/creatures';
import { icon } from '../art/icons';
import { darkEyes, motes } from '../components/decor';
import { openHowTo, openSettings } from '../components/modals';

export interface TitleCallbacks {
  hasSave: boolean;
  onContinue: () => void;
  onNewRun: () => void;
  onCompendium: () => void;
  /** Temporary: fight any enemy with any hero. */
  onDebugFight: () => void;
  onResetProgress: () => void;
}

/** Office and factory props around the boss (sprite id, position class). */
const TITLE_PROPS: [string, string][] = [
  ['filingCabinet', 'l'],
  ['moneyBag', 'l2'],
  ['timeClock', 'r'],
  ['toxicBarrel', 'r2'],
];

export function titleScreen(cb: TitleCallbacks): Screen {
  const btn = (ic: string, label: string, cls: string, fn: () => void): HTMLButtonElement =>
    h('button', {
      class: `btn block ${cls}`,
      onclick: () => {
        sfx('button');
        fn();
      },
      html: `${icon(ic)}<span>${label}</span>`,
    });

  const el = h(
    'div',
    { class: 'screen title-screen' },
    h('h1', { class: 'logo' }, t('app.title')),
    h('div', {
      class: 'title-hero',
      html: `${motes(18)}${darkEyes([
        { x: '8%', y: '20%' },
        { x: '82%', y: '12%' },
        { x: '76%', y: '70%' },
      ])}${TITLE_PROPS.map(([id, cls]) => `<div class="prop ${cls}">${creature(id)}</div>`).join('')}${creature('ceo')}`,
    }),
    h(
      'div',
      { class: 'menu' },
      cb.hasSave ? btn('play', t('menu.continue'), 'cta', cb.onContinue) : null,
      btn('plus', t('menu.newRun'), cb.hasSave ? 'secondary' : 'cta', cb.onNewRun),
      btn('book', t('menu.compendium'), 'secondary small', cb.onCompendium),
      h(
        'div',
        { class: 'row' },
        btn('question', t('menu.howTo'), 'secondary small', () => openHowTo()),
        btn('gear', t('menu.settings'), 'secondary small', () => openSettings()),
      ),
      h(
        'div',
        { class: 'row' },
        btn('bug', t('debug.button'), 'secondary small debug-btn', cb.onDebugFight),
        btn('trash', t('menu.reset'), 'danger small', cb.onResetProgress),
      ),
    ),
    h('div', { class: 'version' }, `v${__APP_VERSION__}`),
  );
  return { el };
}

/** The very first screen: one tap to start, which also lets the browser play sound. */
export function splashScreen(onStart: () => void): Screen {
  const el = h(
    'div',
    { class: 'screen splash' },
    h('h1', { class: 'logo' }, t('app.title')),
    h('div', { class: 'splash-art', html: creature('timeClock') }),
    h('button', {
      class: 'btn cta',
      onclick: () => {
        sfx('button');
        onStart();
      },
      html: `${icon('play')}<span>${t('menu.start')}</span>`,
    }),
    h('div', { class: 'version' }, `v${__APP_VERSION__}`),
  );
  return { el };
}
