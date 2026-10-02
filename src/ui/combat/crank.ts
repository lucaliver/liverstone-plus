import { CONFIG } from '../../data/config';
import { haptic } from '../fx/fx';
import type { CombatView } from './view';

/**
 * The crank knob that turns a shut-off belt (`EnemyDef.beltOff`): grab it anywhere and turn it around its centre. The knob follows
 * the finger's angle and every full clockwise turn moves the belt `CONFIG.crankTurn` belt widths (counter-clockwise takes it back).
 */
export function bindCrank(v: CombatView): void {
  const { combat, r, state } = v;
  let drag: { pointerId: number; last: number; buzz: number } | null = null;
  /** Where the knob is pointing now, in degrees clockwise. */
  let angle = 0;

  const angleAt = (ev: PointerEvent): number => {
    const rc = r.crank.getBoundingClientRect();
    return (Math.atan2(ev.clientY - (rc.top + rc.height / 2), ev.clientX - (rc.left + rc.width / 2)) * 180) / Math.PI;
  };
  const end = (ev: PointerEvent): void => {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    drag = null;
    r.crank.classList.remove('turning');
  };

  r.crank.addEventListener('pointerdown', (ev) => {
    if (drag || state.paused || state.ended) return;
    try {
      r.crank.setPointerCapture(ev.pointerId);
    } catch {
      /* synthetic events (tests) have no active pointer */
    }
    drag = { pointerId: ev.pointerId, last: angleAt(ev), buzz: 0 };
    r.crank.classList.add('turning');
  });
  r.crank.addEventListener('pointermove', (ev) => {
    if (!drag || ev.pointerId !== drag.pointerId || state.paused || state.ended) return;
    const now = angleAt(ev);
    // The shortest way round, so crossing the ±180° seam is not a jump.
    const step = ((((now - drag.last) % 360) + 540) % 360) - 180;
    drag.last = now;
    angle += step;
    r.crank.style.setProperty('--turn', `${Math.round(angle)}deg`);
    combat.crankBelt((step / 360) * CONFIG.crankTurn);
    drag.buzz += Math.abs(step);
    if (drag.buzz >= CONFIG.crankBuzz) {
      drag.buzz %= CONFIG.crankBuzz;
      haptic('belt');
    }
  });
  r.crank.addEventListener('pointerup', end);
  r.crank.addEventListener('pointercancel', end);
}
