import { Rng } from '../core/rng';
import { loadRaw, remove, store } from '../core/save';
import { nextUid, peekUid, resetUid } from '../core/util';
import { CARDS, cardCostOf, cardKeywordsOf, rewardPool } from '../data/cards';
import { PERKS } from '../data/perks';
import { CONFIG } from '../data/config';
import { ENEMIES, enemiesFor } from '../data/enemies';
import { HEROES } from '../data/heroes';
import type { Combat, CombatSetup } from './combat';
import { discover, progress } from './meta';
import type { CardDef, CardInst, EnemyDef, HeroId, Rarity } from './types';

export type NodeType = 'fight' | 'elite' | 'rest' | 'promotion' | 'boss';

/** One step of the run. `next` holds the reachable node ids (the player picks one when there are two). */
export interface RunNode {
  id: number;
  act: number;
  floor: number;
  /** Column on the map: 0 left, 1 right, 0.5 for a floor with a single node. */
  lane: number;
  type: NodeType;
  next: number[];
  /** Enemy picked when the run is generated, so reloading can't reroll it. */
  enemy?: string;
}

export interface RunStats {
  kills: number;
  elites: number;
  cardsPlayed: number;
  damageTaken: number;
}

export interface RunState {
  version: 2;
  seed: number;
  rng: number;
  hero: HeroId;
  hp: number;
  maxHp: number;
  deck: CardInst[];
  relics: string[];
  relicFlags: Record<string, number>;
  nodes: RunNode[];
  /** Node the player is on (or about to enter). */
  current: number;
  /** Nodes entered so far, in order (the path drawn on the map). */
  path: number[];
  /** True once the current node has been completed. */
  cleared: boolean;
  stats: RunStats;
  /** Pay earned so far: the run's score (fast wins pay more). */
  money: number;
  uid: number;
  /** The hero special is once per run. */
  specialUsed?: boolean;
}

const SAVE_KEY = 'run';
/**
 * Floors between the first fight and the boss, one list per lane. Lanes are dealt to a random side, and a few
 * floors swap their two nodes, so each run's map differs while both lanes keep a fair mix.
 */
const LANES: NodeType[][] = [
  ['fight', 'fight', 'rest', 'fight', 'elite', 'fight', 'fight', 'rest'],
  ['fight', 'promotion', 'fight', 'rest', 'fight', 'promotion', 'fight', 'rest'],
];
/** Links between the lanes per act: diagonal (to the other lane one floor up) or flat (across the same floor, both ways). */
const LINKS = 2;
export const ACTS = 2;

export function newRun(hero: HeroId, seed: number): RunState {
  resetUid(0);
  const rng = new Rng(seed);
  const def = HEROES[hero];
  const nodes = buildNodes(rng);
  discover(def.special ? [...def.startDeck, def.special] : def.startDeck);
  return {
    version: 2,
    seed,
    rng: rng.state,
    hero,
    hp: def.hp,
    maxHp: def.hp,
    deck: def.startDeck.map((id) => ({ uid: nextUid(), id, up: false })),
    relics: def.starterRelic ? [def.starterRelic] : [],
    relicFlags: {},
    nodes,
    current: 0,
    path: [0],
    cleared: false,
    stats: { kills: 0, elites: 0, cardsPlayed: 0, damageTaken: 0 },
    money: 0,
    uid: peekUid(),
  };
}

