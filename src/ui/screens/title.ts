import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import type { Screen } from '../app';
import { h } from '../dom';
import { creature } from '../art/creatures';
import { openHowTo, openSettings } from '../components/modals';

export interface TitleCallbacks {
  hasSave: boolean;
  onContinue: () => void;
  onNewRun: () => void;
}

export function titleScreen(cb: TitleCallbacks): Screen {
  const btn = (label: string, cls: string, fn: () => void): HTMLButtonElement =>
    h('button', { class: `btn block ${cls}`, onclick: () => (sfx('button'), fn()) }, label);

  const el = h(
    'div',
    { class: 'screen title-screen' },
    h('h1', { class: 'logo', html: 'Cardstone<span class="plus">+</span>' }),
    h('p', { class: 'tagline' }, t('app.tagline')),
    h('div', { class: 'title-hero', html: `<div class="sun"></div>${creature('lich')}` }),
    h(
      'div',
      { class: 'menu' },
      cb.hasSave ? btn(t('menu.continue'), '', cb.onContinue) : null,
      btn(t('menu.newRun'), cb.hasSave ? 'secondary' : '', cb.onNewRun),
      h('div', { class: 'row' }, btn(t('menu.howTo'), 'secondary small', () => openHowTo()), btn(t('menu.settings'), 'secondary small', () => openSettings())),
    ),
    h('div', { class: 'version' }, 'v0.2 · MVP'),
  );
  return { el };
}
