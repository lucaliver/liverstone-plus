import type { TKey } from '../core/i18n';
import type { Combat } from './combat';

export type HeroId = 'warrior' | 'mage' | 'necromancer';
export type CardClass = HeroId | 'neutral' | 'curse';
export type CardType = 'attack' | 'spell' | 'skill' | 'power' | 'potion' | 'curse';
export type Rarity = 'starter' | 'common' | 'rare' | 'epic' | 'legendary' | 'special';
export type Keyword = 'exhaust' | 'consume' | 'fleeting' | 'unplayable' | 'volatile' | 'innate' | 'pending' | 'bulky';
export type Side = 'hero' | 'enemy';

/** A card in the run deck. */
export interface CardInst {
  uid: number;
  id: string;
  up: boolean;
  /** Permanent perks earned on this copy (Promotion), ids of `PERKS`. */
  perks?: string[];
}

/** A permanent perk a deck card can earn: extra keywords and/or a cost change. */
export interface PerkDef {
  id: string;
  icon: string;
  keywords?: Keyword[];
  costDelta?: number;
}

/** A curse cast on one card during a fight (e.g. petrified): it must be tapped `taps` times, then thaws for `thaw` s. */
export interface HexDef {
  id: string;
  icon: string;
  taps: number;
  thaw: number;
}

/** A hex on a combat card: `left` taps still needed; once 0, it thaws for `t` seconds and the card is free. */
export interface CardHex {
  id: string;
  left: number;
  t: number;
}

/** A card during combat (a copy of a deck card, or a temporary one such as an enemy curse). */
export interface CombatCard extends CardInst {
  /** Per-combat scaling (e.g. Rampage). */
  bonus: number;
  /** Temporary cards don't belong to the run deck. */
  temp: boolean;
  hex?: CardHex;
  /** True once the card has ridden the whole belt this fight (a Pending card becomes playable). */
  passed?: boolean;
  /** Extra mana cost until the card is next played (Inflation). */
  tax?: number;
  /** Seconds spent on the belt since it was drawn (cards with `ride` change with it). */
  age?: number;
  /** Mana its cost has dropped by so far this fight (`costDrop`). */
  cut?: number;
}

export interface BeltCard {
  card: CombatCard;
  /** Distance travelled, in belt widths. 0 = just entering on the right. */
  pos: number;
  /** Belt row (0 = top); always 0 on a one-row belt. */
  row: number;
  /** Pinned where it is (Team Change): it doesn't move or leave until played or stashed; other cards ride past it. */
  pinned?: boolean;
  /** Stopped at the exit as part of a pile (an `anchor` card and the attacks behind it). */
  stuck?: boolean;
}

