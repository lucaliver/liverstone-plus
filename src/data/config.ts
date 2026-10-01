import type { Rarity } from '../game/types';

/** Global tuning constants. Times are in seconds at 1× speed. */
export const CONFIG = {
  /** Seconds for a card to cross one full belt width. */
  beltTime: 7.7,
  /** Card width as a fraction of the belt width (the UI mirrors this). */
  cardWidth: 0.25,
  /** Minimum gap between spawns, in belt widths. */
  spacing: 0.27,
  /** Never spawn a card closer than this to the previous one of its row (more than a card width, so cards never overlap,
   * e.g. when curses queued on one row send every draw to the other). */
  minGap: 0.26,
  /** When the belt reverses, no card ends up past the new exit: the turn itself never throws a card off (only a card still sliding in is nudged). */
  reverseMaxPos: 1,
  /** The belt stands still this long before it turns around, so no card seems to jump (Paradigm Shift). */
  beltTurnPause: 0.5,
  /** Where a card that stops at the exit (`anchor`) stays: its leading edge at the belt's end. */
  anchorPos: 1,
  /** How far each attack card piled behind it sits from the one ahead (belt widths; less than a card, so the pile overlaps). */
  pileStep: 0.05,
  /** A card expires once its left edge is this far past the belt's left edge (fraction of card width). */
  expireOverhang: 0.45,
  /** Belt speed multiplier while rushed (Time Slip, Time Warp). */
  beltRush: 1.8,
  /** Belt speed multipliers imposed by enemies: Hurry (faster) and Slowdown. */
  beltHurry: 1.5,
  beltSlow: 0.6,
  /** Crunch (the CEO's Crunch Time): the belt runs at twice the speed. */
  beltCrunch: 2,
  /** Global difficulty knobs applied to every enemy (the records hold the real numbers, so keep them at 1 unless testing). */
  enemyHp: 1,
  enemyDmg: 1,
  maxManaCap: 10,
  /** Damage multiplier of a critical attack (Critical status). */
  critMult: 2,
  /** Seconds a virus card rides the belt before it infects the card behind it. */
  virusDelay: 4,
  startMana: 3,
  dotInterval: 1.5,
  multitaskingWindow: 2.5,
  multitaskingMax: 5,
  /** At the start of a fight the belt has already run until the first card is this far in (belt widths): a couple of cards. */
  prewarm: 0.25,
  /** Seconds of "Fight!" intro before the clock starts. */
  introTime: 1.2,
  /** Cap on cards per belt row. */
  maxHandBelt: 7,
  /** Belt rows: two is the standard layout (cards alternate between them). */
  beltRows: 2,
  /** With two rows each row runs at this fraction of the one-row speed. */
  twoRowSpeed: 0.8,
  /** Share of the belt's speed-up (Rush, Hurry, Slowdown) the music follows: 1 = the same change (a 1.8× rush, 1.8× music). */
  musicFollowsBelt: 1,
  /** Pay for a won fight (the run's score): a base by enemy tier, plus `perSecond` for every second under `par`. */
  pay: { normal: 10, elite: 25, boss: 50, par: 60, perSecond: 1 },
  /** Share of a fighter's current Block lost per decay step (at least 1), and the seconds between steps for an enemy (the hero's is on its `HeroDef`). */
  blockDecayShare: 0.1,
  enemyBlockDecay: 0.6,
  /** The Weak Spot target shows at least this far (share of the sprite) from every edge. */
  weakSpotMargin: 0.25,
  /** Each floor of an act makes normal enemies this much tougher (HP, damage). */
  floorHp: 0.06,
  floorDmg: 0.04,
  /** Chance that a floor of the map swaps its two rooms between the lanes. */
  laneSwap: 0.3,
  /** Break Room: a rest heals this share of max HP plus this share of the HP missing. Skipping a card reward: the max HP it pays. */
  restHeal: 0.25,
  restHealMissing: 0.25,
  skipMaxHp: 3,
  /** Each time a card reward is skipped for max HP, the next skip pays this much more. */
  skipMaxHpStep: 2,
  /** Copy Room: a card can't be shredded below this many deck cards; a photocopy costs this much HP (and needs more left). */
  shredMinDeck: 10,
  copyHpCost: 8,
  /** Tailor: the max HP the let-out uniform gives. */
  tailorMaxHp: 10,
  /** Lost & Found: how many relics lie in the box. */
  lostFoundChoices: 3,
  /** Cross-Training: how many cards of each of the other classes are on offer. */
  crossTrainPerClass: 2,
  /** Vending Machine: the HP a card of each rarity costs (the machine takes blood). */
  vendingHp: { rare: 6, epic: 12 },
} as const;

/** Rarity odds (weights) of each card offered after a fight or an elite (a boss pays like an elite). Legendary cards only drop from elites and bosses. */
export const REWARD_ODDS: Record<'fight' | 'elite', [Rarity, number][]> = {
  fight: [
    ['common', 64],
    ['rare', 29],
    ['epic', 7],
  ],
  elite: [
    ['common', 30],
    ['rare', 45],
    ['epic', 20],
    ['legendary', 5],
  ],
};

/** Rarity odds (weights) of the cards on offer in Cross-Training (like an elite's, without Legendary). */
export const CROSS_TRAINING_ODDS: [Rarity, number][] = [
  ['common', 30],
  ['rare', 50],
  ['epic', 20],
];

/** Where cards enter (0) and expire, in belt-distance units. */
export const EXPIRE_POS = 1 + CONFIG.cardWidth * CONFIG.expireOverhang;

export const GAME_SPEEDS = [1, 1.5, 2] as const;
