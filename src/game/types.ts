import type { TKey } from '../core/i18n';
import type { Combat } from './combat';

export type HeroId = 'warrior' | 'mage' | 'necromancer';
export type CardClass = HeroId | 'neutral' | 'curse';
/** A card's type is the colour of its background: attack pink, defense blue, skill yellow, power grey, curse green. */
export type CardType = 'attack' | 'defense' | 'skill' | 'power' | 'curse';
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
  /** True once the card has ridden the whole belt this fight (a Pending card becomes playable), until it is played. */
  passed?: boolean;
  /** Infected (Sick Coworker): costs 1 more until played, and once `t` (seconds on the belt) reaches `CONFIG.virusDelay` it infects the next card behind it, once (`spread`). */
  virus?: { t: number; spread: boolean };
  /** Extra mana cost until the card is next played (Inflation). */
  tax?: number;
  /** Seconds spent on the belt since it was drawn (cards with `ride` change with it). */
  age?: number;
  /** Mana its cost has dropped by so far this fight (`costDrop`). */
  cut?: number;
}

/** A patch of rust on the belt: where (x, y: shares of the belt's width and height) and how much grime is left (1 = new). */
export interface RustSpot {
  id: number;
  x: number;
  y: number;
  grime: number;
}

export interface BeltCard {
  card: CombatCard;
  /** Distance travelled, in belt widths. 0 = just entering on the right. */
  pos: number;
  /** Belt row (0 = top); always 0 on a one-row belt. */
  row: number;
  /** Pinned where it is (Team Change): it doesn't move or leave until played or stashed; other cards ride past it. */
  pinned?: boolean;
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
  /** Unlock pack id; cards without a pack are always available. */
  pack?: string;
  /** Card widths it covers on the belt (default 1): wider cards ride over the ones ahead of them. */
  span?: number;
  /** A wide card that covers both belt rows ahead of it, not just its own. */
  tall?: boolean;
  /** While on the belt, every other card of its row is out of reach (Priority Task). */
  lockRow?: boolean;
  /**
   * The value at `vals[i]` changes by `vals[by]` for every second the card rides the belt, until it reaches `vals[to]`
   * (it grows when `to` is above the base, decays when below). Frozen while the card waits in the sleeve.
   */
  ride?: { i: number; by: number; to: number };
  /**
   * Dragging the card over the belt sweeps the other cards off it (they count as lost, as if they had fallen off the end):
   * each one adds `vals[by]` to its bonus (the damage it deals), up to `vals[max]`. The bonus is gone once the card is played or lost. While held it stays on the belt, and it is played the moment it is let go.
   */
  sweep?: { by: number; max: number };
  /** Damage this card gains for every second the hero's mana is full and overflowing, wherever the card is. */
  onOverflow?: number;
  /** The first time ever it rides onto the belt, the fight stops and a note (`card.<id>.tip`) says how to handle it. */
  tip?: true;
  /** Index of the value its cost drops by every second of the fight, wherever the card is (Dunder Mifflin Box). */
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

/** The ink a status or keyword is written in: poison and life green, fire and force red, control purple, the rest blue. */
/** The colour of what something does (`--tone-*` in tokens.css): a status, a keyword, an enemy move. */
export type Tone = 'green' | 'red' | 'purple' | 'blue' | 'teal' | 'amber' | 'mint';

export interface StatusDef {
  id: string;
  kind: StatusKind;
  good: boolean;
  icon: string;
  /** Ink of its chip, its name in texts and move chips, from what it does: poison green, force red, defence teal, speed and time amber, rules and control purple, mana and tech blue. */
  tone: Tone;
  /** How an enemy move's chip names it: `icon` = just the icon, `short` = the `status.<id>.short` string; by default the full name. */
  chip?: 'icon' | 'short';
  /** Timed statuses that also stack show their stacks instead of the seconds left. */
  showStacks?: boolean;
  /** Seconds its chip's bar empties over: the chip is drawn as a coloured bar that drains with the timer (for a counter that runs out, like chained spells). */
  span?: number;
  /** How far the status is from going off, 0 to 1: its chip is drawn as a bar that fills up to the trigger (the engine calls `Combat.cue` as it goes off). */
  progress?: (c: Combat, side: Side, s: StatusVal) => number;
  /** The sound that plays each time `Combat.cue` says the status went off. */
  cue?: import('../audio/sfx').SoundId;
  /** A permanent trait (enemy passives): shown without a number. */
  passive?: boolean;
  /** A trait the player isn't told about: no chip in the status row, no line in the pre-fight traits or the handbook (Update Needed: the window is the surprise). */
  hidden?: true;
  /** Icon when the status is on the hero, if it must read differently there (you stunned vs the enemy stunned). */
  selfIcon?: string;
  /** While active, its amount (`v`) counts as Strength: extra damage for attack cards (a timed one is a temporary boost). */
  strength?: true;
  /** While active on the enemy, its amount (`v`) is taken off every hit of the hero's cards (Fine Print); Poison, Burn and thorns slip through. */
  cutsHits?: true;
  /** While active on the enemy, no hit of the hero's cards deals more than its amount (`v`); Poison, Burn and thorns slip through (Rate Limit). */
  capsHits?: true;
  /** While active on the hero, multiplies its mana regeneration (a chill slows it, Brown Nosing speeds it up). */
  regenMul?: number;
  /** While active on the enemy, multiplies the speed of its clock (0 stops it). */
  timeMul?: number;
  /** While active on the hero, multiplies the belt's speed (0 stops it). */
  beltMul?: number;
  /** A `dot` status that heals its carrier every interval instead of hurting it (Regen). */
  heals?: true;
  /** While active, the carrier deals this much of its normal damage (Weak). */
  dealtMul?: number;
  /** While active, the carrier takes this much of the normal damage (Vulnerable). */
  takenMul?: number;
  /** While active, the carrier's Block doesn't decay (Fortified). */
  holdsBlock?: true;
  /** While active, the carrier takes no damage at all (Dodge). */
  immune?: true;
  /** While active on the enemy, an attack card the hero drags onto the stage (instead of tapping it) is critical (VIP Treatment). */
  critOnDrag?: true;
  /** While active on the hero, the hero can't act: no card played by hand, no ability (stashing is still allowed). Cards still play themselves under `autoplay` (Stun). */
  handsTied?: true;
  /** While active on the hero, no card rule (`canPlay`) applies (Root access). */
  ignoresRules?: true;
  /** While active on the hero, a card slipping off the belt plays itself for free if it can (Autopilot). */
  autoplay?: true;
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
  /** While active, the carrier's status with this id doesn't run out (Flow State keeps Multitasking up). */
  keeps?: string;
  /** The hero just put a status on the enemy (`id`, `v` = amount): reacts while this one is active (Cold Sweat). */
  onEnemyStatus?: (c: Combat, id: string, s: StatusVal) => void;
  /** The enemy carrying it just took a lethal hit: return true to survive it (the status removes itself if it was a one-off). */
  onDeath?: (c: Combat, side: Side, s: StatusVal) => boolean;
  /** A card of the hero's just left the belt unplayed. */
  onExpire?: (c: Combat, side: Side, s: StatusVal) => void;
  /** While active on the enemy, a rust spot lands on the belt every `every` seconds, and the belt's speed drops along an ease-in-out sine of their share of `max` (`max` spots stop it dead: little at first, most of it in the middle, then it creeps to a halt; from the `warn` share of `max` on, the mop shakes and blinks). The hero scrubs them off with the mop. */
  rust?: { every: number; max: number; warn: number };
  /**
   * While active on the enemy, an "UPDATE NEEDED" window covers the belt (no belt card can be played): the first one after `first` seconds, then one every `every` seconds
   * after each update. Postpone brings it back after a random `postpone` ([min, max]) seconds, times `postponeMul` once the hero has updated at least once; Update runs a fake progress bar (`install` seconds up to 90%, as many
   * more for the rest, easing out), and when it's done the enemy gets the `patch` status.
   */
  popup?: { first: number; every: number; postpone: [number, number]; postponeMul: number; install: number; patch: { id: string; v: number } };
  /** Runs every simulation step while the status is active. */
  tick?: (c: Combat, side: Side, s: StatusVal, dt: number) => void;
  /** The particles that burst when the status lands (`kind` is a palette of `ui/fx/fx.ts`). */
  burst?: { kind: string; n: number };
  /** A class its sprite wears while the enemy carries the status (the look is in `combat-stage.css`). */
  look?: string;
  /** On the enemy: how close the status is to going off, 0 to 1 (the belt reddens as it nears 1). */
  warning?: (c: Combat, s: StatusVal) => number;
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
  /** Virus: this many random cards (belt first, then the rest of the deck) are infected until next played. */
  infect?: number;
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
  /** Seconds into the fight when the part of the screen under the belt slides away (the sleeve and the ability go with it, the mana bar stays) and, `CONFIG.sinkTime` later, a third belt row opens in its place (`enemy.<id>.deep`, `enemy.<id>.speech`). */
  deepBelt?: number;
  /** A surprise (no pre-fight line): seconds into the fight when the belt shuts off for good; from then on the player turns it by hand with a crank knob (`Combat.crankBelt`). It says `enemy.<id>.speech`. */
  beltOff?: number;
  /** Only met as the very first fight of the very first run (never dealt at random). */
  firstRunOnly?: boolean;
  /** Bends the rules of the belt or of what you may play (not just numbers): every act 2 opens on one of these, so the act's fun shows at once. */
  ruleBreaker?: boolean;
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

/** One line of the handbook's run history. */
export interface RunLog {
  hero: HeroId;
  result: 'win' | 'lose' | 'abandon';
  act: number;
  floor: number;
  kills: number;
  cards: number;
  pay: number;
  /** When the run ended (ms since the epoch). */
  at: number;
}

/** How a hero is unlocked: finish a run (win or lose) with another hero, or reach the boss of an act. */
export type HeroUnlock = { finishRun: HeroId } | { reachBoss: number };

/**
 * A management memo: an optional handicap for a run, open to a hero that has won a full day. Several can be active at once;
 * multipliers combine by product (omitted = 1), `rewardCards` by sum.
 */
export interface ModifierDef {
  id: string;
  icon: string;
  /** The number the memo's text shows (`{n}`). */
  n: number;
  /** Enemy HP and damage. */
  enemyHp?: number;
  enemyDmg?: number;
  /** Belt speed. */
  beltMul?: number;
  /** The hero's max HP (rounded). */
  heroHp?: number;
  /** HP a Break Room rest heals. */
  restHeal?: number;
  /** Cards on offer after a fight (added to the usual count). */
  rewardCards?: number;
}

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
  /** Card ids of which one copy (the first in `startDeck`) starts upgraded: an attack and a defense. */
  startUpgraded: string[];
  /** The very first run's reward offers after its first fights, in order (picked to teach, not rolled). */
  firstRewards?: string[][];
  /** Sleeve slots. */
  sleeve: number;
  starterRelic?: string;
  /** The status that is this hero's passive: it leads the hero's status row (empty too) in place of a passive icon. */
  passiveStatus?: string;
  /** The ink the hero is printed in, as a CSS token (`var(--p)`): the hero select and the fight tint their accents with it. */
  ink: string;
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
  /** A card of the hero's just left the belt unplayed. */
  onCardExpired?: (c: Combat, card: CombatCard) => void;
}

export interface RelicDef {
  id: string;
  rarity: 'common' | 'rare' | 'epic' | 'boss' | 'starter' | 'special';
  cls?: HeroId;
  pack?: string;
  /** The number its text shows (`{n}`). */
  n: number;
  /** Static modifiers applied to combat setup. */
  mods?: Partial<{
    maxMana: number;
    sleeve: number;
    regen: number;
    maxHp: number;
    gold: number;
    /** Multiplies the belt's speed. */
    beltSpeed: number;
    /** The fight starts with the belt run until its first card is this far in (belt widths), if that is further than `CONFIG.prewarm`. */
    startBelt: number;
    /** Extra cards on offer after a fight. */
    rewardCards: number;
  }>;
  hooks?: RelicHooks;
  /** For a relic that triggers every so often: how full its bar is (0..1) in the fight. It gets a chip with a filling bar. */
  progress?: (c: Combat) => number;
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
  | { type: 'infected'; card: CombatCard }
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
  /** A relic did its thing (shows its name over the hero). */
  | { type: 'relic'; id: string }
  /** A status with a trigger just went off (its chip empties and it plays its `cue`). */
  | { type: 'cue'; side: Side; id: string }
  /** The hero is down: the fight waits to know whether they beg to stay. */
  | { type: 'beg' }
  | { type: 'begged' }
  | { type: 'enrage' }
  | { type: 'speech'; key: TKey }
  | { type: 'beltReversed' }
  | { type: 'beltPinned' }
  | { type: 'rowsOpen' }
  /** `deepBelt`: the lower part of the screen slides down, out of reach (the extra row opens `CONFIG.sinkTime` later: `rowAdded`). */
  | { type: 'lowerSink' }
  | { type: 'rowAdded' }
  /** `beltOff`: the belt is shut off; it only moves under the player's finger now. */
  | { type: 'beltDead' }
  | { type: 'rowsClose' }
  | { type: 'weakSpot'; x: number; y: number }
  | { type: 'rust' }
  /** The enemy's window over the belt: it `open`s, goes `install`ing, or `close`s (postponed, or the update is done). */
  | { type: 'popup'; phase: 'open' | 'install' | 'close' }
  | { type: 'end'; result: CombatResult };

export type CombatResult = 'win' | 'lose';
