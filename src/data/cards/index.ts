import type { CardClass, CardDef, CardInst, Keyword, Rarity } from '../../game/types';
import { PERKS } from '../perks';
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

/** Cards that can appear as rewards for a class (cards from a pack stay out: no pack can be unlocked yet). */
export function rewardPool(cls: CardClass, rarity: Rarity): CardDef[] {
  return all.filter((c) => (c.cls === cls || c.cls === 'neutral') && c.rarity === rarity && !c.pack);
}

// Card rules shared by the engine and the UI, so what a card shows is what it does.

export type CardCategory = 'attack' | 'defense' | 'utility' | 'curse';

/** Colour family of the card art: attack (incl. burn/poison), defense (block/heal/dodge), utility, curse. Rules such as
 * the No Repeats Policy go by it, since it's what the player sees. */
export function cardCategory(id: string): CardCategory {
  const def = CARDS[id];
  if (def.cat) return def.cat;
  if (def.type === 'curse') return 'curse';
  const f = def.face;
  if (/\{(dmg|burn|poison)/.test(f) && !/^\{(block|heal|dodge)/.test(f)) return 'attack';
  if (/\{(block|heal|dodge|parry)/.test(f)) return 'defense';
  return 'utility';
}

/** Keywords of a card copy: its definition (base or upgraded) plus its perks. */
export function cardKeywordsOf(card: CardInst): Keyword[] {
  const def = CARDS[card.id];
  const base = (card.up ? (def.upKeywords ?? def.keywords) : def.keywords) ?? [];
  const extra = (card.perks ?? []).flatMap((p) => PERKS[p]?.keywords ?? []);
  return extra.length ? [...new Set([...base, ...extra])] : base;
}

/** Mana cost of a card copy after its upgrade, perks, a fight's Inflation (`tax`) and `costDrop` (`cut`) (-1 = X). */
export function cardCostOf(card: CardInst & { tax?: number; cut?: number }): number {
  const def = CARDS[card.id];
  const cost = card.up && def.upCost !== undefined ? def.upCost : def.cost;
  if (cost < 0) return cost;
  const base = Math.max(def.minCost ?? 0, cost + (card.perks ?? []).reduce((d, p) => d + (PERKS[p]?.costDelta ?? 0), 0));
  return Math.max(0, base + (card.tax ?? 0) - (card.cut ?? 0));
}

/** Values of a card copy (upgrade, per-fight bonus and time on the belt included). */
export function cardValsOf(card: CardInst & { bonus?: number; age?: number }): number[] {
  const def = CARDS[card.id];
  const vals = [...(card.up ? (def.upVals ?? def.vals) : def.vals)];
  if (card.bonus && def.dmg?.length) vals[def.dmg[0]] += card.bonus;
  if (def.ride && card.age) {
    const { i, by, to } = def.ride;
    const step = Math.floor(card.age) * vals[by];
    vals[i] = vals[to] > vals[i] ? Math.min(vals[to], vals[i] + step) : Math.max(vals[to], vals[i] - step);
  }
  return vals;
}
