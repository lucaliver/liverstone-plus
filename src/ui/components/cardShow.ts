import { sfx } from '../../audio/sfx';
import { t } from '../../core/i18n';
import { RELICS } from '../../data/relics';
import type { CardInst } from '../../game/types';
import { icon } from '../art/icons';
import { h } from '../dom';
import { burst, haptic } from '../fx/fx';
import { cardView } from './cardView';

/** How long a card show runs before the room moves on (the overlay fades out at 1.5 s). */
export const CARD_SHOW_MS = 1700;

/** Shreds are cut into this many vertical strips. */
const STRIPS = 5;

/** A dark veil over the room with the card animation on it, and the `word` stamped last. */
function showOver(screen: HTMLElement, kind: string, stage: HTMLElement, word: string, extra?: HTMLElement): HTMLElement {
  const layer = h('div', { class: `card-show ${kind}`, 'aria-hidden': 'true' }, stage, extra ?? null, h('div', { class: 'show-stamp' }, word));
  screen.append(layer);
  return layer;
}

/** The middle of a stage, where the particles go. */
function sparkAt(el: HTMLElement, kind: string, n: number, delay: number, sound: Parameters<typeof sfx>[0]): void {
  setTimeout(() => {
    const r = el.getBoundingClientRect();
    burst(kind, r.left + r.width / 2, r.top + r.height / 2, n, 1.3);
    sfx(sound);
    haptic('ability');
  }, delay);
}

/** The card takes a hammer blow, then comes back changed (upgraded, promoted) with a flash and a stamp. */
export function playCardChange(screen: HTMLElement, before: CardInst, after: CardInst, word: string): void {
  const fresh = cardView(after, { cls: 'show-new' });
  const stage = h('div', { class: 'show-stage' }, cardView(before, { cls: 'show-old' }), h('i', { class: 'show-flash' }), fresh);
  showOver(screen, 'change', stage, word);
  sfx('block');
  haptic('tap');
  sparkAt(fresh, 'gold', 34, 480, 'ability');
}

/** The card goes through the shredder: it comes apart in strips that fall away. */
export function playShred(screen: HTMLElement, card: CardInst, word: string): void {
  const stage = h('div', { class: 'show-stage' });
  for (let i = 0; i < STRIPS; i++) {
    const strip = cardView(card, { cls: 'shred-strip' });
    strip.style.setProperty('--i', String(i));
    strip.style.setProperty('--r', `${(i - (STRIPS - 1) / 2) * 7}deg`);
    strip.style.clipPath = `inset(0 ${100 - ((i + 1) * 100) / STRIPS}% 0 ${(i * 100) / STRIPS}%)`;
    stage.append(strip);
  }
  showOver(screen, 'shred', stage, word, h('div', { class: 'shred-machine', html: icon('shredder') }));
  sfx('cardExpire');
  haptic('tap');
  sparkAt(stage, 'paper', 26, 420, 'stash');
}

/** A light sweeps the card, and a second one slides out from behind it. */
export function playPhotocopy(screen: HTMLElement, card: CardInst, word: string): void {
  const copy = cardView(card, { cls: 'copy-new' });
  const stage = h('div', { class: 'show-stage' }, cardView(card, { cls: 'copy-src' }), h('i', { class: 'copy-scan' }), copy);
  showOver(screen, 'photocopy', stage, word);
  sfx('cardPlay');
  haptic('tap');
  sparkAt(copy, 'paper', 18, 520, 'stash');
}

/** A relic is handed over: its badge stamps in with a flash, and its name is stamped last. */
export function playRelic(screen: HTMLElement, id: string): void {
  const badge = h('div', { class: 'relic-badge show-new', html: icon(RELICS[id].art) });
  const stage = h('div', { class: 'show-stage' }, badge, h('i', { class: 'show-flash' }));
  showOver(screen, 'relic', stage, t(`relic.${id}.name`));
  sfx('block');
  haptic('tap');
  sparkAt(badge, 'gold', 34, 480, 'ability');
}
