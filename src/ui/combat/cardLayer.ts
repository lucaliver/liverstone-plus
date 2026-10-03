import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { CARDS, cardValsOf } from '../../data/cards';
import { statusIcon } from '../../data/statuses';
import type { CombatCard } from '../../game/types';
import { icon } from '../art/icons';
import { cardCostLabel, cardFace, cardView } from '../components/cardView';
import { openCardDetail, openInfo } from '../components/modals';
import { LONG_PRESS_MS, SLACK_MS, cssMs, h, onTapOrHold, setHtml, setText, toggle } from '../dom';
import { burst, haptic } from '../fx/fx';
import type { CombatView } from './view';

const DRAG_THRESHOLD = 10;
/** How much bigger a card with `sweep` looks in the hand once it has swept up all it can (1 = twice its size). */
const SWEEP_GROW = 0.6;
/** How far (px) a card knocked off by a sweep is thrown. */
const SWEEP_THROW = 150;

export type Removal = 'played' | 'expired' | 'stolen' | 'stashed' | 'swept';

interface CardEl {
  el: HTMLDivElement;
  card: CombatCard;
  face: HTMLElement;
  cost: HTMLElement;
  span: number;
  /** Rides over the other cards (a wide gate, a lane lock). */
  over: boolean;
  /** Stone cover with the taps left, while the card is petrified. */
  hexEl?: HTMLElement;
  /** The virus on an infected card. */
  virusEl?: HTMLElement;
  /** The pushpin on a card pinned where it is (Team Change). */
  pinEl?: HTMLElement;
  /** Icon of the rule (enemy passive, stun…) that blocks the card, while one does. */
  ruleEl?: HTMLElement;
  rule?: string;
}

/** Steps of the refill shown on a card waiting for mana (stepped, like the rest of the motion). */
const CHARGE_STEPS = 10;

interface Drag {
  uid: number;
  el: HTMLElement;
  from: 'belt' | 'sleeve';
  pointerId: number;
  startX: number;
  startY: number;
  offX: number;
  offY: number;
  moved: boolean;
  timer: number;
}

export interface CardLayer {
  render(): void;
  cancelDrag(): void;
  /** Remembers why a card left, so its element animates accordingly. */
  markRemoval(uid: number, reason: Removal): void;
  /** The element showing a card on the belt or in the sleeve, if any. */
  elementOf(uid: number): HTMLElement | null;
}

/**
 * The belt and the sleeve: card elements, their motion and exit animations, and card input
 * (tap to play, drag up to play, drag down to stash, long press to inspect).
 */
