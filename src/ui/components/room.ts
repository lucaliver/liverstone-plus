import type { NodeType } from '../../game/run';
import { h } from '../dom';
import { roomArt } from '../art/rooms';
import { motes } from './decor';

/** A choice button of a room (Break Room, Copy Room, Promotion); `art` is the HTML of its icon or sprite. */
export const roomOption = (art: string, title: string, desc: string, disabled: boolean, fn: () => void): HTMLButtonElement =>
  h('button', { class: 'option', disabled, onclick: fn, html: `${art}<b>${title}</b><span>${desc}</span>` });

/** How a room's picture moves (`anim`: a class of rooms.css), the inks of its motes, and whether its sprite has a second frame (`.open`). */
export const ROOM_SCENE: Partial<Record<NodeType, { anim: string; inks: string[]; alt?: boolean }>> = {
  rest: { anim: 'steam', inks: ['var(--paper)', 'var(--paper)', 'var(--y)'] },
  promotion: { anim: 'climb', inks: ['var(--y)', 'var(--b)'] },
  copy: { anim: 'copy', inks: ['var(--paper)', 'var(--paper)', 'var(--y)'] },
  tailor: { anim: 'sway', inks: ['var(--paper)', 'var(--paper)', 'var(--y)'] },
  lostFound: { anim: 'flap', inks: ['var(--paper)', 'var(--paper)', 'var(--y)'], alt: true },
  vending: { anim: 'thump', inks: ['var(--paper)', 'var(--p)', 'var(--y)'] },
};

const NO_SCENE = { anim: '', inks: [], alt: false };

/** The big picture at the top of a room: its sprite, moving, with motes drifting behind. */
export function roomScene(type: NodeType): HTMLElement {
  const { anim, inks, alt } = ROOM_SCENE[type] ?? NO_SCENE;
  return h('div', {
    class: 'room-scene',
    html: `${motes(14, inks)}<div class="room-art ${anim}">${roomArt(type)}${alt ? roomArt(`${type}.open`, 'alt') : ''}</div>`,
  });
}

/** The choice is made: locks the room's buttons and goes on once its animation (`ms`) is over. */
export function closeRoom(el: HTMLElement, onDone: () => void, ms: number): void {
  el.querySelectorAll('button').forEach((b) => {
    b.disabled = true;
  });
  setTimeout(onDone, ms);
}