export interface CardDef {
  id: string;
  cls: CardClass;
  type: CardType;
  rarity: Rarity;
  /** -1 = X cost (spends all mana). */
  cost: number;
  upCost?: number;
  /** Discounts (perks) never take the cost below this (mana crystals must always cost something). */
  minCost?: number;
  vals: number[];
  upVals?: number[];
  /** The value `CombatCard.bonus` adds to (default: the first damage value): a curse that hits harder every time. */
  bonusIdx?: number;
  /** Indexes of `vals` that are damage (live previews). Derived from the `{dmg:N}` glyphs of `face` unless set. */
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
  /** Card widths it covers on the belt (default 1): wider cards ride over the ones ahead of them. */
  span?: number;
  /** A wide card that covers both belt rows ahead of it, not just its own. */
  tall?: boolean;
  /** While on the belt, every other card of its row is out of reach (Priority Task). */
  lockRow?: boolean;
  /**
   * Stops at the exit instead of leaving. Attack cards reaching it pile up behind it (out of reach); any other card
   * reaching the pile sends it all off the belt. Resolving it should call `playPile` (On a Roll).
   */
  anchor?: true;
  /**
   * The value at `vals[i]` changes by `vals[by]` for every second the card rides the belt, until it reaches `vals[to]`
   * (it grows when `to` is above the base, decays when below). Frozen while the card waits in the sleeve.
   */
  ride?: { i: number; by: number; to: number };
  /** Damage this card gains for every second the hero's mana is full and overflowing, wherever the card is. */
  onOverflow?: number;
  /** The first time ever it rides onto the belt, the fight stops and a note (`card.<id>.tip`) says how to handle it. */
  tip?: true;
  /** Index of the value its cost drops by every second of the fight, wherever the card is (Moving Box). */
  costDrop?: number;
  /** Bonus effects that only work while the card waits in the sleeve (`v` = its values, `card` = the copy held). */
  inSleeve?: {
    /** Extra damage for the hero's cards of any type (`def` = the card dealing it). */
    bonusDamage?: (c: Combat, v: number[], def: CardDef | null) => number;
    /** Another card was just played. */
    onCardPlayed?: (c: Combat, v: number[], card: CombatCard, played: CardDef) => void;
    /** An enemy hit got through to the hero. */
    onHeroHit?: (c: Combat, v: number[], card: CombatCard, lost: number) => void;
  };
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
  /** A permanent trait (enemy passives): shown without a number. */
  passive?: boolean;
  /** Icon when the status is on the hero, if it must read differently there (you stunned vs the enemy stunned). */
  selfIcon?: string;
  /** While active, its amount (`v`) counts as Strength: extra damage for attack cards (a timed one is a temporary boost). */
  strength?: true;
  /** While active on the enemy, its amount (`v`) is taken off every hit of the hero's cards (Fine Print); Poison, Burn and thorns slip through. */
  cutsHits?: true;
  /** While active on the hero, multiplies its mana regeneration (a chill slows it, Brown Nosing speeds it up). */
  regenMul?: number;
  /** A rule while active: returns why the hero can't play this card (`uid`: belt or sleeve copy) now (an i18n key), or null. */
  canPlay?: (c: Combat, side: Side, def: CardDef, uid: number) => TKey | null;
  /** While active (on either side), the hero's max mana can't grow past this. */
  manaCap?: number;
  /** Reacts to every card the hero plays after the status was applied. */
  onCardPlayed?: (c: Combat, side: Side, def: CardDef) => void;
  /** The side carrying it just lost HP to a hit (`lost` > 0). */
  onHurt?: (c: Combat, side: Side, s: StatusVal, lost: number) => void;
  /** The side carrying it just attacked: one of its moves dealt damage (Burn). */
  onAttack?: (c: Combat, side: Side, s: StatusVal) => void;
  /** The enemy carrying it just took a lethal hit: return true to survive it (the status removes itself if it was a one-off). */
  onDeath?: (c: Combat, side: Side, s: StatusVal) => boolean;
  /** A card of the hero's just left the belt unplayed. */
  onExpire?: (c: Combat, side: Side, s: StatusVal) => void;
  /** Runs every simulation step while the status is active. */
  tick?: (c: Combat, side: Side, s: StatusVal, dt: number) => void;
}

/** `v` = stacks/amount; `t` = seconds left for timed statuses; `e` = a free clock for statuses with a tick. */
export interface StatusVal {
  v: number;
  t: number;
  e?: number;
}

export type Statuses = Record<string, StatusVal>;

export type IntentType = 'attack' | 'defend' | 'buff' | 'debuff' | 'curse' | 'heal' | 'steal' | 'charge' | 'drain' | 'idle' | 'absorb';

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
  /** Curses shuffled into the player's piles (several kinds at once if needed). */
  curse?: { id: string; n: number; to: 'belt' | 'draw' | 'discard' }[];
  steal?: number;
  drainMana?: number;
  /** Hexes cards (see `HEXES`): a `share` (0–1) of the belt, and the same share of the rest of the deck. */
  hex?: { id: string; share: number };
  /** Inflation: this many random cards (belt first, then the rest of the deck) cost 1 more mana until next played. */
  inflate?: number;
  /** While this move charges, the damage the enemy takes from cards is stored instead of lost… */
  absorb?: boolean;
  /** …and a `release` move adds everything stored to its hit. */
  release?: boolean;
  fx?: (c: Combat) => void;
}

