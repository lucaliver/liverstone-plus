import { sfx } from '../../audio/sfx';
import type { CombatView } from './view';

/** Grime a stroke of the mop as long as the belt is wide takes off a rust spot under it (a spot is 1). */
const SCRUB_PER_BELT = 5;
/** How far (px) beyond a rust spot the mop's head still reaches it. */
const REACH = 8;

/**
 * The mop beside a rusting enemy: grab it and its head sits under the finger; drag it over the rust spots to scrub them off
 * (`combat.scrubRust`, only the spots under the head, in proportion to how far it moves there); it snaps back home when let go.
 */
export function bindMop(v: CombatView): void {
  const { combat, r, state } = v;
  /** The head's place on the mop (share of its box). */
  const HEAD_X = 0.3;
  const HEAD_Y = 0.85;
  let drag: { pointerId: number; homeX: number; homeY: number; x: number; y: number } | null = null;

  const drop = (ev: PointerEvent): void => {
    // Another finger (playing a card) lifting must not drop the mop.
    if (!drag || ev.pointerId !== drag.pointerId) return;
    drag = null;
    r.mop.classList.remove('dragging');
    r.mop.style.transform = '';
  };
  /** Puts the mop's head where the finger is. */
  const follow = (x: number, y: number): void => {
    if (!drag) return;
    r.mop.style.transform = `translate3d(${x - drag.homeX}px, ${y - drag.homeY}px, 0)`;
  };
  r.mop.addEventListener('pointerdown', (ev) => {
    if (drag || state.paused || state.waiting || state.ended) return;
    try {
      r.mop.setPointerCapture(ev.pointerId);
    } catch {
      /* synthetic events (tests) have no active pointer */
    }
    const rc = r.mop.getBoundingClientRect();
    drag = { pointerId: ev.pointerId, homeX: rc.left + rc.width * HEAD_X, homeY: rc.top + rc.height * HEAD_Y, x: ev.clientX, y: ev.clientY };
    r.mop.classList.add('dragging');
    follow(ev.clientX, ev.clientY);
  });
  // Move and release are heard on the whole screen, like the cards': the finger may leave the mop's box.
  v.el.addEventListener('pointermove', (ev) => {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const step = Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y);
    follow(ev.clientX, ev.clientY);
    drag.x = ev.clientX;
    drag.y = ev.clientY;
    const amount = (step / r.belt.clientWidth) * SCRUB_PER_BELT;
    let scrubbed = false;
    for (const spot of r.rust.children) {
      const rc = spot.getBoundingClientRect();
      if (ev.clientX < rc.left - REACH || ev.clientX > rc.right + REACH || ev.clientY < rc.top - REACH || ev.clientY > rc.bottom + REACH) continue;
      combat.scrubRust(Number((spot as HTMLElement).dataset.id), amount);
      scrubbed = true;
    }
    if (scrubbed) sfx('scrub');
  });
  v.el.addEventListener('pointerup', drop);
  v.el.addEventListener('pointercancel', drop);
}
