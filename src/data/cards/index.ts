import type { CardClass, CardDef, Rarity } from '../../game/types';
import { mageCards } from './mage';
import { necromancerCards } from './necromancer';
import { curseCards, neutralCards } from './neutral';
import { warriorCards } from './warrior';

const all = [...warriorCards, ...mageCards, ...necromancerCards, ...neutralCards, ...curseCards];

// Damage values are the ones shown with the damage glyph on the card face (`{dmg:N}`), unless a card
// overrides it. They get live previews (Strength, Weak, Vulnerable…) and card bonuses (Rampage).
for (const c of all) c.dmg ??= [...c.face.matchAll(/\{dmg:(\d)\}/g)].map((m) => Number(m[1]));

export const CARDS: Record<string, CardDef> = Object.fromEntries(all.map((c) => [c.id, c]));
export const CARD_LIST: readonly CardDef[] = all;

/** Cards that can appear as rewards for a class. */
export function rewardPool(cls: CardClass, rarity: Rarity): CardDef[] {
  return all.filter((c) => (c.cls === cls || c.cls === 'neutral') && c.rarity === rarity);
}
