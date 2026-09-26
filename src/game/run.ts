import { Rng } from '../core/rng';
import { loadRaw, remove, store } from '../core/save';
import { nextUid, peekUid, resetUid } from '../core/util';
import { CARDS, rewardPool } from '../data/cards';
import { CONFIG } from '../data/config';
import { ENEMIES, enemiesFor } from '../data/enemies';
import { HEROES } from '../data/heroes';
import type { Combat, CombatSetup } from './combat';
import { discover } from './meta';
import type { CardDef, CardInst, EnemyDef, HeroId, Rarity } from './types';

export type NodeType = 'fight' | 'elite' | 'rest' | 'boss';

/** One step of the run. `next` holds the reachable node ids, so a branching map can replace the line later. */
export interface RunNode {
  id: number;
  act: number;
  floor: number;
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
  version: 1;
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
  /** True once the current node has been completed. */
  cleared: boolean;
  stats: RunStats;
  uid: number;
}

const SAVE_KEY = 'run';
const ACT_PATTERN: NodeType[] = ['fight', 'fight', 'fight', 'rest', 'fight', 'elite', 'fight', 'fight', 'rest', 'boss'];
export const ACTS = 1;

export function newRun(hero: HeroId, seed: number): RunState {
  resetUid(0);
  const rng = new Rng(seed);
  const def = HEROES[hero];
  const nodes = buildNodes(rng);
  discover(def.startDeck);
  return {
    version: 1,
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
    cleared: false,
    stats: { kills: 0, elites: 0, cardsPlayed: 0, damageTaken: 0 },
    uid: peekUid(),
  };
}

function buildNodes(rng: Rng): RunNode[] {
  const nodes: RunNode[] = [];
  for (let act = 1; act <= ACTS; act++) {
    // Deal normal enemies from a shuffled bag so the same one doesn't repeat back to back.
    let bag: EnemyDef[] = [];
    ACT_PATTERN.forEach((type, i) => {
      const id = nodes.length;
      let enemy: string | undefined;
      if (type === 'fight') {
        if (!bag.length) bag = rng.shuffle(enemiesFor(act, 'normal'));
        enemy = bag.pop()!.id;
      } else if (type === 'elite' || type === 'boss') {
        enemy = rng.pick(enemiesFor(act, type)).id;
      }
      nodes.push({ id, act, floor: i + 1, type, next: [], enemy });
      if (id > 0) nodes[id - 1].next.push(id);
    });
  }
  return nodes;
}

export const currentNode = (run: RunState): RunNode => run.nodes[run.current];
export const totalFloors = (run: RunState): number => run.nodes.length;

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
  };
}

/** Copies the combat outcome back into the run. */
export function applyCombat(run: RunState, combat: Combat): void {
  run.stats.damageTaken += Math.max(0, run.hp - combat.hero.hp);
  run.hp = Math.max(0, combat.hero.hp);
  run.stats.cardsPlayed += combat.cardsPlayed;
  if (combat.consumed.length) run.deck = run.deck.filter((c) => !combat.consumed.includes(c.uid));
  if (combat.result === 'win') {
    run.stats.kills++;
    if (combat.enemy.def.tier === 'elite') run.stats.elites++;
  }
  run.cleared = true;
}

const REWARD_ODDS: Record<'fight' | 'elite', [Rarity, number][]> = {
  fight: [['common', 64], ['rare', 29], ['epic', 6], ['legendary', 1]],
  elite: [['common', 30], ['rare', 45], ['epic', 20], ['legendary', 5]],
};

/** Three distinct reward cards for the current node. */
export function rollRewards(run: RunState, kind: 'fight' | 'elite'): CardDef[] {
  const rng = rngOf(run);
  const picks: CardDef[] = [];
  for (let tries = 0; picks.length < 3 && tries < 50; tries++) {
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

export function addCard(run: RunState, id: string): void {
  run.deck.push(newCard(run, id));
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

export const REST_HEAL = 0.35;

export function rest(run: RunState): number {
  const amount = Math.min(run.maxHp - run.hp, Math.round(run.maxHp * REST_HEAL));
  run.hp += amount;
  run.cleared = true;
  return amount;
}

/** Moves to the next node. Returns false when the run is complete. */
export function advance(run: RunState): boolean {
  const next = currentNode(run).next[0];
  if (next === undefined) return false;
  run.current = next;
  run.cleared = false;
  return true;
}

export const isFinalNode = (run: RunState): boolean => currentNode(run).next.length === 0;

export function saveRun(run: RunState): void {
  store(SAVE_KEY, run);
}

export function loadRun(): RunState | null {
  const run = loadRaw<RunState>(SAVE_KEY);
  if (!run || run.version !== 1 || !HEROES[run.hero]) return null;
  // Drop the save if content changed and it references cards/enemies that no longer exist.
  if (run.deck.some((c) => !CARDS[c.id]) || run.nodes.some((n) => n.enemy && !ENEMIES[n.enemy])) return null;
  return run;
}

export function clearRun(): void {
  remove(SAVE_KEY);
}
