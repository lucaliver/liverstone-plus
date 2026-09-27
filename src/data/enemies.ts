import type { EnemyDef, MoveDef } from '../game/types';

const atk = (id: string, dmg: number, windup: number, extra: Partial<MoveDef> = {}): MoveDef => ({ id, intent: 'attack', dmg, windup, ...extra });

/**
 * Every enemy has one frequent main attack and, every `every` main attacks, a special move
 * (slow heavy hits, curses, theft…). Specials rotate when there are several.
 */
const defs: EnemyDef[] = [
  // ------------------------------------------------------------- Act 1
  {
    id: 'rat',
    act: 1,
    tier: 'normal',
    hp: 26,
    art: 'rat',
    main: atk('bite', 3, 2.6),
    every: 3,
    specials: [atk('frenzy', 3, 5, { hits: 3, intent: 'charge' })],
  },
  {
    id: 'skeleton',
    act: 1,
    tier: 'normal',
    hp: 36,
    art: 'skeleton',
    main: atk('slash', 5, 4),
    every: 2,
    specials: [atk('boneCrush', 15, 8, { intent: 'charge' })],
  },
  {
    id: 'slime',
    act: 1,
    tier: 'normal',
    hp: 44,
    art: 'slime',
    main: atk('slam', 5, 4),
    every: 2,
    specials: [
      { id: 'spit', intent: 'curse', windup: 5, curse: { id: 'slime', n: 2, to: 'belt' } },
      { id: 'toxicSpit', intent: 'curse', windup: 5, curse: { id: 'toxin', n: 2, to: 'draw' } },
    ],
  },
  {
    id: 'cultist',
    act: 1,
    tier: 'normal',
    hp: 40,
    art: 'cultist',
    main: atk('darkBolt', 4, 3.5),
    every: 3,
    specials: [
      { id: 'ritual', intent: 'buff', windup: 6, status: [{ id: 'strength', v: 3, target: 'enemy' }], curse: { id: 'leech', n: 1, to: 'draw' } },
    ],
  },
  {
    id: 'goblin',
    act: 1,
    tier: 'normal',
    hp: 30,
    art: 'goblin',
    main: atk('stab', 4, 3),
    every: 2,
    specials: [
      { id: 'snatch', intent: 'steal', windup: 4, dmg: 3, steal: 1 },
      { id: 'lightFuse', intent: 'curse', windup: 4, curse: { id: 'bomb', n: 1, to: 'belt' } },
    ],
  },
  {
    id: 'boneKnight',
    act: 1,
    tier: 'elite',
    hp: 88,
    art: 'boneKnight',
    main: atk('cleave', 7, 4),
    every: 2,
    specials: [
      atk('rend', 12, 7, { intent: 'charge', status: [{ id: 'vulnerable', t: 5, target: 'hero' }] }),
      { id: 'shieldWall', intent: 'defend', block: 18, windup: 4 },
    ],
    onHalf: (c) => c.applyStatus('enemy', 'strength', 3),
  },
  {
    id: 'lich',
    act: 1,
    tier: 'boss',
    hp: 145,
    art: 'lich',
    main: atk('soulBolt', 6, 3.5),
    every: 2,
    specials: [
      { id: 'hexes', intent: 'curse', windup: 5, curse: { id: 'hex', n: 2, to: 'draw' } },
      { id: 'bombs', intent: 'curse', windup: 5, curse: { id: 'bomb', n: 2, to: 'belt' } },
      atk('doom', 26, 10, { intent: 'charge' }),
    ],
    onHalf: (c) => c.applyStatus('enemy', 'haste', 1, 9999),
  },
];

export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(defs.map((e) => [e.id, e]));
export const ENEMY_LIST: readonly EnemyDef[] = defs;

/** Main attack followed by the specials, for lists such as the compendium. */
export const enemyMoves = (e: EnemyDef): MoveDef[] => [e.main, ...e.specials];

export const enemiesFor = (act: number, tier: EnemyDef['tier']): EnemyDef[] => defs.filter((e) => e.act === act && e.tier === tier);