/** A shared first fight, two lanes linked a couple of times, and the boss where they meet again. */
function buildNodes(rng: Rng): RunNode[] {
  const nodes: RunNode[] = [];
  let last: RunNode[] = [];
  for (let act = 1; act <= ACTS; act++) {
    // Deal normal enemies from a shuffled bag so the same one doesn't repeat back to back.
    let bag: EnemyDef[] = [];
    const add = (floor: number, lane: number, type: NodeType): RunNode => {
      let enemy: string | undefined;
      if (type === 'fight') {
        if (!bag.length) bag = rng.shuffle(enemiesFor(act, 'normal'));
        enemy = bag.pop()!.id;
      } else if (type === 'elite' || type === 'boss') {
        enemy = rng.pick(enemiesFor(act, type)).id;
      }
      const node: RunNode = { id: nodes.length, act, floor, lane, type, next: [], enemy };
      nodes.push(node);
      return node;
    };
    const lanes = rng.shuffle(LANES.map((l) => [...l]));
    for (let i = 0; i < lanes[0].length - 1; i++) if (rng.next() < 0.3) [lanes[0][i], lanes[1][i]] = [lanes[1][i], lanes[0][i]];

    const first = add(1, 0.5, 'fight');
    for (const n of last) n.next.push(first.id);
    const rows = lanes[0].map((_, i) => [add(i + 2, 0, lanes[0][i]), add(i + 2, 1, lanes[1][i])]);
    first.next.push(rows[0][0].id, rows[0][1].id);
    for (let i = 1; i < rows.length; i++) {
      for (const side of [0, 1]) rows[i - 1][side].next.push(rows[i][side].id);
    }
    // A few one-way links between the lanes, never on neighbouring floors, so no two lines ever cross or touch.
    const floors: number[] = [];
    for (const i of rng.shuffle([...Array(rows.length - 1).keys()]))
      if (floors.length < LINKS && floors.every((f) => Math.abs(f - i) > 1)) floors.push(i);
    for (const i of floors) {
      const side = rng.next() < 0.5 ? 0 : 1;
      if (rng.next() < 0.5) rows[i][side].next.push(rows[i + 1][1 - side].id);
      else {
        // Flat: across the floor either way (a node already visited can't be entered again).
        rows[i][side].next.push(rows[i][1 - side].id);
        rows[i][1 - side].next.push(rows[i][side].id);
      }
    }
    const boss = add(lanes[0].length + 2, 0.5, 'boss');
    for (const n of rows[rows.length - 1]) n.next.push(boss.id);
    last = [boss];
  }
  return nodes;
}

export const currentNode = (run: RunState): RunNode => run.nodes[run.current];

/** Workday clock (minutes after midnight) when a node's floor starts: the floors share the act's shift evenly, so the
 * shift ends as its boss floor does. */
export function clockAt(run: RunState, node: RunNode): number {
  const floors = run.nodes.filter((n) => n.act === node.act).map((n) => n.floor);
  const first = Math.min(...floors);
  const count = Math.max(...floors) - first + 1;
  const [from, to] = CONFIG.shiftHours[Math.min(node.act, CONFIG.shiftHours.length) - 1];
  return Math.round((from + ((to - from) * (node.floor - first)) / count) * 60);
}
export const totalFloors = (run: RunState): number => Math.max(...run.nodes.map((n) => n.floor));

function rngOf(run: RunState): Rng {
  return new Rng(run.rng);
}

/** Enemy scaling: normal enemies get tougher as the act goes on. */
export function enemyScale(node: RunNode): { hp: number; dmg: number } {
  const f = node.type === 'fight' ? node.floor - 1 : 0;
  return { hp: (1 + 0.06 * f) * CONFIG.enemyHp, dmg: (1 + 0.04 * f) * CONFIG.enemyDmg };
}

export function combatSetup(run: RunState): CombatSetup {
  const node = currentNode(run);
  const rng = rngOf(run);
  const seed = (rng.next() * 2 ** 32) >>> 0;
  run.rng = rng.state;
  return {
    hero: HEROES[run.hero],
    hp: run.hp,
    maxHp: run.maxHp,
    deck: run.deck.map((c) => ({ ...c })),
    relics: run.relics,
    relicFlags: run.relicFlags,
    enemy: ENEMIES[node.enemy!],
    scale: enemyScale(node),
    seed,
    special: run.specialUsed ? undefined : HEROES[run.hero].special,
  };
}

/** Pay for beating an enemy of this tier in `seconds`: the base, plus a bonus for every second under par. */
export function fightPay(tier: EnemyDef['tier'], seconds: number): number {
  const p = CONFIG.pay;
  return p[tier] + Math.max(0, Math.round(p.par - seconds)) * p.perSecond;
}

/** Copies the combat outcome back into the run. */
export function applyCombat(run: RunState, combat: Combat): void {
  run.stats.damageTaken += Math.max(0, run.hp - combat.hero.hp);
  run.hp = Math.max(0, combat.hero.hp);
  run.stats.cardsPlayed += combat.cardsPlayed;
  if (combat.specialUsed) run.specialUsed = true;
  if (combat.consumed.length) run.deck = run.deck.filter((c) => !combat.consumed.includes(c.uid));
  if (combat.result === 'win') {
    run.stats.kills++;
    if (combat.enemy.def.tier === 'elite') run.stats.elites++;
    run.money += fightPay(combat.enemy.def.tier, combat.time);
    // A new shift starts rested: beating an act boss heals fully.
    if (currentNode(run).type === 'boss' && currentNode(run).next.length) run.hp = run.maxHp;
  }
  run.cleared = true;
}

