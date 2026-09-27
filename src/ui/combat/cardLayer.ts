import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { CARDS } from '../../data/cards';
import type { CombatCard } from '../../game/types';
import { icon } from '../art/icons';
import { cardFace, cardView } from '../components/cardView';
import { openCardDetail } from '../components/modals';
import { h, setHtml, toggle } from '../dom';
import { burst } from '../fx/fx';
import type { CombatView } from './view';

const LONG_PRESS_MS = 420;
const DRAG_THRESHOLD = 10;

export type Removal = 'played' | 'expired' | 'stolen' | 'stashed';

interface CardEl {
  el: HTMLDivElement;
  card: CombatCard;
  face: HTMLElement;
}

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
  let drag: Drag | null = null;

  const makeCardEl = (card: CombatCard): CardEl => {
    const cardEl = cardView(card, { combat });
    return { el: cardEl, card, face: cardEl.querySelector('.c-face')! };
  };

  const findCard = (uid: number): CombatCard | null =>
    combat.belt.find((b) => b.card.uid === uid)?.card ?? combat.sleeve.find((c) => c?.uid === uid) ?? null;

  const playUid = (uid: number): void => {
    if (state.paused || state.ended) return;
    combat.playCard(uid);
  };

  // ------------------------------------------------------------------ input

  const slotAt = (x: number, y: number): number => {
    for (let i = 0; i < slotEls.length; i++) {
      const rc = slotEls[i].getBoundingClientRect();
      if (x >= rc.left - 14 && x <= rc.right + 14 && y >= rc.top - 20 && y <= rc.bottom + 14) return i;
    }
    return -1;
  };

  const cancelDrag = (): void => {
    if (!drag) return;
    clearTimeout(drag.timer);
    drag.el.classList.remove('dragging');
    if (drag.from === 'sleeve') drag.el.style.transform = '';
    for (const s of slotEls) s.classList.remove('target');
    r.stage.classList.remove('drop-play');
    drag = null;
  };

  const onDown = (ev: PointerEvent, from: 'belt' | 'sleeve'): void => {
    // While waiting for Start, cards can still be held to read them (playing is blocked by the engine intro).
    if ((state.paused && !state.waiting) || state.ended || drag) return;
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
        const card = findCard(uid);
        cancelDrag();
        if (!card) return;
        sfx('tap');
        v.inspect(true);
        openCardDetail(card, () => v.inspect(false));
      }, LONG_PRESS_MS),
    };
  };

  const onMove = (ev: PointerEvent): void => {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const dx = ev.clientX - drag.startX;
    const dy = ev.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      drag.moved = true;
      clearTimeout(drag.timer);
      drag.el.classList.add('dragging');
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
    toggle(r.stage, 'drop-play', ev.clientY < r.belt.getBoundingClientRect().top);
  };

  const onUp = (ev: PointerEvent): void => {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const d = drag;
    clearTimeout(d.timer);
    if (!d.moved) {
      cancelDrag();
      playUid(d.uid);
      return;
    }
    const slot = d.from === 'belt' ? slotAt(ev.clientX, ev.clientY) : -1;
    const toStage = ev.clientY < r.belt.getBoundingClientRect().top;
    cancelDrag();
    if (slot >= 0) combat.stash(d.uid, slot);
    else if (toStage) playUid(d.uid);
  };

  r.beltCards.addEventListener('pointerdown', (e) => onDown(e, 'belt'));
  r.sleeve.addEventListener('pointerdown', (e) => onDown(e, 'sleeve'));
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', () => cancelDrag());
  el.addEventListener('contextmenu', (e) => e.preventDefault());

  // ------------------------------------------------------------------ render

  const flyOut = (ce: CardEl, reason: Removal): void => {
    const def = CARDS[ce.card.id];
    const el2 = ce.el;
    const rc = el2.getBoundingClientRect();
    const target =
      reason === 'stolen' || def.type === 'attack' || def.type === 'spell' || (def.type === 'potion' && def.dmg)
        ? v.enemyPoint()
        : reason === 'expired'
          ? null
          : v.heroPoint();
    const base = (el2.style.transform || '').replace(/scale\([^)]*\)|rotate\([^)]*\)/g, '');
    if (reason === 'expired' || !target) {
      el2.classList.add('fall-out');
      el2.style.transform = `${base} translate3d(-40px, 60px, 0) rotate(-25deg)`;
    } else {
      const dx = target.x - (rc.left + rc.width / 2);
      const dy = target.y - (rc.top + rc.height / 2);
      el2.classList.add('fly-out');
      el2.style.transform = `${base} translate3d(${dx}px, ${dy}px, 0) scale(.35) rotate(${dx > 0 ? 20 : -20}deg)`;
      if (reason === 'played') setTimeout(() => burst(def.type === 'skill' ? 'block' : 'hit', target.x, target.y, 8), 300);
    }
    setTimeout(() => el2.remove(), 520);
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
      toggle(ce.el, 'poor', !combat.canAfford(b.card) || !combat.isPlayable(b.card));
      toggle(ce.el, 'leaving', b.pos > 0.86);
      if (refreshFaces) setHtml(ce.face, cardFace(b.card, combat));
      if (drag?.uid === b.card.uid && drag.moved) continue;
      // Snap to whole pixels: crisp pixel art and a slightly stepped, printed feel.
      const x = Math.round(state.beltW * (1 - b.pos));
      ce.el.style.transform = `translate3d(${x}px, 0, 0)`;
      ce.el.style.zIndex = String(Math.round(b.pos * 100));
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
          toggle(cur.el, 'poor', !combat.canAfford(card));
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
