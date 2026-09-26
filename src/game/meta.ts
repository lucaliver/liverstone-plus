import { load, store } from '../core/save';

/** Progress kept across runs. */
interface Meta {
  /** Card ids the player has seen (starter decks, rewards, cards met in combat). */
  discovered: string[];
}

const meta: Meta = load('meta', { discovered: [] });
const discovered = new Set(meta.discovered);

export function discover(ids: Iterable<string>): void {
  let changed = false;
  for (const id of ids) {
    if (discovered.has(id)) continue;
    discovered.add(id);
    changed = true;
  }
  if (!changed) return;
  meta.discovered = [...discovered];
  store('meta', meta);
}

export const isDiscovered = (id: string): boolean => discovered.has(id);
