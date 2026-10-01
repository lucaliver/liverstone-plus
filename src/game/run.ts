import { Rng } from '../core/rng';
import { loadRaw, remove, store } from '../core/save';
import { nextUid, peekUid, resetUid } from '../core/util';
import { CARD_LIST, CARDS, cardCostOf, cardKeywordsOf, rewardPool } from '../data/cards';
import { PERKS } from '../data/perks';
import { RELIC_LIST, RELICS } from '../data/relics';
import { ACT_DEFS, actDef } from '../data/acts';
import { CONFIG, REWARD_MIN_LEGENDARY, type RewardKind, rewardOdds, rewardUpgradeChance } from '../data/config';
import { MODIFIERS, resolveMods } from '../data/modifiers';
import { ENEMIES, enemiesFor, firstRunEnemy } from '../data/enemies';
import { HERO_LIST, HEROES, starterCards } from '../data/heroes';
import type { Combat, CombatSetup } from './combat';
import { discover, progress, type RunRecord, recordFight, recordRun, seeRelics, stampAct } from './meta';
import { renamedCard, renamedEnemy, renamedPerk } from './renamed';
import type { CardDef, CardInst, EnemyDef, HeroId } from './types';

export const NODE_TYPES = ['fight', 'elite', 'rest', 'promotion', 'copy', 'tailor', 'lostFound', 'vending', 'crossTraining', 'boss'] as const;
export type NodeType = (typeof NODE_TYPES)[number];

/** A room of a lane as written in `LANES`: a real room type or a slot still to be dealt. */
type Slot = NodeType | 'special';

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

/** Shape of the saved run; older saves are migrated on load when possible, dropped otherwise. */
const SAVE_VERSION = 3;

export interface RunState {
  version: number;
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
  /** Card rewards skipped for max HP so far: each one raises the next skip's pay. */
  skips: number;
  /** True once the current node has been completed. */
  cleared: boolean;
  stats: RunStats;
  /** Pay earned so far: the run's score (fast wins pay more). */
  money: number;
  uid: number;
  /** Management memos active for this run (`MODIFIERS` ids). */
  mods: string[];
  /** The very first run: act 1's map is fixed and its first rewards are picked (`HeroDef.firstRewards`); later acts are dealt as usual. */
  scripted?: boolean;
}

const SAVE_KEY = 'run';
/**
 * Floors between the first fight and the boss, one list per lane. Lanes are dealt to a random side, and a few
 * floors swap their two nodes, so each run's map differs while both lanes keep a fair mix.
 */
const LANES: Slot[][] = [
  ['fight', 'fight', 'rest', 'fight', 'elite', 'special', 'fight', 'rest'],
  ['fight', 'promotion', 'fight', 'rest', 'fight', 'special', 'fight', 'rest'],
];
/** A `special` slot of a lane becomes one of these when the act is built; one act never deals the same room twice. */
export const SPECIALS: NodeType[] = ['copy', 'tailor', 'lostFound', 'vending', 'crossTraining'];
/** Floors on a single road at the start of act 1, before the map splits in two (then the lanes skip as many floors). */
const ACT1_OPENING = 3;
/** Links between the lanes per act: diagonal (to the other lane one floor up) or flat (across the same floor, both ways). */
const LINKS = 2;
export const ACTS = ACT_DEFS.length;

/** Seed of the very first run: its map is always the same, with the enemies in order of difficulty. */
export const FIRST_RUN_SEED = 1;
/** The very first run's act 1 normal enemies, one per floor from the second (both lanes of a floor meet the same one). */
const FIRST_RUN_ENEMIES = ['snitch', 'newHire', 'workWife', 'teamLeader', 'goblinConsultant', 'seniorBoomer', 'hrBitch'];
/** The very first run's lanes, as `LANES` but already past the opening: a rest on each side, never two in a row. */
const FIRST_RUN_LANES: NodeType[][] = [
  ['fight', 'rest', 'elite', 'fight', 'fight', 'rest'],
  ['rest', 'fight', 'fight', 'promotion', 'fight', 'rest'],
];

