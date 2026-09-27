import type { TKey } from '../core/i18n';
import type { Combat } from './combat';

export type HeroId = 'warrior' | 'mage' | 'necromancer';
export type CardClass = HeroId | 'neutral' | 'curse';
export type CardType = 'attack' | 'spell' | 'skill' | 'power' | 'potion' | 'curse';
export type Rarity = 'starter' | 'common' | 'rare' | 'epic' | 'legendary' | 'special' | 'unique';
export type Keyword = 'exhaust' | 'consume' | 'fleeting' | 'unplayable' | 'volatile' | 'innate' | 'unique';
export type Side = 'hero' | 'enemy';

/** A card in the run deck. */
export interface CardInst {
  uid: number;
  id: string;
  up: boolean;
}

/** A card during combat (a copy of a deck card, or a temporary one such as an enemy curse). */
export interface CombatCard extends CardInst {
  /** Per-combat scaling (e.g. Rampage). */
  bonus: number;
  /** Temporary cards don't belong to the run deck. */
  temp: boolean;
}

export interface BeltCard {
  card: CombatCard;
  /** Distance travelled, in belt widths. 0 = just entering on the right. */
  pos: number;
}

export interface CardDef {
  id: string;
  cls: CardClass;
  type: CardType;
  rarity: Rarity;
  /** -1 = X cost (spends all mana). */
  cost: number;
  upCost?: number;
  vals: number[];
  upVals?: number[];
  /** Indexes of `vals` that are damage, so the UI can preview modified values. */
  dmg?: number[];
  keywords?: Keyword[];
  upKeywords?: Keyword[];
  /** Icon id in ui/art/icons. */
  art: string;
  /**
   * Language-neutral card face: `{kind:i}` renders an icon plus value i, `{kind}` an icon alone,
   * `|` starts a new line. The full rules text lives in i18n (`card.<id>.desc`).
   */
  face: string;
  /** Art colour family override (otherwise derived from the face). */
  cat?: 'attack' | 'defense' | 'utility' | 'curse';
  /** Unlock pack id; cards without a pack are always available. */
  pack?: string;
  play?: (c: Combat, v: number[], card: CombatCard) => void;
  /** Triggered when the card leaves the belt without being played. */
  onExpire?: (c: Combat, v: number[], card: CombatCard) => void;
}

export type StatusKind = 'timed' | 'stacks' | 'dot';

export interface StatusDef {
  id: string;
  kind: StatusKind;
  good: boolean;
  icon: string;
  /** Timed statuses that also stack show their stacks instead of the seconds left. */
  showStacks?: boolean;
}

/** `v` = stacks/amount; `t` = seconds left for timed statuses. */
export interface StatusVal {
  v: number;
  t: number;
}

export type Statuses = Record<string, StatusVal>;

export type IntentType = 'attack' | 'defend' | 'buff' | 'debuff' | 'curse' | 'heal' | 'steal' | 'charge' | 'drain';

export interface MoveDef {
  id: string;
  intent: IntentType;
  /** Wind-up time in seconds before the move resolves. */
  windup: number;
  dmg?: number;
  hits?: number;
  block?: number;
  heal?: number;
  /** Statuses applied on resolve. */
  status?: { id: string; v?: number; t?: number; target: Side }[];
  /** Curses shuffled into the player's piles. */
  curse?: { id: string; n: number; to: 'belt' | 'draw' | 'discard' };
  steal?: number;
  drainMana?: number;
  /** Speeds the player's belt up for `t` seconds. */
  beltHaste?: number;
  fx?: (c: Combat) => void;
}

export interface EnemyDef {
  id: string;
  act: 1 | 2 | 3;
  tier: 'normal' | 'elite' | 'boss';
  hp: number;
  art: string;
  /** The frequent basic attack. */
  main: MoveDef;
  /** Special moves, used in turn: one after every `every` main attacks. */
  specials: MoveDef[];
  every: number;
  /** Statuses the enemy starts with. */
  start?: { id: string; v?: number; t?: number }[];
  /** Called once when HP drops under 50%. */
  onHalf?: (c: Combat) => void;
}

