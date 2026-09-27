import { t } from '../../core/i18n';
import { audioUnlocked, onAudioUnlock, sfx } from '../../audio/sfx';
import { settings } from '../../game/settings';
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
}

/** Office and factory props around the boss (sprite id, position class). */
const TITLE_PROPS: [string, string][] = [
  ['filingCabinet', 'l'],
  ['moneyBag', 'l2'],
  ['timeClock', 'r'],
  ['toxicBarrel', 'r2'],
];

export function titleScreen(cb: TitleCallbacks): Screen {
  const btn = (label: string, cls: string, fn: () => void): HTMLButtonElement =>
    h(
      'button',
      {
        class: `btn block ${cls}`,
        onclick: () => {
          sfx('button');
          fn();
        },
      },
      label,
    );

  // Browsers only allow audio after a first tap: say so, and hide the hint as soon as sound is on.
  const soundHint = settings.music || settings.sound ? h('div', { class: 'sound-hint', html: `${icon('horn')}${t('menu.tapForSound')}` }) : null;
  if (soundHint) {
    // Hide it in place: removing it would shift the menu under the finger mid-tap.
    const hide = (): void => {
      soundHint.style.visibility = 'hidden';
    };
    if (audioUnlocked()) hide();
    else onAudioUnlock(hide);
  }

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
      cb.hasSave ? btn(t('menu.continue'), 'cta', cb.onContinue) : null,
      btn(t('menu.newRun'), cb.hasSave ? 'secondary' : 'cta', cb.onNewRun),
      btn(t('menu.compendium'), 'secondary small', cb.onCompendium),
      h(
        'div',
        { class: 'row' },
        btn(t('menu.howTo'), 'secondary small', () => openHowTo()),
        btn(t('menu.settings'), 'secondary small', () => openSettings()),
      ),
    ),
    soundHint,
    h('div', { class: 'version' }, `v${__APP_VERSION__}`),
  );
  return { el };
}