/**
 * A new run; a `scripted` one (the very first) has a fixed act 1 map and enemies (`FIRST_RUN_*`) instead of shuffled ones, then
 * goes on through every act like any other. `mods` are the memos it plays under.
 */
export function newRun(hero: HeroId, seed: number, scripted = false, mods: string[] = []): RunState {
  resetUid(0);
  const rng = new Rng(seed);
  const def = HEROES[hero];
  const nodes = buildNodes(rng, scripted);
  discover(def.startDeck);
  const maxHp = Math.round(def.hp * resolveMods(mods).heroHp);
  return {
    version: SAVE_VERSION,
    seed,
    rng: rng.state,
    hero,
    hp: maxHp,
    maxHp,
    deck: starterCards(def).map((c) => ({ uid: nextUid(), ...c })),
    relics: def.starterRelic ? [def.starterRelic] : [],
    relicFlags: {},
    nodes,
    current: 0,
    path: [0],
    cleared: false,
    stats: { kills: 0, elites: 0, cardsPlayed: 0, damageTaken: 0 },
    money: 0,
    skips: 0,
    uid: peekUid(),
    mods,
    scripted,
  };
}

/**
 * One act appended to `nodes`: a shared road (one fight; three floors in act 1), two lanes linked a couple of times, and the
 * boss where they meet. `last` are the nodes of the act before (they lead to its first fight). Returns the boss.
 */
function addAct(nodes: RunNode[], rng: Rng, act: number, last: RunNode[], scripted: boolean): RunNode[] {
  // Deal normal enemies from a shuffled bag so the same one doesn't repeat back to back.
  let bag: EnemyDef[] = [];
  let specials: NodeType[] = [];
  const add = (floor: number, lane: number, slot: Slot, fixed?: string): RunNode => {
    if (slot === 'special' && !specials.length) specials = rng.shuffle([...SPECIALS]);
    const type = slot === 'special' ? specials.pop()! : slot;
    // A set enemy (the orientation fight) takes nobody's turn.
    let enemy = fixed;
    if (!enemy && type === 'fight') {
      if (scripted) enemy = FIRST_RUN_ENEMIES[floor - 2];
      else {
        if (!bag.length) bag = rng.shuffle(enemiesFor(act, 'normal'));
        enemy = bag.pop()!.id;
      }
    } else if (!enemy && (type === 'elite' || type === 'boss')) {
      enemy = scripted ? enemiesFor(act, type)[0].id : rng.pick(enemiesFor(act, type)).id;
    }
    const node: RunNode = { id: nodes.length, act, floor, lane, type, next: [], enemy };
    nodes.push(node);
    return node;
  };
  const opening = act === 1 ? ACT1_OPENING : 1;
  const lanes = scripted ? FIRST_RUN_LANES : rng.shuffle(LANES.map((l) => l.slice(opening - 1)));
  if (!scripted)
    for (let i = 0; i < lanes[0].length - 1; i++) if (rng.next() < CONFIG.laneSwap) [lanes[0][i], lanes[1][i]] = [lanes[1][i], lanes[0][i]];

  // The shared road: one fight per floor, then the two lanes. The very first run opens on its orientation fight.
  let road = add(1, 0.5, 'fight', act === 1 && scripted ? firstRunEnemy()?.id : undefined);
  for (const n of last) n.next.push(road.id);
  for (let f = 2; f <= opening; f++) {
    const n = add(f, 0.5, 'fight');
    road.next.push(n.id);
    road = n;
  }
  const rows = lanes[0].map((_, i) => [add(i + opening + 1, 0, lanes[0][i]), add(i + opening + 1, 1, lanes[1][i])]);
  road.next.push(rows[0][0].id, rows[0][1].id);
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
  const boss = add(lanes[0].length + opening + 1, 0.5, 'boss');
  for (const n of rows[rows.length - 1]) n.next.push(boss.id);
  return [boss];
}

