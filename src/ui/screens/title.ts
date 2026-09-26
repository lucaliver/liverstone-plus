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
}

export function titleScreen(cb: TitleCallbacks): Screen {
  const btn = (label: string, cls: string, fn: () => void): HTMLButtonElement =>
    h('button', { class: `btn block ${cls}`, onclick: () => (sfx('button'), fn()) }, label);

  const el = h(
    'div',
    { class: 'screen title-screen' },
    h('h1', { class: 'logo', html: 'Cardstone<span class="plus">+</span>' }),
    h('p', { class: 'tagline' }, t('app.tagline')),
    h('div', {
      class: 'title-hero',
      html: `${motes(18)}${darkEyes([{ x: '8%', y: '20%' }, { x: '82%', y: '12%' }, { x: '76%', y: '70%' }])}<div class="candle l">${icon('flame')}</div><div class="candle r">${icon('flame')}</div>${creature('lich')}`,
    }),
    h(
      'div',
      { class: 'menu' },
      cb.hasSave ? btn(t('menu.continue'), '', cb.onContinue) : null,
      btn(t('menu.newRun'), cb.hasSave ? 'secondary' : '', cb.onNewRun),
      btn(t('menu.compendium'), 'secondary small', cb.onCompendium),
      h('div', { class: 'row' }, btn(t('menu.howTo'), 'secondary small', () => openHowTo()), btn(t('menu.settings'), 'secondary small', () => openSettings())),
    ),
    h('div', { class: 'version' }, 'v0.3 · MVP'),
  );
  return { el };
}
