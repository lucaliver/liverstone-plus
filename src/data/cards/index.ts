import type { CardClass, CardDef, Rarity } from '../../game/types';
import { mageCards } from './mage';
import { curseCards, neutralCards } from './neutral';
import { warriorCards } from './warrior';

const all = [...warriorCards, ...mageCards, ...neutralCards, ...curseCards];

export const CARDS: Record<string, CardDef> = Object.fromEntries(all.map((c) => [c.id, c]));
export const CARD_LIST: readonly CardDef[] = all;

/** Cards that can appear as rewards for a class. */
export function rewardPool(cls: CardClass, rarity: Rarity): CardDef[] {
  return all.filter((c) => (c.cls === cls || c.cls === 'neutral') && c.rarity === rarity);
}