function buildNodes(rng: Rng, scripted: boolean): RunNode[] {
  const nodes: RunNode[] = [];
  let last: RunNode[] = [];
  for (let act = 1; act <= ACTS; act++) last = addAct(nodes, rng, act, last, scripted && act === 1);
  return nodes;
}

export const currentNode = (run: RunState): RunNode => run.nodes[run.current];

/** Workday clock (minutes after midnight) when a node's floor starts: the floors share the act's shift evenly, so the
 * shift ends as its boss floor does. */
export function clockAt(run: RunState, node: RunNode): number {
  const floors = run.nodes.filter((n) => n.act === node.act).map((n) => n.floor);
  const first = Math.min(...floors);
  const count = Math.max(...floors) - first + 1;
  const [from, to] = actDef(node.act).shift;
  return Math.round((from + ((to - from) * (node.floor - first)) / count) * 60);
}
export const totalFloors = (run: RunState): number => Math.max(...run.nodes.map((n) => n.floor));

function rngOf(run: RunState): Rng {
  return new Rng(run.rng);
}

/** Enemy scaling: normal enemies get tougher as the act goes on, and every enemy under the run's memos. */
export function enemyScale(node: RunNode, mods: string[] = []): { hp: number; dmg: number } {
  const f = node.type === 'fight' ? node.floor - 1 : 0;
  const m = resolveMods(mods);
  return { hp: (1 + CONFIG.floorHp * f) * CONFIG.enemyHp * m.enemyHp, dmg: (1 + CONFIG.floorDmg * f) * CONFIG.enemyDmg * m.enemyDmg };
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
    scale: enemyScale(node, run.mods),
    beltMul: resolveMods(run.mods).beltMul,
    seed,
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
  const node = currentNode(run);
  recordFight({
    tier: combat.enemy.def.tier,
    won: combat.result === 'win',
    seconds: combat.time,
    cards: combat.cardsPlayed,
  });
  if (combat.consumed.length) run.deck = run.deck.filter((c) => !combat.consumed.includes(c.uid));
  if (combat.result === 'win') {
    run.stats.kills++;
    if (combat.enemy.def.tier === 'elite') run.stats.elites++;
    run.money += fightPay(combat.enemy.def.tier, combat.time);
    if (node.type === 'boss') stampAct(run.hero, node.act);
    // A new shift starts rested: beating an act boss heals fully.
    if (node.type === 'boss' && node.next.length) run.hp = run.maxHp;
  }
  run.cleared = true;
}

/** Distinct reward cards for the current node (the player swaps one into the deck). */
export const REWARD_CHOICES = 4;
export const rewardChoices = (run: RunState): number => Math.max(1, REWARD_CHOICES + resolveMods(run.mods).rewardCards);

/** A card on offer: one of the offered cards may come already upgraded. */
export interface RewardOffer {
  def: CardDef;
  up: boolean;
}

export function rollRewards(run: RunState, kind: RewardKind): RewardOffer[] {
  // The very first run teaches with hand-picked offers after its first fights (the win just counted is `kills`).
  const firsts = run.scripted ? HEROES[run.hero].firstRewards?.[run.stats.kills - 1] : undefined;
  if (firsts) {
    discover(firsts);
    return firsts.map((id) => ({ def: CARDS[id], up: false }));
  }
  const rng = rngOf(run);
  const picks: CardDef[] = [];
  const odds = rewardOdds(kind, currentNode(run).act);
  for (let tries = 0; picks.length < rewardChoices(run) && tries < 80; tries++) {
    const rarity = picks.length < REWARD_MIN_LEGENDARY[kind] ? 'legendary' : rng.weighted(odds, ([, w]) => w)[0];
    const pool = rewardPool(run.hero, rarity).filter((c) => !picks.includes(c));
    if (pool.length) picks.push(rng.pick(pool));
  }
  const upgraded = picks.length && rng.next() < rewardUpgradeChance(currentNode(run).act) ? rng.int(0, picks.length - 1) : -1;
  run.rng = rng.state;
  discover(picks.map((p) => p.id));
  return picks.map((def, i) => ({ def, up: i === upgraded }));
}

