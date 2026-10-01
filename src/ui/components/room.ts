import { h } from '../dom';

/** A choice button of a room (Break Room, Copy Room, Promotion); `art` is the HTML of its icon or sprite. */
export const roomOption = (art: string, title: string, desc: string, disabled: boolean, fn: () => void): HTMLButtonElement =>
  h('button', { class: 'option', disabled, onclick: fn, html: `${art}<b>${title}</b><span>${desc}</span>` });

/** The choice is made: locks the room's buttons and goes on once its animation (`ms`) is over. */
export function closeRoom(el: HTMLElement, onDone: () => void, ms: number): void {
  el.querySelectorAll('button').forEach((b) => {
    b.disabled = true;
  });
  setTimeout(onDone, ms);
}
