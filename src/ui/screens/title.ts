import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import type { Screen } from '../app';
import { h } from '../dom';
import { cardView } from '../components/cardView';
import { openHowTo, openSettings } from '../components/modals';

export interface TitleCallbacks {
  hasSave: boolean;
  onContinue: () => void;
  onNewRun: () => void;
}

export function titleScreen(cb: TitleCallbacks): Screen {
  const fan = h('div', { class: 'title-art', style: { margin: 'auto' } });
  const shown = ['bash', 'fireball', 'arcaneMissiles'];
  shown.forEach((id, i) => {
    const c = cardView({ uid: -1 - i, id, up: false });
    c.style.transform = `translateX(-50%) rotate(${(i - 1) * 14}deg)`;
    c.style.animationDelay = `${i * 0.4}s`;
    c.style.zIndex = String(i === 1 ? 2 : 1);
    fan.append(c);
  });
  const btn = (label: string, cls: string, fn: () => void): HTMLButtonElement =>
    h('button', { class: `btn block ${cls}`, onclick: () => (sfx('button'), fn()) }, label);

  const el = h(
    'div',
    { class: 'screen title-screen' },
    h('div', { class: 'bg-dungeon' }, h('div', { class: 'torch l' }), h('div', { class: 'torch r' })),
    h('h1', { class: 'logo', html: 'Cardstone<sup>+</sup>' }),
    h('p', { class: 'tagline' }, t('app.tagline')),
    fan,
    h(
      'div',
      { class: 'menu' },
      cb.hasSave ? btn(t('menu.continue'), '', cb.onContinue) : null,
      btn(t('menu.newRun'), cb.hasSave ? 'secondary' : '', cb.onNewRun),
      h(
        'div',
        { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } },
        btn(t('menu.howTo'), 'secondary small', () => openHowTo()),
        btn(t('menu.settings'), 'secondary small', () => openSettings()),
      ),
    ),
    h('div', { class: 'version' }, 'v0.1 · MVP'),
  );
  return { el };
}