function newCard(run: RunState, id: string): CardInst {
  resetUid(run.uid);
  const card = { uid: nextUid(), id, up: false };
  run.uid = peekUid();
  return card;
}

/** Skipping a card reward pays max HP (so passing on a weak offer still pays), a little more every time. */
export const skipPay = (run: RunState): number => CONFIG.skipMaxHp + CONFIG.skipMaxHpStep * run.skips;

export function skipReward(run: RunState): void {
  const pay = skipPay(run);
  run.maxHp += pay;
  run.hp += pay;
  run.skips++;
}

/** Debug: adds a copy of a card to the deck. */
export function addCard(run: RunState, id: string): void {
  run.deck.push(newCard(run, id));
}

/** The new card replaces one already in the deck (a reward). */
export function swapCard(run: RunState, removeUid: number, id: string, up = false): void {
  const idx = run.deck.findIndex((c) => c.uid === removeUid);
  if (idx >= 0) run.deck[idx] = { ...newCard(run, id), up };
}

export function upgradeCard(run: RunState, uid: number): void {
  const card = run.deck.find((c) => c.uid === uid);
  if (card) card.up = true;
}

/** Curses and special cards (generated in a fight) are never upgraded or perked. */
const fixed = (card: CardInst): boolean => CARDS[card.id].cls === 'curse' || CARDS[card.id].rarity === 'special';

export const canUpgrade = (card: CardInst): boolean => !card.up && !fixed(card);

/** A perk fits a card when it would change something: a keyword it lacks, or a cost it can still lose. */
export function canPerk(card: CardInst, perk: string): boolean {
  const p = PERKS[perk];
  if (card.perks?.includes(perk) || fixed(card)) return false;
  if (p.keywords?.every((k) => cardKeywordsOf(card).includes(k))) return false;
  if (p.costDelta && cardCostOf(card) <= (CARDS[card.id].minCost ?? 0)) return false;
  return true;
}

export function addPerk(run: RunState, uid: number, perk: string): void {
  const card = run.deck.find((c) => c.uid === uid);
  if (card) card.perks = [...(card.perks ?? []), perk];
  run.cleared = true;
}

export const hasRelic = (run: RunState, id: string): boolean => run.relics.includes(id);

/** The run takes a relic (once each). */
export function gainRelic(run: RunState, id: string): void {
  if (!hasRelic(run, id)) {
    run.relics.push(id);
    RELICS[id].onGain?.(run);
  }
  seeRelics([id]);
  run.cleared = true;
}

/** The relics the Lost & Found offers: random ones the run doesn't hold yet. */
export function rollRelics(run: RunState): string[] {
  const rng = rngOf(run);
  const picks = rng
    .shuffle(RELIC_LIST.filter((r) => r.rarity !== 'special' && !hasRelic(run, r.id)))
    .slice(0, CONFIG.lostFoundChoices)
    .map((r) => r.id);
  run.rng = rng.state;
  seeRelics(picks);
  return picks;
}

/** Vending Machine: what a snack costs in HP, by the rarity of the card that drops. */
export const vendingCost = (rarity: keyof typeof CONFIG.vendingHp): number => CONFIG.vendingHp[rarity];
export const canVend = (run: RunState, rarity: keyof typeof CONFIG.vendingHp): boolean => run.hp > vendingCost(rarity);

/** A random card of this rarity drops into the deck, for HP. Returns it. */
export function vend(run: RunState, rarity: keyof typeof CONFIG.vendingHp): CardInst {
  const rng = rngOf(run);
  const def = rng.pick(rewardPool(run.hero, rarity));
  run.rng = rng.state;
  run.hp -= vendingCost(rarity);
  discover([def.id]);
  const card = newCard(run, def.id);
  run.deck.push(card);
  run.cleared = true;
  return card;
}

