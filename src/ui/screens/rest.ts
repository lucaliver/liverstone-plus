import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { canUpgrade, rest, restHeal, upgradeCard, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h } from '../dom';
import { icon } from '../art/icons';
import { creature } from '../art/creatures';
import { CARD_SHOW_MS, playCardChange } from '../components/cardShow';
import { openDeck } from '../components/modals';
import { closeRoom, roomOption } from '../components/room';
import { motes } from '../components/decor';
import { runHud } from './journey';

export const HEAL_ANIM_MS = 1900;

/** Pixel hearts float up from the bottom of the screen, then "+N" pops in the middle (with a `note` under it, e.g. "max HP"). */
export function playHealing(screen: HTMLElement, amount: number, note?: string): void {
  sfx('heal');
  const layer = h('div', { class: 'heal-rise', 'aria-hidden': 'true' });
  for (let i = 0; i < 18; i++) {
    const heart = h('i', { html: icon('heart') });
    heart.style.left = `${5 + Math.random() * 90}%`;
    heart.style.setProperty('--d', `${(1 + Math.random() * 0.7).toFixed(2)}s`);
    heart.style.setProperty('--dl', `${(Math.random() * 0.6).toFixed(2)}s`);
    heart.style.setProperty('--s', `${Math.round(18 + Math.random() * 22)}px`);
    layer.append(heart);
  }
  layer.append(h('div', { class: 'heal-total' }, `+${amount}`, note ? h('small', null, note) : null));
  screen.append(layer);
  setTimeout(() => sfx('heal'), 700);
}

export function restScreen(run: RunState, onDone: () => void): Screen {
  const heal = restHeal(run);
  const upgradable = run.deck.filter(canUpgrade);

  const el = h(
    'div',
    { class: 'screen' },
    runHud(run),
    h('h1', { class: 'h1', style: { marginTop: '12px' } }, t('rest.title')),
    h('p', { class: 'sub' }, t('rest.desc')),
    h('div', {
      class: 'rest-fire',
      // The break room's coffee machine, with steam drifting up.
      html: `${motes(14, ['var(--paper)', 'var(--paper)', 'var(--y)'])}<div class="coffee-machine">${creature('coffeeMachine')}</div>`,
    }),
    h(
      'div',
      { class: 'rest-options' },
      roomOption('heart', t('rest.heal'), heal > 0 ? t('rest.healDesc', { n: heal }) : t('rest.full'), heal <= 0, () => {
        const healed = rest(run);
        playHealing(el, healed);
        closeRoom(el, onDone, HEAL_ANIM_MS);
      }),
      roomOption('hammer', t('rest.smith'), t('rest.smithDesc'), upgradable.length === 0, () => {
        sfx('tap');
        openDeck(run.deck, {
          title: t('rest.smithHint'),
          confirmLabel: t('rest.upgrade'),
          filter: canUpgrade,
          previewSelected: (c) => ({ ...c, up: true }),
          onPick: (c) => {
            // The picked card is the deck's own, so the "before" face is kept ahead of the change.
            const before = { ...c };
            upgradeCard(run, c.uid);
            run.cleared = true;
            playCardChange(el, before, { ...c }, t('rest.upgraded'));
            closeRoom(el, onDone, CARD_SHOW_MS);
          },
        });
      }),
    ),
  );
  return { el };
}