const REWARD_ODDS: Record<'fight' | 'elite', [Rarity, number][]> = {
  fight: [
    ['common', 64],
    ['rare', 29],
    ['epic', 6],
    ['legendary', 1],
  ],
  elite: [
    ['common', 30],
    ['rare', 45],
    ['epic', 20],
    ['legendary', 5],
  ],
};

/** Four distinct reward cards for the current node (the player swaps one into the deck). */
export const REWARD_CHOICES = 4;

export function rollRewards(run: RunState, kind: 'fight' | 'elite'): CardDef[] {
  const rng = rngOf(run);
  const picks: CardDef[] = [];
  for (let tries = 0; picks.length < REWARD_CHOICES && tries < 80; tries++) {
    const rarity = rng.weighted(REWARD_ODDS[kind], ([, w]) => w)[0];
    const pool = rewardPool(run.hero, rarity).filter((c) => !picks.includes(c));
    if (pool.length) picks.push(rng.pick(pool));
  }
  run.rng = rng.state;
  discover(picks.map((p) => p.id));
  return picks;
}

function newCard(run: RunState, id: string): CardInst {
  resetUid(run.uid);
  const card = { uid: nextUid(), id, up: false };
  run.uid = peekUid();
  return card;
}

/** Max HP gained by skipping a card reward (so passing on a weak offer still pays). */
export const SKIP_MAX_HP = 3;

export function skipReward(run: RunState): void {
  run.maxHp += SKIP_MAX_HP;
  run.hp += SKIP_MAX_HP;
}

/** Cardstone's classic "swap": the new card replaces one already in the deck. */
export function swapCard(run: RunState, removeUid: number, id: string): void {
  const idx = run.deck.findIndex((c) => c.uid === removeUid);
  if (idx >= 0) run.deck[idx] = newCard(run, id);
}

export function upgradeCard(run: RunState, uid: number): void {
  const card = run.deck.find((c) => c.uid === uid);
  if (card) card.up = true;
}

export const canUpgrade = (card: CardInst): boolean => !card.up && CARDS[card.id].rarity !== 'special';

/** A perk fits a card when it would change something: a keyword it lacks, or a cost it can still lose. */
export function canPerk(card: CardInst, perk: string): boolean {
  const p = PERKS[perk];
  if (card.perks?.includes(perk) || CARDS[card.id].rarity === 'special') return false;
  if (p.keywords?.every((k) => cardKeywordsOf(card).includes(k))) return false;
  if (p.costDelta && cardCostOf(card) <= (CARDS[card.id].minCost ?? 0)) return false;
  return true;
}

export function addPerk(run: RunState, uid: number, perk: string): void {
  const card = run.deck.find((c) => c.uid === uid);
  if (card) card.perks = [...(card.perks ?? []), perk];
  run.cleared = true;
}

export const REST_HEAL = 0.35;

export function rest(run: RunState): number {
  const amount = Math.min(run.maxHp - run.hp, Math.round(run.maxHp * REST_HEAL));
  run.hp += amount;
  run.cleared = true;
  return amount;
}

/** Moves to a node reachable from the current one (the first by default). Returns false when the run is complete. */
export function advance(run: RunState, to?: number): boolean {
  const next = currentNode(run).next;
  const target = to ?? next.find((id) => !run.path.includes(id));
  if (target === undefined || !next.includes(target) || run.path.includes(target)) return false;
  run.current = target;
  run.path.push(target);
  run.cleared = false;
  const node = currentNode(run);
  if (node.type === 'boss') progress((u) => 'reachBoss' in u && u.reachBoss <= node.act);
  return true;
}

/** The run is over (won or lost): heroes unlocked by finishing a run with this hero. */
export function finishRun(run: RunState): void {
  clearRun();
  progress((u) => 'finishRun' in u && u.finishRun === run.hero);
}

export function saveRun(run: RunState): void {
  store(SAVE_KEY, run);
}

export function loadRun(): RunState | null {
  const run = loadRaw<RunState>(SAVE_KEY);
  if (run?.version !== 2 || !HEROES[run.hero]) return null;
  // Drop the save if content changed and it references cards/enemies that no longer exist.
  if (run.deck.some((c) => !CARDS[c.id] || c.perks?.some((p) => !PERKS[p])) || run.nodes.some((n) => n.enemy && !ENEMIES[n.enemy])) return null;
  // Saves from before pay existed start at zero.
  if (typeof run.money !== 'number') run.money = 0;
  return run;
}

export function clearRun(): void {
  remove(SAVE_KEY);
}
