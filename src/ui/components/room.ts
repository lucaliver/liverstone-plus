import { icon } from '../art/icons';
import { h } from '../dom';

/** A choice button of a room (Break Room, Copy Room, Promotion). */
export const roomOption = (ic: string, title: string, desc: string, disabled: boolean, fn: () => void): HTMLButtonElement =>
  h('button', { class: 'option', disabled, onclick: fn, html: `${icon(ic)}<b>${title}</b><span>${desc}</span>` });

/** The choice is made: locks the room's buttons and goes on once its animation (`ms`) is over. */
export function closeRoom(el: HTMLElement, onDone: () => void, ms: number): void {
  el.querySelectorAll('button').forEach((b) => {
    b.disabled = true;
  });
  setTimeout(onDone, ms);
}
