import { load, store } from '../core/save';
import { ACT_DEFS } from '../data/acts';
import { HERO_LIST, HEROES } from '../data/heroes';
import { MODIFIERS } from '../data/modifiers';
import { RELICS } from '../data/relics';
import { renamedCard, renamedEnemy } from './renamed';
import type { EnemyDef, HeroId, HeroUnlock, Records } from './types';

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
  /** Relic ids seen (offered or owned): the handbook hides the others' names. */
  relics: string[];
  /** Runs started so far (the very first one has a scripted act 1). */
  runs: number;
  /** The employment contract has been signed (the start screen's first-time hold). */
  signed: boolean;
  /** Acts finished (their boss beaten), one `hero:act` entry per hero and act: the records page stamps them. */
  stamps: string[];
  /** Management memos switched on for the next run (`MODIFIERS` ids); they only apply to a hero who has won a full day. */
  memos: string[];
  records: Records;
}

const NO_RECORDS: Records = {
  wins: 0,
  fullDays: 0,
  kills: 0,
  elites: 0,
  bosses: 0,
  cardsPlayed: 0,
  bestPay: 0,
  bestKills: 0,
  bestCards: 0,
  bestAct: 0,
  bestFloor: 0,
  fastest: 0,
};

const meta: Meta = load('meta', {
  discovered: [],
  heroes: [],
  fresh: [],
  met: [],
  relics: [],
  runs: 0,
  signed: false,
  stamps: [],
  memos: [],
  records: { ...NO_RECORDS },
});
// Saved data is untrusted: keep only known hero ids.
for (const k of ['heroes', 'fresh'] as const) meta[k] = Array.isArray(meta[k]) ? meta[k].filter((id) => id in HEROES) : [];
// Ids saved before they followed the English names are mapped to the new ones.
const discovered = new Set(Array.isArray(meta.discovered) ? meta.discovered.map(renamedCard) : []);
meta.met = Array.isArray(meta.met) ? meta.met.map(renamedEnemy) : [];
meta.relics = Array.isArray(meta.relics) ? meta.relics.filter((id) => typeof id === 'string' && id in RELICS) : [];
if (typeof meta.runs !== 'number') meta.runs = 0;
meta.signed = meta.signed === true;
{
  const valid = (s: unknown): s is string => {
    if (typeof s !== 'string') return false;
    const [hero, act] = s.split(':');
    return hero in HEROES && Number.isInteger(Number(act)) && Number(act) >= 1 && Number(act) <= ACT_DEFS.length;
  };
  meta.stamps = Array.isArray(meta.stamps) ? [...new Set(meta.stamps.filter(valid))] : [];
}
meta.memos = Array.isArray(meta.memos) ? [...new Set(meta.memos.filter((id) => typeof id === 'string' && id in MODIFIERS))] : [];
{
  // Only finite numbers survive; anything missing starts at zero.
  const saved: Partial<Record<keyof Records, unknown>> = typeof meta.records === 'object' && meta.records ? meta.records : {};
  meta.records = { ...NO_RECORDS };
  for (const k of Object.keys(NO_RECORDS) as (keyof Records)[]) {
    const v = saved[k];
    if (typeof v === 'number' && Number.isFinite(v)) meta.records[k] = v;
  }
}

export const contractSigned = (): boolean => meta.signed;
export function signContract(): void {
  meta.signed = true;
  store('meta', meta);
}

/** No run has ever been started (the title then points at the time card). */
export const neverPlayed = (): boolean => meta.runs === 0;

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

export function seeRelics(ids: Iterable<string>): void {
  const fresh = [...ids].filter((id) => !meta.relics.includes(id));
  if (!fresh.length) return;
  meta.relics.push(...fresh);
  store('meta', meta);
}
export const relicSeen = (id: string): boolean => meta.relics.includes(id);

/** Debug: every hero hired, every card discovered, every enemy met and every relic seen. */
export function unlockAll(cards: Iterable<string>, enemies: Iterable<string>, relics: Iterable<string>): void {
  meta.heroes = HERO_LIST.filter((hd) => hd.unlock).map((hd) => hd.id);
  meta.fresh = [];
  meta.met = [...enemies];
  meta.relics = [...relics];
  for (const id of cards) discovered.add(id);
  meta.discovered = [...discovered];
  store('meta', meta);
}

export const heroUnlocked = (id: HeroId): boolean => !HEROES[id].unlock || meta.heroes.includes(id);
export const heroFresh = (id: HeroId): boolean => meta.fresh.includes(id);

export function markHeroSeen(id: HeroId): void {
  if (!heroFresh(id)) return;
  meta.fresh = meta.fresh.filter((x) => x !== id);
  store('meta', meta);
}

/** A fight ended: counts it in the records (kills, cards, the fastest win). */
export function recordFight(f: { tier: EnemyDef['tier']; won: boolean; seconds: number; cards: number }): void {
  const r = meta.records;
  r.cardsPlayed += f.cards;
  if (f.won) {
    r.kills++;
    if (f.tier === 'elite') r.elites++;
    if (f.tier === 'boss') r.bosses++;
    if (!r.fastest || f.seconds < r.fastest) r.fastest = Math.round(f.seconds);
  }
  store('meta', meta);
}

/** Records one run can beat (the payslip stamps them). */
export type RunRecord = 'bestFloor' | 'bestKills' | 'bestCards' | 'bestPay';

/**
 * A run ended (`fullDay`: won through every act). Returns the one-run records it beat; the very first value set
 * doesn't count, there was nothing to beat.
 */
export function recordRun(f: { won: boolean; fullDay: boolean; act: number; floor: number; pay: number; kills: number; cards: number }): RunRecord[] {
  const r = meta.records;
  const beaten: RunRecord[] = [];
  if (f.won) r.wins++;
  if (f.fullDay) r.fullDays++;
  if (f.act > r.bestAct || (f.act === r.bestAct && f.floor > r.bestFloor)) {
    if (r.bestAct) beaten.push('bestFloor');
    r.bestAct = f.act;
    r.bestFloor = f.floor;
  }
  for (const [k, v] of [
    ['bestPay', f.pay],
    ['bestKills', f.kills],
    ['bestCards', f.cards],
  ] as const) {
    if (v <= r[k]) continue;
    if (r[k]) beaten.push(k);
    r[k] = v;
  }
  store('meta', meta);
  return beaten;
}

export const records = (): Readonly<Records & { runs: number }> => ({ ...meta.records, runs: meta.runs });

/** A hero finished an act (beat its boss): the records page stamps it. */
export function stampAct(hero: HeroId, act: number): void {
  const key = `${hero}:${act}`;
  if (meta.stamps.includes(key)) return;
  meta.stamps.push(key);
  store('meta', meta);
}
export const hasStamp = (hero: HeroId, act: number): boolean => meta.stamps.includes(`${hero}:${act}`);

/** A hero who has won a full day (beaten the last act's boss) may run under management memos. */
export const memosOpen = (hero: HeroId): boolean => hasStamp(hero, ACT_DEFS.length);

/** The memos switched on for the next run. */
export const chosenMemos = (): string[] => [...meta.memos];
export function setMemo(id: string, on: boolean): void {
  meta.memos = meta.memos.filter((x) => x !== id);
  if (on && id in MODIFIERS) meta.memos.push(id);
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