export function createCardLayer(v: CombatView): CardLayer {
  const { combat, r, el, state } = v;
  const beltEls = new Map<number, CardEl>();
  const removals = new Map<number, Removal>();
  const sleeveEls: (CardEl | null)[] = combat.sleeve.map(() => null);
  const slotHint = `${icon('hand')}<span>${t('combat.sleeveHint')}</span>`;
  const slotEls: HTMLElement[] = combat.sleeve.map((_, i) => h('div', { class: 'sleeve-slot', 'data-slot': i, html: slotHint }));
  r.sleeve.append(...slotEls);
  // An empty slot explains the sleeve on a hold (a card in it has its own inspect); a tap does nothing.
  for (const slot of slotEls) {
    onTapOrHold(
      slot,
      () => {},
      () => {
        if (slot.querySelector('.card')) return;
        sfx('tap');
        v.inspect(true);
        openInfo(
          { icon: 'hand', title: t('howto.sleeve.t'), desc: t('howto.sleeve.d'), extra: [t('hero.sleeve', { n: combat.sleeve.length })] },
          () => v.inspect(false),
        );
      },
    );
  }
  let drag: Drag | null = null;

  const makeCardEl = (card: CombatCard): CardEl => {
    const cardEl = cardView(card, { combat });
    const def = CARDS[card.id];
    const span = def.span ?? 1;
    // A wide card is a normal card with a gate stretching over the belt ahead of it (it's all one tap target).
    if (span > 1) {
      cardEl.classList.add('wide');
      toggle(cardEl, 'tall', !!def.tall);
      cardEl.style.setProperty('--span', String(span));
      cardEl.append(h('div', { class: 'c-gate' }));
    }
    // A lane lock pulls caution tape across its whole row.
    if (def.lockRow) {
      cardEl.classList.add('lock-row');
      cardEl.append(h('div', { class: 'c-lane' }));
    }
    return {
      el: cardEl,
      card,
      face: cardEl.querySelector('.c-face')!,
      cost: cardEl.querySelector('.c-cost')!,
      span,
      over: span > 1 || !!def.lockRow,
    };
  };

  const findCard = (uid: number): CombatCard | null =>
    combat.belt.find((b) => b.card.uid === uid)?.card ?? combat.sleeve.find((c) => c?.uid === uid) ?? null;

  /** Where the cards a sweep knocks off fly (belt-relative offsets), and what to do with them when their element goes. */
  const flings = new Map<number, { dx: number; dy: number }>();

  /** The held card, grown by what it has swept up so far (`sweep`), knocks off every belt card its body now covers. */
  const sweepUnder = (d: Drag): void => {
    const held = findCard(d.uid);
    if (!held) return;
    const rc = d.el.getBoundingClientRect();
    const cx = rc.left + rc.width / 2;
    const cy = rc.top + rc.height / 2;
    for (const [uid, ce] of beltEls) {
      if (uid === d.uid) continue;
      const vr = ce.el.getBoundingClientRect();
      const vx = vr.left + vr.width / 2;
      const vy = vr.top + vr.height / 2;
      if (vx < rc.left || vx > rc.right || vy < rc.top || vy > rc.bottom || !combat.sweepCard(d.uid, uid)) continue;
      const len = Math.hypot(vx - cx, vy - cy) || 1;
      flings.set(uid, { dx: ((vx - cx) / len) * SWEEP_THROW, dy: ((vy - cy) / len) * SWEEP_THROW });
      removals.set(uid, 'swept');
      sfx('ratchet');
      haptic('hit');
    }
    const def = CARDS[held.id].sweep;
    d.el.style.scale = def ? String(1 + SWEEP_GROW * Math.min(1, held.bonus / cardValsOf(held)[def.max])) : '';
  };

  const playUid = (uid: number, dragged = false): void => {
    if (state.paused || state.ended) return;
    combat.playCard(uid, dragged ? 'drag' : 'tap');
  };

  // ------------------------------------------------------------------ input

  /** The sleeve slot a drag would drop into: anywhere below the belt counts, the slot nearest the finger wins. */
  const slotAt = (x: number, y: number): number => {
    if (y < r.belt.getBoundingClientRect().bottom) return -1;
    let best = -1;
    let bestD = Infinity;
    slotEls.forEach((s, i) => {
      const rc = s.getBoundingClientRect();
      const d = Math.abs(x - (rc.left + rc.width / 2));
      if (d < bestD) [best, bestD] = [i, d];
    });
    return best;
  };

  const cancelDrag = (): void => {
    if (!drag) return;
    clearTimeout(drag.timer);
    combat.endDrag();
    drag.el.classList.remove('dragging');
    drag.el.style.scale = '';
    if (drag.from === 'sleeve') drag.el.style.transform = '';
    for (const s of slotEls) s.classList.remove('target');
    r.stage.classList.remove('drop-play');
    drag = null;
  };

  const onDown = (ev: PointerEvent, from: 'belt' | 'sleeve'): void => {
    // While waiting for Start, cards can still be held to read them (playing is blocked by the engine intro).
    if ((state.paused && !state.waiting) || state.ended || drag || ev.button !== 0) return;
    const cardEl = (ev.target as Element).closest<HTMLElement>('.card');
    if (!cardEl) return;
    const uid = Number(cardEl.dataset.uid);
    const rc = cardEl.getBoundingClientRect();
    try {
      cardEl.setPointerCapture(ev.pointerId);
    } catch {
      /* synthetic events (tests) have no active pointer */
    }
    drag = {
      uid,
      el: cardEl,
      from,
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      offX: ev.clientX - rc.left,
      offY: ev.clientY - rc.top,
      moved: false,
      timer: window.setTimeout(() => {
        if (!drag || drag.moved) return;
        cancelDrag();
        inspectCard(uid);
      }, LONG_PRESS_MS),
    };
  };

  const inspectCard = (uid: number): void => {
    const card = findCard(uid);
    if (!card) return;
    // In a blackout what the cards do can't be read, not even up close.
    if (combat.has('hero', 'blackout')) {
      v.toast(t('combat.blackout'));
      return;
    }
    sfx('tap');
    v.inspect(true);
    openCardDetail(card, () => v.inspect(false));
  };

  const onMove = (ev: PointerEvent): void => {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const dx = ev.clientX - drag.startX;
    const dy = ev.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      drag.moved = true;
      clearTimeout(drag.timer);
      drag.el.classList.add('dragging');
      combat.startDrag(drag.uid);
    }
    if (!drag.moved) return;
    if (drag.from === 'belt') {
      const base = r.beltCards.getBoundingClientRect();
      const tilt = Math.max(-8, Math.min(8, Math.round(ev.movementX)));
      drag.el.style.transform = `translate3d(${ev.clientX - base.left - drag.offX}px, ${ev.clientY - base.top - drag.offY}px, 0) rotate(${tilt}deg)`;
      const slot = slotAt(ev.clientX, ev.clientY);
      slotEls.forEach((s, i) => {
        toggle(s, 'target', i === slot);
      });
    } else {
      drag.el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.08)`;
    }
    if (CARDS[findCard(drag.uid)?.id ?? '']?.sweep) sweepUnder(drag);
    toggle(r.stage, 'drop-play', ev.clientY < r.belt.getBoundingClientRect().top);
  };

  const onUp = (ev: PointerEvent): void => {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const d = drag;
    clearTimeout(d.timer);
    // A card that sweeps the belt is played the moment it is let go, wherever that is.
    if (!d.moved || CARDS[findCard(d.uid)?.id ?? '']?.sweep) {
      cancelDrag();
      playUid(d.uid, d.moved);
      return;
    }
    const slot = d.from === 'belt' ? slotAt(ev.clientX, ev.clientY) : -1;
    // A belt card is played when dragged up to the stage; a sleeve card, when dragged anywhere out of the sleeve.
    const rc = r.sleeve.getBoundingClientRect();
    const outOfSleeve = ev.clientX < rc.left || ev.clientX > rc.right || ev.clientY < rc.top || ev.clientY > rc.bottom;
    const play = d.from === 'sleeve' ? outOfSleeve : ev.clientY < r.belt.getBoundingClientRect().top;
    cancelDrag();
    if (slot >= 0) combat.stash(d.uid, slot);
    else if (play) playUid(d.uid, true);
  };

  r.beltCards.addEventListener('pointerdown', (e) => onDown(e, 'belt'));
  r.sleeve.addEventListener('pointerdown', (e) => onDown(e, 'sleeve'));
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', () => cancelDrag());
  // Mouse: a right click inspects a card, like a long press.
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const cardEl = (e.target as Element).closest<HTMLElement>('.belt-cards .card, .sleeve .card');
    // (touch long presses send one too, and already inspect)
    if (cardEl && (e as PointerEvent).pointerType === 'mouse' && !state.ended && !state.paused) inspectCard(Number(cardEl.dataset.uid));
  });

  // ------------------------------------------------------------------ render

  const flyOut = (ce: CardEl, reason: Removal): void => {
    const def = CARDS[ce.card.id];
    const el2 = ce.el;
    const rc = el2.getBoundingClientRect();
    // Exhausted (or consumed): it doesn't fly anywhere, it burns away where it was played.
    if (reason === 'played' && combat.exhaust.includes(ce.card)) {
      el2.classList.add('exhaust-out');
      burst('ash', rc.left + rc.width / 2, rc.top + rc.height / 2, 18);
      setTimeout(() => el2.remove(), cssMs('--dur-exhaust') + SLACK_MS);
      return;
    }
    const swept = flings.get(ce.card.uid);
    flings.delete(ce.card.uid);
    const target =
      reason === 'swept' ? null : reason === 'stolen' || def.type === 'attack' ? v.enemyPoint() : reason === 'expired' ? null : v.heroPoint();
    const base = (el2.style.transform || '').replace(/scale\([^)]*\)|rotate\([^)]*\)/g, '');
    if (swept) {
      el2.classList.add('fall-out');
      el2.style.transform = `${base} translate3d(${swept.dx}px, ${swept.dy}px, 0) rotate(${swept.dx > 0 ? 40 : -40}deg)`;
    } else if (reason === 'expired') {
      // A card that slips off the end drops straight down, leaning back toward the belt (the belt's end is the screen's edge: tipping outwards would leave the screen at once), then shrinks and fades.
      const side = state.ltr ? 1 : -1;
      el2.classList.add('slip-out');
      el2.style.transform = `${base} translate3d(${-side * 14}px, ${rc.height * 2.2}px, 0) rotate(${-side * 24}deg) scale(.65)`;
    } else if (!target) {
      el2.classList.add('fall-out');
      el2.style.transform = state.ltr ? `${base} translate3d(40px, 60px, 0) rotate(25deg)` : `${base} translate3d(-40px, 60px, 0) rotate(-25deg)`;
    } else {
      const dx = target.x - (rc.left + rc.width / 2);
      const dy = target.y - (rc.top + rc.height / 2);
      el2.classList.add('fly-out');
      el2.style.transform = `${base} translate3d(${dx}px, ${dy}px, 0) scale(.35) rotate(${dx > 0 ? 20 : -20}deg)`;
      // Only attacks land with a hit: the other cards have their own effects (Block, heal, mana…).
      if (reason === 'played' && def.type === 'attack') setTimeout(() => burst('hit', target.x, target.y, 8), cssMs('--dur-fly'));
    }
    const dur = el2.classList.contains('slip-out') ? '--dur-slip' : el2.classList.contains('fall-out') ? '--dur-fall' : '--dur-fly';
    setTimeout(() => el2.remove(), cssMs(dur) + SLACK_MS);
  };

  /**
   * Whether a card can be played right now: dimmed when it can't; a card only waiting for mana refills from the
   * bottom as mana comes back; a card blocked by a rule shows that rule's icon.
   */
  const renderPlayState = (ce: CardEl, card: CombatCard): void => {
    const rule = card.hex ? null : combat.ruleBlock(card);
    const pending = combat.isPending(card);
    const playable = combat.isPlayable(card) && !pending;
    const afford = combat.canAfford(card);
    toggle(ce.el, 'poor', !card.hex && (!afford || !playable || !!rule));
    toggle(ce.el, 'pending', pending);
    toggle(ce.el, 'ruled', !!rule);
    const charging = !card.hex && playable && !rule && !afford;
    toggle(ce.el, 'charging', charging);
    if (charging) {
      const hs = combat.hero;
      const cost = Math.max(1, combat.cardCost(card));
      const k = Math.min(1, (hs.mana + hs.manaTimer / hs.regen) / cost);
      ce.el.style.setProperty('--charge', String(Math.floor(k * CHARGE_STEPS) / CHARGE_STEPS));
    }
    // Inflation raises the cost mid-fight: the label follows, in red.
    setText(ce.cost, cardCostLabel(card));
    toggle(ce.cost, 'taxed', !!card.tax || !!card.virus);
    toggle(ce.el, 'sick', !!card.virus);
    if (!card.virus !== !ce.virusEl) {
      ce.virusEl?.remove();
      ce.virusEl = card.virus ? ce.el.appendChild(h('div', { class: 'virus-badge', html: icon('virus') })) : undefined;
    }
    const ruleId = rule?.status;
    if (ruleId !== ce.rule) {
      ce.rule = ruleId;
      ce.ruleEl?.remove();
      ce.ruleEl = ruleId ? ce.el.appendChild(h('div', { class: 'rule-badge', html: icon(statusIcon(ruleId, 'hero')) })) : undefined;
    }
  };

  const renderBelt = (): void => {
    const onBelt = new Set<number>();
    const refreshFaces = state.frameNo % 8 === 0;
    for (const b of combat.belt) {
      onBelt.add(b.card.uid);
      let ce = beltEls.get(b.card.uid);
      if (!ce) {
        ce = makeCardEl(b.card);
        ce.el.classList.add('enter');
        beltEls.set(b.card.uid, ce);
        r.beltCards.append(ce.el);
      }
      const hex = b.card.hex;
      renderPlayState(ce, b.card);
      toggle(ce.el, 'hexed', !!hex && hex.left > 0);
      toggle(ce.el, 'covered', combat.isCovered(b.card.uid));
      toggle(ce.el, 'thawing', !!hex && hex.left <= 0);
      if (b.pinned && !ce.pinEl) ce.pinEl = ce.el.appendChild(h('div', { class: 'pin-badge', html: icon('pushpin') }));
      if (hex && hex.left > 0) {
        ce.el.dataset.hexLeft = String(hex.left);
        ce.hexEl ??= ce.el.appendChild(h('div', { class: 'hex-cover' }));
        setHtml(ce.hexEl, `<b>${t('hex.tapIt')}</b><span>×${hex.left}</span>`);
      } else if (ce.hexEl) {
        ce.hexEl.remove();
        ce.hexEl = undefined;
      }
      // Blink on the way out only when leaving the belt does something (curses that explode, drain…).
      toggle(ce.el, 'leaving', !b.pinned && b.pos > 0.86 && !!CARDS[b.card.id].onExpire);
      if (refreshFaces) setHtml(ce.face, cardFace(b.card, combat));
      if (drag?.uid === b.card.uid && drag.moved) continue;
      // Snap to whole pixels: crisp pixel art and a slightly stepped, printed feel.
      // Left-to-right belt (the default): the same run mirrored, entering on the left.
      const x = Math.round(state.ltr ? state.beltW * b.pos - state.cardW : state.beltW * (1 - b.pos));
      ce.el.style.transform = `translate3d(${x}px, ${b.row * state.rowH}px, 0)`;
      // Wide cards (Gatekeeping) and lane locks ride over everything else on the belt; pinned cards stay behind the ones riding past.
      ce.el.style.zIndex = b.pinned ? '1' : String(Math.round(b.pos * 100) + 10 + (ce.over ? 1000 : 0));
    }
    for (const [uid, ce] of beltEls) {
      if (onBelt.has(uid)) continue;
      beltEls.delete(uid);
      if (drag?.uid === uid) cancelDrag();
      const reason = removals.get(uid) ?? 'expired';
      removals.delete(uid);
      if (reason === 'stashed') ce.el.remove();
      else flyOut(ce, reason);
    }
  };

  const renderSleeve = (): void => {
    combat.sleeve.forEach((card, i) => {
      const cur = sleeveEls[i];
      if (cur?.card.uid === card?.uid) {
        if (cur && card) {
          renderPlayState(cur, card);
          if (state.frameNo % 8 === 0) setHtml(cur.face, cardFace(card, combat));
        }
        return;
      }
      if (cur) {
        const reason = removals.get(cur.card.uid);
        removals.delete(cur.card.uid);
        if (drag?.uid === cur.card.uid) cancelDrag();
        if (reason === 'played') {
          // Detach so it can animate out while the slot re-renders.
          const rc = cur.el.getBoundingClientRect();
          const base = el.getBoundingClientRect();
          cur.el.style.position = 'absolute';
          cur.el.style.left = `${rc.left - base.left}px`;
          cur.el.style.top = `${rc.top - base.top}px`;
          cur.el.style.transform = '';
          el.append(cur.el);
          flyOut(cur, 'played');
        } else {
          cur.el.remove();
        }
      }
      if (card) {
        const ce = makeCardEl(card);
        slotEls[i].replaceChildren(ce.el);
        sleeveEls[i] = ce;
      } else {
        slotEls[i].innerHTML = slotHint;
        sleeveEls[i] = null;
      }
    });
  };

  return {
    render() {
      renderBelt();
      renderSleeve();
    },
    cancelDrag,
    markRemoval: (uid, reason) => removals.set(uid, reason),
    elementOf: (uid) => beltEls.get(uid)?.el ?? sleeveEls.find((s) => s?.card.uid === uid)?.el ?? null,
  };
}
