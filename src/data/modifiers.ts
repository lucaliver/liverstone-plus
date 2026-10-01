import type { ModifierDef } from '../game/types';

/** Management memos: optional handicaps for a run, open to a hero that has won a full day (`ModifierDef`). */
const defs: ModifierDef[] = [
  { id: 'quotas', icon: 'target', n: 25, enemyHp: 1.25 },
  { id: 'hostile', icon: 'siren', n: 25, enemyDmg: 1.25 },
  { id: 'speedUp', icon: 'stopwatch', n: 15, beltMul: 1.15 },
  { id: 'benefits', icon: 'healthPlan', n: 20, heroHp: 0.8 },
  { id: 'noBreaks', icon: 'coffee', n: 50, restHeal: 0.5 },
  { id: 'budget', icon: 'priceTag', n: 1, rewardCards: -1 },
];

export const MODIFIER_LIST = defs;
export const MODIFIERS: Record<string, ModifierDef> = Object.fromEntries(defs.map((d) => [d.id, d]));

/** What the active memos add up to (1 / 0 = no change). */
export interface Mods {
  enemyHp: number;
  enemyDmg: number;
  beltMul: number;
  heroHp: number;
  restHeal: number;
  rewardCards: number;
}

export function resolveMods(ids: readonly string[]): Mods {
  const m: Mods = { enemyHp: 1, enemyDmg: 1, beltMul: 1, heroHp: 1, restHeal: 1, rewardCards: 0 };
  for (const id of ids) {
    const d = MODIFIERS[id];
    if (!d) continue;
    m.enemyHp *= d.enemyHp ?? 1;
    m.enemyDmg *= d.enemyDmg ?? 1;
    m.beltMul *= d.beltMul ?? 1;
    m.heroHp *= d.heroHp ?? 1;
    m.restHeal *= d.restHeal ?? 1;
    m.rewardCards += d.rewardCards ?? 0;
  }
  return m;
}
