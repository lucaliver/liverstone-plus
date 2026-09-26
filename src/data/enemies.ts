import type { EnemyDef, MoveDef } from '../game/types';

const atk = (id: string, dmg: number, windup: number, extra: Partial<MoveDef> = {}): MoveDef => ({ id, intent: 'attack', dmg, windup, ...extra });

const defs: EnemyDef[] = [
  // ------------------------------------------------------------- Act 1
  {
    id: 'rat', act: 1, tier: 'normal', hp: 26, art: 'rat',
    pattern: [atk('bite', 4, 2.0), atk('bite', 4, 2.0), atk('frenzy', 3, 2.6, { hits: 2 })],
  },
  {
    id: 'skeleton', act: 1, tier: 'normal', hp: 36, art: 'skeleton',
    pattern: [atk('slash', 7, 3.2), { id: 'guard', intent: 'defend', block: 9, windup: 1.8 }, atk('slash', 7, 3.2)],
  },
  {
    id: 'slime', act: 1, tier: 'normal', hp: 44, art: 'slime',
    pattern: [
      { id: 'spit', intent: 'curse', windup: 2.4, curse: { id: 'slime', n: 1, to: 'belt' } },
      atk('slam', 8, 3.6),
      atk('slam', 8, 3.6),
    ],
  },
  {
    id: 'cultist', act: 1, tier: 'normal', hp: 40, art: 'cultist',
    pattern: [
      { id: 'ritual', intent: 'buff', windup: 2.2, status: [{ id: 'strength', v: 2, target: 'enemy' }] },
      atk('darkBolt', 5, 2.8),
      atk('darkBolt', 5, 2.8),
    ],
  },
  {
    id: 'goblin', act: 1, tier: 'normal', hp: 30, art: 'goblin',
    pattern: [
      atk('stab', 5, 2.2),
      { id: 'snatch', intent: 'steal', windup: 2.4, dmg: 3, steal: 1 },
      atk('stab', 5, 2.2),
      { id: 'snatch', intent: 'steal', windup: 2.4, dmg: 3, steal: 1 },
      { id: 'flee', intent: 'flee', windup: 3.5 },
    ],
  },
  {
    id: 'boneKnight', act: 1, tier: 'elite', hp: 88, art: 'boneKnight',
    pattern: [
      atk('rend', 6, 3.0, { status: [{ id: 'vulnerable', t: 4, target: 'hero' }] }),
      atk('cleave', 14, 4.6),
      { id: 'shieldWall', intent: 'defend', block: 14, windup: 2.0 },
    ],
    onHalf: (c) => c.applyStatus('enemy', 'strength', 3),
  },
  {
    id: 'lich', act: 1, tier: 'boss', hp: 155, art: 'lich',
    pattern: [
      atk('soulBolt', 8, 3.0),
      { id: 'hexes', intent: 'curse', windup: 2.4, curse: { id: 'hex', n: 2, to: 'draw' } },
      { id: 'boneArmor', intent: 'defend', block: 14, windup: 2.0 },
      atk('soulBolt', 8, 3.0),
      atk('doom', 26, 7.0, { intent: 'charge' }),
    ],
    onHalf: (c) => c.applyStatus('enemy', 'haste', 1, 9999),
  },
];

export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(defs.map((e) => [e.id, e]));
export const ENEMY_LIST: readonly EnemyDef[] = defs;

export const enemiesFor = (act: number, tier: EnemyDef['tier']): EnemyDef[] => defs.filter((e) => e.act === act && e.tier === tier);
