import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { canUpgrade, REST_HEAL, rest, upgradeCard, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h } from '../dom';
import { icon } from '../art/icons';
import { creature } from '../art/creatures';
import type { CardInst } from '../../game/types';
import { cardView } from '../components/cardView';
import { openDeck } from '../components/modals';
import { burst, haptic } from '../fx/fx';
import { motes } from '../components/decor';
import { runHud } from './journey';

export const HEAL_ANIM_MS = 1900;
const UPGRADE_ANIM_MS = 1700;

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

/** The card takes a hammer blow, then comes back upgraded with a flash and a stamp. */
function playUpgrade(screen: HTMLElement, card: CardInst): void {
  const old = cardView(card, { cls: 'up-old' });
  const fresh = cardView({ ...card, up: true }, { cls: 'up-new' });
  const layer = h(
    'div',
    { class: 'upgrade-show', 'aria-hidden': 'true' },
    h('div', { class: 'up-stage' }, old, h('i', { class: 'up-flash' }), fresh),
    h('div', { class: 'up-stamp' }, t('rest.upgraded')),
  );
  screen.append(layer);
  sfx('block');
  haptic('tap');
  setTimeout(() => {
    const r = fresh.getBoundingClientRect();
    burst('gold', r.left + r.width / 2, r.top + r.height / 2, 34, 1.3);
    sfx('ability');
    haptic('ability');
  }, 480);
}

export function restScreen(run: RunState, onDone: () => void): Screen {
  const heal = Math.min(run.maxHp - run.hp, Math.round(run.maxHp * REST_HEAL));
  const upgradable = run.deck.filter(canUpgrade);
  const opt = (ic: string, title: string, desc: string, disabled: boolean, fn: () => void): HTMLButtonElement =>
    h('button', { class: 'option', disabled, onclick: fn, html: `${icon(ic)}<b>${title}</b><span>${desc}</span>` });

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
      opt('heart', t('rest.heal'), heal > 0 ? t('rest.healDesc', { n: heal }) : t('rest.full'), heal <= 0, () => {
        const healed = rest(run);
        el.querySelectorAll('button').forEach((b) => {
          b.disabled = true;
        });
        playHealing(el, healed);
        setTimeout(onDone, HEAL_ANIM_MS);
      }),
      opt('hammer', t('rest.smith'), t('rest.smithDesc'), upgradable.length === 0, () => {
        sfx('tap');
        openDeck(run.deck, {
          title: t('rest.smithHint'),
          confirmLabel: t('rest.upgrade'),
          filter: canUpgrade,
          previewSelected: (c) => ({ ...c, up: true }),
          onPick: (c) => {
            upgradeCard(run, c.uid);
            run.cleared = true;
            el.querySelectorAll('button').forEach((b) => {
              b.disabled = true;
            });
            playUpgrade(el, c);
            setTimeout(onDone, UPGRADE_ANIM_MS);
          },
        });
      }),
    ),
  );
  return { el };
}
