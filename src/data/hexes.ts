import type { HexDef } from '../game/types';

/** Curses enemies cast on single cards of the belt. */
const defs: HexDef[] = [{ id: 'petrify', icon: 'stone', taps: 5, thaw: 0.5 }];

export const HEXES: Record<string, HexDef> = Object.fromEntries(defs.map((d) => [d.id, d]));
