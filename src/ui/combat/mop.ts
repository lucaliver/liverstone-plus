import { sfx } from '../../audio/sfx';
import type { CombatView, Point } from './view';

/** Rust a stroke of the mop as long as the belt is wide takes off. */
const SCRUB_PER_BELT = 0.2;

/**
 * The mop beside a rusting enemy: drag it over the belt to scrub the rust off (`combat.wipeRust`); it snaps back home when let go.
 * What scrubs is the mop's head, not the finger.
 */
export function bindMop(v: CombatView): void {
  const { combat, r, state } = v;
  const head = (): Point => {
    const rc = r.mop.getBoundingClientRect();
    return { x: rc.left + rc.width * 0.3, y: rc.top + rc.height * 0.85 };
  };
  let drag: { pointerId: number; startX: number; startY: number; head: Point } | null = null;

  const drop = (): void => {
    drag = null;
    r.mop.classList.remove('dragging');
    r.mop.style.transform = '';
  };
  r.mop.addEventListener('pointerdown', (ev) => {
    if (drag || state.paused || state.waiting || state.ended) return;
    try {
      r.mop.setPointerCapture(ev.pointerId);
    } catch {
      /* synthetic events (tests) have no active pointer */
    }
    drag = { pointerId: ev.pointerId, startX: ev.clientX, startY: ev.clientY, head: head() };
    r.mop.classList.add('dragging');
  });
  // Move and release are heard on the whole screen, like the cards': the finger may leave the mop's box.
  v.el.addEventListener('pointermove', (ev) => {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    r.mop.style.transform = `translate3d(${ev.clientX - drag.startX}px, ${ev.clientY - drag.startY}px, 0)`;
    const now = head();
    const belt = r.belt.getBoundingClientRect();
    if (
      now.y > belt.top &&
      now.y < belt.bottom &&
      combat.wipeRust((Math.hypot(now.x - drag.head.x, now.y - drag.head.y) / belt.width) * SCRUB_PER_BELT) > 0
    ) {
      sfx('scrub');
    }
    drag.head = now;
  });
  v.el.addEventListener('pointerup', drop);
  v.el.addEventListener('pointercancel', drop);
}
