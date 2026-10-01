import type { TrackId } from '../audio/music';
import type { SoundId } from '../audio/sfx';

/** One act of the run (a shift of the workday). */
export interface ActDef {
  /** Workday hours shown on the map: its first floor starts at the first, its boss floor ends at the second. */
  shift: [number, number];
  /** Music of its normal fights. */
  music: TrackId;
  /** Music of its map. */
  mapMusic: TrackId;
  /** The sound of the door into its fights (the door itself is drawn in `combat-fx.css` by act). */
  door: SoundId;
  /** Its boss is shown on the map as the workday clock (the morning ends at noon) instead of an icon. */
  bossClock?: boolean;
  /** Icon of its boss on the map (the generic boss one when missing). */
  bossIcon?: string;
}

export const ACT_DEFS: readonly ActDef[] = [
  { shift: [8, 12], music: 'combat', mapMusic: 'map', door: 'door', bossClock: true },
  { shift: [13, 17], music: 'combat2', mapMusic: 'map', door: 'doorOffice', bossIcon: 'watchEye' },
  // The night shift runs past midnight to the dawn: the clock shows 22:00 to 06:00.
  { shift: [22, 30], music: 'combat3', mapMusic: 'map3', door: 'doorShutter', bossIcon: 'gavel' },
];

/** The definition of an act (1-based; later acts fall back to the last one). */
export const actDef = (act: number): ActDef => ACT_DEFS[Math.min(act, ACT_DEFS.length) - 1];
