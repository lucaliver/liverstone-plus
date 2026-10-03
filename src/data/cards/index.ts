import type { CardClass, CardDef, CardInst, Keyword, Rarity } from '../../game/types';
import { CONFIG } from '../config';
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
/** Rarities from the weakest to the strongest: how cards are sorted. */
export const RARITY_ORDER: Rarity[] = ['starter', 'common', 'rare', 'epic', 'legendary', 'special'];

export const CARD_LIST: readonly CardDef[] = all;

/** Cards that can appear as rewards for a class (cards from a pack stay out: no pack can be unlocked yet). */
export function rewardPool(cls: CardClass, rarity: Rarity): CardDef[] {
  return all.filter((c) => (c.cls === cls || c.cls === 'neutral') && c.rarity === rarity && !c.pack);
}

// Card rules shared by the engine and the UI, so what a card shows is what it does.

/** How a class's card damage looks and sounds when the card says nothing (`hit(v, { kind })`): the magic classes are arcane, the rest slash (attacks) or hit blunt. */
export const CLASS_HIT: Partial<Record<CardClass, string>> = { mage: 'arcane', necromancer: 'arcane' };

/** Keywords of a card copy: its definition (base or upgraded) plus its perks. */
export function cardKeywordsOf(card: CardInst): Keyword[] {
  const def = CARDS[card.id];
  const base = (card.up ? (def.upKeywords ?? def.keywords) : def.keywords) ?? [];
  const extra = (card.perks ?? []).flatMap((p) => PERKS[p]?.keywords ?? []);
  return extra.length ? [...new Set([...base, ...extra])] : base;
}

/** Mana cost of a card copy after its upgrade, perks, a fight's Inflation (`tax`), a `virus` and `costDrop` (`cut`) (-1 = X). */
export function cardCostOf(card: CardInst & { tax?: number; cut?: number; virus?: object }): number {
  const def = CARDS[card.id];
  const cost = card.up && def.upCost !== undefined ? def.upCost : def.cost;
  if (cost < 0) return cost;
  const base = Math.max(def.minCost ?? 0, cost + (card.perks ?? []).reduce((d, p) => d + (PERKS[p]?.costDelta ?? 0), 0));
  return Math.max(0, base + (card.tax ?? 0) * CONFIG.inflationCost + (card.virus ? CONFIG.virusCost : 0) - (card.cut ?? 0));
}

/** Values of a card copy (upgrade, per-fight bonus and time on the belt included). */
export function cardValsOf(card: CardInst & { bonus?: number; age?: number }): number[] {
  const def = CARDS[card.id];
  const vals = [...(card.up ? (def.upVals ?? def.vals) : def.vals)];
  const grows = def.bonusIdx ?? def.dmg?.[0];
  if (card.bonus && grows !== undefined) vals[grows] = Math.max(0, vals[grows] + card.bonus);
  if (def.ride && card.age) {
    const { i, by, to } = def.ride;
    const step = Math.floor(card.age) * vals[by];
    vals[i] = vals[to] > vals[i] ? Math.min(vals[to], vals[i] + step) : Math.max(vals[to], vals[i] - step);
  }
  return vals;
}