/** Cross-Training: `crossTrainPerClass` cards from each class but the hero's own, to take one of (rarities as after a normal fight of the act). */
export function rollCrossTraining(run: RunState): CardDef[] {
  const rng = rngOf(run);
  const odds = rewardOdds('fight', currentNode(run).act);
  const offer: CardDef[] = [];
  for (const hero of HERO_LIST) {
    if (hero.id === run.hero) continue;
    const own: CardDef[] = [];
    for (let tries = 0; own.length < CONFIG.crossTrainPerClass && tries < 80; tries++) {
      const rarity = rng.weighted(odds, ([, w]) => w)[0];
      const pool = CARD_LIST.filter((c) => c.cls === hero.id && c.rarity === rarity && !c.pack && !own.includes(c));
      if (pool.length) own.push(rng.pick(pool));
    }
    offer.push(...own);
  }
  run.rng = rng.state;
  discover(offer.map((c) => c.id));
  return offer;
}

/** The hero takes one of the Cross-Training cards into the deck. Returns it. */
export function crossTrain(run: RunState, id: string): CardInst {
  const card = newCard(run, id);
  run.deck.push(card);
  run.cleared = true;
  return card;
}

/** Tailor: the uniform is let out, for good: more max HP, filled up. */
export function tailorVest(run: RunState): void {
  run.maxHp += CONFIG.tailorMaxHp;
  run.hp += CONFIG.tailorMaxHp;
  run.cleared = true;
}

export const canShred = (run: RunState): boolean => run.deck.length > CONFIG.shredMinDeck;
export const canCopy = (run: RunState): boolean => run.hp > CONFIG.copyHpCost;

export function shredCard(run: RunState, uid: number): void {
  run.deck = run.deck.filter((c) => c.uid !== uid);
  run.cleared = true;
}

/** A second copy of a deck card, upgrade and perks included, for some HP. */
export function photocopyCard(run: RunState, uid: number): void {
  const src = run.deck.find((c) => c.uid === uid);
  if (!src) return;
  const copy = newCard(run, src.id);
  copy.up = src.up;
  if (src.perks) copy.perks = [...src.perks];
  run.deck.push(copy);
  run.hp -= CONFIG.copyHpCost;
  run.cleared = true;
}

/** HP a Break Room rest would heal now. */
export const restHeal = (run: RunState): number => {
  const missing = run.maxHp - run.hp;
  return Math.min(missing, Math.round((run.maxHp * CONFIG.restHeal + missing * CONFIG.restHealMissing) * resolveMods(run.mods).restHeal));
};

