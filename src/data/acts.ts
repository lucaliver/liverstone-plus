import type { TrackId } from '../audio/music';

/** One act of the run (a shift of the workday). */
export interface ActDef {
  /** Workday hours shown on the map: its first floor starts at the first, its boss floor ends at the second. */
  shift: [number, number];
  /** Music of its normal fights. */
  music: TrackId;
  /** Music of its map. */
  mapMusic: TrackId;
  /** Its boss is shown on the map as the workday clock (the morning ends at noon) instead of an icon. */
  bossClock?: boolean;
}

export const ACT_DEFS: readonly ActDef[] = [
  { shift: [8, 12], music: 'combat', mapMusic: 'map', bossClock: true },
  { shift: [13, 17], music: 'combat2', mapMusic: 'map' },
];

/** The definition of an act (1-based; later acts fall back to the last one). */
export const actDef = (act: number): ActDef => ACT_DEFS[Math.min(act, ACT_DEFS.length) - 1];
