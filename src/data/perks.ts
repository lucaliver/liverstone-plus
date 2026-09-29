import type { PerkDef } from '../game/types';

/** Perks a deck card can earn at a Promotion. */
const defs: PerkDef[] = [
  { id: 'fastTrack', icon: 'flag', keywords: ['innate'] },
  { id: 'budgetCut', icon: 'priceTag', costDelta: -1 },
];

export const PERKS: Record<string, PerkDef> = Object.fromEntries(defs.map((d) => [d.id, d]));
export const PERK_LIST: readonly PerkDef[] = defs;
