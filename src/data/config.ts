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
  /** A card expires once its left edge is this far past the belt's left edge (fraction of card width). */
  expireOverhang: 0.45,
  /** Belt speed multiplier while rushed (Time Slip, Time Warp). */
  beltRush: 1.8,
  /** Belt speed multipliers imposed by enemies: Hurry (faster) and Slowdown. */
  beltHurry: 1.5,
  beltSlow: 0.6,
  /** Global difficulty knobs applied to every enemy (the records hold the real numbers, so keep them at 1 unless testing). */
  enemyHp: 1,
  enemyDmg: 1,
  maxManaCap: 10,
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
} as const;

/** Where cards enter (0) and expire, in belt-distance units. */
export const EXPIRE_POS = 1 + CONFIG.cardWidth * CONFIG.expireOverhang;

export const GAME_SPEEDS = [1, 1.5, 2] as const;
