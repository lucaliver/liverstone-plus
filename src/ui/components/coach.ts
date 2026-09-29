import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { h } from '../dom';

export interface CoachStep {
  /** The element pointed at (lit, everything else dimmed). */
  target: HTMLElement;
  text: string;
}

/**
 * Coach marks over `root` (a positioned screen): one element at a time is lit and explained in a note, next to it,
 * with Next to move on. The overlay takes every touch until the last step; then it's gone and `onDone` runs.
 */
export function coach(root: HTMLElement, steps: CoachStep[], onDone: () => void): void {
  let i = 0;
  const hole = h('div', { class: 'coach-hole' });
  const text = h('p');
  const count = h('span', { class: 'coach-count' });
  const next = h('button', { class: 'btn cta small' });
  const note = h('div', { class: 'coach-note' }, text, h('div', { class: 'coach-foot' }, count, next));
  const el = h('div', { class: 'coach', role: 'dialog', 'aria-modal': 'true' }, hole, note);
  const show = (): void => {
    const box = root.getBoundingClientRect();
    const r = steps[i].target.getBoundingClientRect();
    text.textContent = steps[i].text;
    count.textContent = `${i + 1}/${steps.length}`;
    next.textContent = i === steps.length - 1 ? t('howto.gotIt') : t('common.next');
    Object.assign(hole.style, { left: `${r.left - box.left}px`, top: `${r.top - box.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    // The note goes under a target in the top half of the screen, above one in the bottom half.
    const below = r.top + r.height / 2 < box.top + box.height / 2;
    note.style.top = below ? `${r.bottom - box.top + 16}px` : '';
    note.style.bottom = below ? '' : `${box.bottom - r.top + 16}px`;
  };
  next.addEventListener('click', () => {
    sfx('tap');
    if (++i < steps.length) return show();
    el.remove();
    onDone();
  });
  root.append(el);
  show();
}