export interface EnemyDef {
  id: string;
  act: 1 | 2 | 3;
  tier: 'normal' | 'elite' | 'boss';
  hp: number;
  art: string;
  /** The steady basic attack. */
  main: MoveDef;
  /** Special moves, used in turn: one after every `every` main attacks. */
  specials: MoveDef[];
  every: number;
  /** Block it starts the fight with (elites and bosses come armoured). */
  block?: number;
  /** Statuses the enemy starts with. */
  start?: { id: string; v?: number; t?: number }[];
  /** Curse card that fills every sleeve slot at the start of the fight. */
  fillSleeve?: string;
  /** Hex cast on a `share` (0–1) of your cards at the start of the fight. */
  startHex?: { id: string; share: number };
  /** Called once when HP drops under 50%. */
  onHalf?: (c: Combat) => void;
  /** At half HP it also says something (`enemy.<id>.speech`, shown in a speech bubble). */
  halfSpeech?: boolean;
  /** Sprite once its half-HP trait has triggered (it shows its true face). */
  halfArt?: string;
  /** Its half-HP trait is a surprise: not announced before the fight starts. */
  halfSecret?: boolean;
  /** Belt rows open at the start of the fight (the rest stay shut until `openBeltRows`). */
  startRows?: number;
  /** Only met as the very first fight of the very first run (never dealt at random). */
  firstRunOnly?: boolean;
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

/** Lifetime records, kept across runs (the handbook's Records tab). */
export interface Records {
  /** Runs won (the trial shift too), and full workdays won (every act). */
  wins: number;
  fullDays: number;
  kills: number;
  elites: number;
  bosses: number;
  cardsPlayed: number;
  /** Most pay, kills and cards played in one run. */
  bestPay: number;
  bestKills: number;
  bestCards: number;
  /** Furthest act and floor reached. */
  bestAct: number;
  bestFloor: number;
  /** Fastest fight won, in seconds (0 = none yet). */
  fastest: number;
}

/** How a hero is unlocked: finish a run (win or lose) with another hero, or reach the boss of an act. */
export type HeroUnlock = { finishRun: HeroId } | { reachBoss: number };

export interface HeroDef {
  id: HeroId;
  /** Locked until this is done once (always available when omitted). */
  unlock?: HeroUnlock;
  hp: number;
  maxMana: number;
  /** Seconds per mana point. */
  regen: number;
  /** Seconds per point of Block lost. */
  blockDecay: number;
  startDeck: string[];
  /** The very first run's reward offers after its first fights, in order (picked to teach, not rolled). */
  firstRewards?: string[][];
  /** Sleeve slots. */
  sleeve: number;
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
  | { type: 'cardAdded'; card: CombatCard; to: 'belt' | 'draw' | 'discard' }
  | { type: 'cardDiscarded'; card: CombatCard }
  | { type: 'hexed'; card: CombatCard }
  | { type: 'inflated'; card: CombatCard }
  | { type: 'absorbed'; amount: number }
  | { type: 'hexTap'; card: CombatCard }
  | { type: 'hexBroken'; card: CombatCard }
  | { type: 'reshuffle' }
  | { type: 'enemyIntent'; move: MoveDef }
  | { type: 'enemyAct'; move: MoveDef }
  | { type: 'mana'; amount: number }
  | { type: 'manaCrystal'; amount: number }
  | { type: 'manaDrain'; amount: number }
  | { type: 'ability'; id: string }
  | { type: 'relic'; id: string }
  | { type: 'enrage' }
  | { type: 'speech'; key: TKey }
  | { type: 'beltReversed' }
  | { type: 'beltPinned' }
  | { type: 'rowsOpen' }
  | { type: 'rowsClose' }
  | { type: 'weakSpot'; x: number; y: number }
  | { type: 'end'; result: CombatResult };

export type CombatResult = 'win' | 'lose';