export interface HeroHooks {
  onCardPlayed?: (c: Combat, card: CombatCard, def: CardDef, manaSpent: number) => void;
  onCardExpired?: (c: Combat, card: CombatCard) => void;
  /** Called when the hero applies a status to the enemy. */
  onEnemyStatus?: (c: Combat, id: string, v: number) => void;
  /** Extra damage per tick of a damage-over-time status on the enemy. */
  enemyDotBonus?: (c: Combat, id: string) => number;
  onHeroHit?: (c: Combat, dmg: number) => void;
  /** Extra flat damage for hero damage from a card of the given type. */
  bonusDamage?: (c: Combat, def: CardDef | null) => number;
  damageMult?: (c: Combat, def: CardDef | null) => number;
  tick?: (c: Combat, dt: number) => void;
}

export interface HeroDef {
  id: HeroId;
  hp: number;
  maxMana: number;
  /** Seconds per mana point. */
  regen: number;
  /** Seconds per point of Block lost. */
  blockDecay: number;
  startDeck: string[];
  /** Once-per-run card that starts each fight in the sleeve (not part of the deck). */
  special: string;
  starterRelic?: string;
  color: string;
  ability: {
    id: string;
    /** Mana cost: abilities are expensive, a mid-fight power move once the crystals have grown. */
    cost: number;
    use: (c: Combat) => void;
  };
  hooks: HeroHooks;
}

export interface RelicHooks {
  onCombatStart?: (c: Combat) => void;
  onCardPlayed?: (c: Combat, card: CombatCard, def: CardDef) => void;
  onCombatEnd?: (c: Combat) => void;
  tick?: (c: Combat, dt: number) => void;
  /** Return true to cancel death (once-per-run relics flag themselves). */
  onDeath?: (c: Combat) => boolean;
}

export interface RelicDef {
  id: string;
  rarity: 'common' | 'rare' | 'epic' | 'boss' | 'starter' | 'special';
  cls?: HeroId;
  art: string;
  pack?: string;
  /** Static modifiers applied to combat setup. */
  mods?: Partial<{ maxMana: number; sleeve: number; beltSpeed: number; regen: number; maxHp: number; gold: number }>;
  hooks?: RelicHooks;
  /** Runs once when the relic is obtained. */
  onGain?: (run: import('./run').RunState) => void;
}

export type CombatEvent =
  | { type: 'damage'; target: Side; amount: number; blocked: number; source: Side | 'dot'; hitIndex: number; kind: string }
  | { type: 'heal'; target: Side; amount: number }
  | { type: 'block'; target: Side; amount: number }
  | { type: 'status'; target: Side; id: string; amount: number }
  | { type: 'text'; target: Side; key: TKey; tone: 'good' | 'bad' | 'neutral' }
  | { type: 'cardSpawn'; card: CombatCard }
  | { type: 'cardPlayed'; card: CombatCard; from: 'belt' | 'sleeve' }
  | { type: 'cardExpired'; card: CombatCard }
  | { type: 'cardStashed'; card: CombatCard; slot: number }
  | { type: 'cardStolen'; card: CombatCard }
  | { type: 'cantAfford'; card: CombatCard }
  | { type: 'curseAdded'; card: CombatCard; to: 'belt' | 'draw' | 'discard' }
  | { type: 'reshuffle' }
  | { type: 'enemyIntent'; move: MoveDef }
  | { type: 'enemyAct'; move: MoveDef }
  | { type: 'mana'; amount: number }
  | { type: 'manaCrystal'; amount: number }
  | { type: 'manaDrain'; amount: number }
  | { type: 'ability'; id: string }
  | { type: 'relic'; id: string }
  | { type: 'enrage' }
  | { type: 'end'; result: CombatResult };

export type CombatResult = 'win' | 'lose';
