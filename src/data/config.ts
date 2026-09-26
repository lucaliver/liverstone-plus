/** Global tuning constants. Times are in seconds at 1× speed. */
export const CONFIG = {
  /** Seconds for a card to cross one full belt width. */
  beltTime: 8.5,
  /** Card width as a fraction of the belt width (the UI mirrors this). */
  cardWidth: 0.25,
  /** Minimum gap between spawns, in belt widths. */
  spacing: 0.285,
  /** Gap used by forced draws (cards overlap like a fan). */
  drawSpacing: 0.13,
  /** A card expires once its left edge is this far past the belt's left edge (fraction of card width). */
  expireOverhang: 0.45,
  sleeveSlots: 2,
  maxManaCap: 10,
  startMana: 3,
  dotInterval: 1.5,
  weaveWindow: 2.5,
  weaveMax: 5,
  /** Seconds of "Fight!" intro before the clock starts. */
  introTime: 1.2,
  maxHandBelt: 7,
} as const;

/** Where cards enter (0) and expire, in belt-distance units. */
export const EXPIRE_POS = 1 + CONFIG.cardWidth * CONFIG.expireOverhang;

export const GAME_SPEEDS = [1, 1.5, 2] as const;