export function rest(run: RunState): number {
  const amount = restHeal(run);
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

/** What the end of a run brought: the heroes it unlocked (the next hires) and the one-run records it beat. */
export interface RunEnd {
  hired: HeroId[];
  beaten: RunRecord[];
}

/** Ends the run (won or lost): records it and unlocks the heroes that finishing a run with this hero brings. */
export function finishRun(run: RunState, won: boolean): RunEnd {
  clearRun();
  const node = currentNode(run);
  const beaten = recordRun({
    won,
    fullDay: won && node.act === ACTS,
    act: node.act,
    floor: node.floor,
    pay: run.money,
    kills: run.stats.kills,
    cards: run.stats.cardsPlayed,
  });
  return { hired: progress((u) => 'finishRun' in u && u.finishRun === run.hero), beaten };
}

export function saveRun(run: RunState): void {
  store(SAVE_KEY, run);
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isStrings = (x: unknown): x is string[] => Array.isArray(x) && x.every((s) => typeof s === 'string');
const isIndexes = (x: unknown, len: number): x is number[] => Array.isArray(x) && x.every((i) => Number.isInteger(i) && i >= 0 && i < len);

const isCard = (c: unknown): c is CardInst =>
  isObj(c) &&
  isNum(c.uid) &&
  typeof c.id === 'string' &&
  !!CARDS[c.id] &&
  typeof c.up === 'boolean' &&
  (c.perks === undefined || (isStrings(c.perks) && c.perks.every((p) => !!PERKS[p])));

const isNode = (n: unknown, i: number, len: number): n is RunNode => {
  if (!isObj(n) || n.id !== i || !isNum(n.lane) || !isIndexes(n.next, len)) return false;
  const { act, floor } = n;
  if (!isNum(act) || !isNum(floor) || !Number.isInteger(act) || act < 1 || act > ACTS) return false;
  const type = NODE_TYPES.find((x) => x === n.type);
  // Fights, elites and bosses carry their enemy; rooms don't.
  return (
    !!type && (type === 'fight' || type === 'elite' || type === 'boss' ? typeof n.enemy === 'string' && !!ENEMIES[n.enemy] : n.enemy === undefined)
  );
};

/** Saved data is untrusted: a run that doesn't have the exact shape (or names content that no longer exists) is dropped. */
function parseRun(raw: unknown): RunState | null {
  if (!isObj(raw) || raw.version !== SAVE_VERSION) return null;
  const { hero, hp, maxHp, seed, rng, uid, current, cleared, deck, relics, relicFlags, nodes, path, stats, money, skips, mods, scripted } = raw;
  const heroId = HERO_LIST.find((hd) => hd.id === hero)?.id;
  if (!heroId || !isNum(hp) || !isNum(maxHp) || !isNum(seed) || !isNum(rng) || !isNum(uid) || typeof cleared !== 'boolean') return null;
  if (!Array.isArray(deck) || !deck.every(isCard) || !isStrings(relics)) return null;
  if (!isObj(relicFlags) || !Object.values(relicFlags).every(isNum)) return null;
  if (!Array.isArray(nodes) || !nodes.length || !nodes.every((n, i) => isNode(n, i, nodes.length))) return null;
  if (!isNum(current) || !isIndexes([current], nodes.length) || !isIndexes(path, nodes.length) || !isObj(stats)) return null;
  const { kills, elites, cardsPlayed, damageTaken } = stats;
  if (!isNum(kills) || !isNum(elites) || !isNum(cardsPlayed) || !isNum(damageTaken)) return null;
  // A run saved before the last act existed carries on into it: the missing acts are dealt from the run's seed.
  for (let act = Math.max(...nodes.map((n) => n.act)) + 1; act <= ACTS; act++) {
    const boss = nodes.filter((n) => n.act === act - 1 && n.type === 'boss');
    addAct(nodes, new Rng(seed + act * 7919), act, boss, false);
  }
  return {
    version: SAVE_VERSION,
    seed,
    rng,
    hero: heroId,
    hp,
    maxHp,
    deck,
    relics: relics.filter((id) => !!RELICS[id]),
    relicFlags: Object.fromEntries(Object.entries(relicFlags).filter((e): e is [string, number] => isNum(e[1]))),
    nodes,
    current,
    path,
    cleared,
    stats: { kills, elites, cardsPlayed, damageTaken },
    // Saves from before pay existed start at zero.
    money: isNum(money) ? money : 0,
    skips: isNum(skips) ? skips : 0,
    uid,
    // Saves from before memos existed carry none.
    mods: isStrings(mods) ? mods.filter((id) => id in MODIFIERS) : [],
    scripted: scripted === true,
  };
}

export function loadRun(): RunState | null {
  const run = loadRaw<unknown>(SAVE_KEY);
  // Version 2 had the ids from before they followed the English names.
  if (isObj(run) && run.version === 2 && Array.isArray(run.deck) && Array.isArray(run.nodes)) {
    for (const c of run.deck) {
      if (!isObj(c)) continue;
      if (typeof c.id === 'string') c.id = renamedCard(c.id);
      if (isStrings(c.perks)) c.perks = c.perks.map(renamedPerk);
    }
    for (const n of run.nodes) if (isObj(n) && typeof n.enemy === 'string') n.enemy = renamedEnemy(n.enemy);
    run.version = SAVE_VERSION;
  }
  return parseRun(run);
}

export function clearRun(): void {
  remove(SAVE_KEY);
}
