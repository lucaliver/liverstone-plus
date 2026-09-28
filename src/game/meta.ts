import { load, store } from '../core/save';
import { HERO_LIST, HEROES } from '../data/heroes';
import type { HeroId, HeroUnlock } from './types';

/** Progress kept across runs. */
interface Meta {
  /** Card ids the player has seen (starter decks, rewards, cards met in combat). */
  discovered: string[];
  /** Heroes unlocked so far (heroes without an unlock condition are always available). */
  heroes: HeroId[];
  /** Unlocked but not yet seen on the hero select (shown as new). */
  fresh: HeroId[];
  /** Enemy ids fought at least once (the handbook hides the others' names). */
  met: string[];
  /** Runs started so far (the very first one has a scripted map). */
  runs: number;
  /** The employment contract has been signed (the start screen's first-time hold). */
  signed: boolean;
}

const meta: Meta = load('meta', { discovered: [], heroes: [], fresh: [], met: [], runs: 0, signed: false });
// Saved data is untrusted: keep only known hero ids.
for (const k of ['heroes', 'fresh'] as const) meta[k] = Array.isArray(meta[k]) ? meta[k].filter((id) => id in HEROES) : [];
const discovered = new Set(Array.isArray(meta.discovered) ? meta.discovered : []);
if (!Array.isArray(meta.met)) meta.met = [];
if (typeof meta.runs !== 'number') meta.runs = 0;
meta.signed = meta.signed === true;

export const contractSigned = (): boolean => meta.signed;
export function signContract(): void {
  meta.signed = true;
  store('meta', meta);
}

/** True for the very first run ever; counts the run as started. */
export function startingFirstRun(): boolean {
  const first = meta.runs === 0;
  meta.runs++;
  store('meta', meta);
  return first;
}

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

export function meetEnemy(id: string): void {
  if (meta.met.includes(id)) return;
  meta.met.push(id);
  store('meta', meta);
}
export const enemyMet = (id: string): boolean => meta.met.includes(id);

export const heroUnlocked = (id: HeroId): boolean => !HEROES[id].unlock || meta.heroes.includes(id);
export const heroFresh = (id: HeroId): boolean => meta.fresh.includes(id);

export function markHeroSeen(id: HeroId): void {
  if (!heroFresh(id)) return;
  meta.fresh = meta.fresh.filter((x) => x !== id);
  store('meta', meta);
}

/** Records progress that can unlock heroes (a run finished with a hero, an act boss reached). Returns the heroes it unlocked. */
export function progress(met: (u: HeroUnlock) => boolean): HeroId[] {
  const unlocked = HERO_LIST.filter((hd) => hd.unlock && !heroUnlocked(hd.id) && met(hd.unlock)).map((hd) => hd.id);
  if (!unlocked.length) return unlocked;
  meta.heroes.push(...unlocked);
  meta.fresh.push(...unlocked);
  store('meta', meta);
  return unlocked;
}
