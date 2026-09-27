import type { EnemyDef, MoveDef } from '../game/types';

const atk = (id: string, dmg: number, windup: number, extra: Partial<MoveDef> = {}): MoveDef => ({ id, intent: 'attack', dmg, windup, ...extra });

/**
 * Every enemy has one steady main attack and, every `every` main attacks, a special move
 * (slow heavy hits, curses, theft…). Specials rotate when there are several.
 * Moves are slow and heavy on purpose: each hit is an event to prepare for, with room to breathe in between.
 * Ids predate the workplace theme (`rat` is The Snitch, `lich` the Slaves CEO…): they stay so saved runs remain valid;
 * names come from `enemy.<id>.name` and sprites from `art`.
 */
const defs: EnemyDef[] = [
  // ------------------------------------------------------------- Act 1
  {
    id: 'rat',
    act: 1,
    tier: 'normal',
    hp: 26,
    art: 'snitch',
    main: atk('bite', 6, 6),
    every: 2,
    specials: [atk('frenzy', 4, 8, { hits: 3, intent: 'charge' })],
  },
  {
    id: 'skeleton',
    act: 1,
    tier: 'normal',
    hp: 36,
    art: 'boomer',
    main: atk('slash', 9, 8),
    every: 2,
    specials: [
      atk('boneCrush', 22, 11, { intent: 'charge' }),
      { id: 'gatekeep', intent: 'curse', windup: 7, curse: { id: 'gatekeeping', n: 2, to: 'belt' } },
    ],
  },
  {
    id: 'slime',
    act: 1,
    tier: 'normal',
    hp: 44,
    art: 'coworker',
    main: atk('slam', 9, 8),
    every: 2,
    specials: [
      { id: 'spit', intent: 'curse', windup: 7, curse: { id: 'slime', n: 2, to: 'belt' } },
      { id: 'toxicSpit', intent: 'curse', windup: 7, curse: { id: 'toxin', n: 2, to: 'draw' } },
    ],
  },
  {
    id: 'cultist',
    act: 1,
    tier: 'normal',
    hp: 40,
    art: 'teamLeader',
    main: atk('darkBolt', 7, 7),
    every: 2,
    specials: [
      { id: 'ritual', intent: 'buff', windup: 8, status: [{ id: 'strength', v: 3, target: 'enemy' }], curse: { id: 'leech', n: 1, to: 'draw' } },
    ],
  },
  {
    id: 'goblin',
    act: 1,
    tier: 'normal',
    hp: 30,
    art: 'consultant',
    main: atk('stab', 7, 6),
    every: 2,
    specials: [
      { id: 'snatch', intent: 'steal', windup: 6, dmg: 5, steal: 1 },
      { id: 'lightFuse', intent: 'curse', windup: 6, curse: { id: 'bomb', n: 1, to: 'belt' } },
    ],
  },
  {
    id: 'hr',
    act: 1,
    tier: 'normal',
    hp: 40,
    art: 'hr',
    main: atk('memo', 7, 7),
    every: 2,
    specials: [
      { id: 'review', intent: 'debuff', windup: 7, status: [{ id: 'weak', t: 5, target: 'hero' }] },
      { id: 'writeYouUp', intent: 'curse', windup: 7, curse: { id: 'hex', n: 1, to: 'draw' } },
    ],
    start: [{ id: 'policy' }],
  },
  {
    // One huge hit on a long fuse; every card played wakes him sooner.
    id: 'sleeper',
    act: 1,
    tier: 'normal',
    hp: 44,
    art: 'sleeper',
    main: atk('rudeAwakening', 42, 30, { intent: 'charge' }),
    every: 0,
    specials: [],
    start: [{ id: 'lightSleeper' }],
  },
  {
    id: 'newHire',
    act: 1,
    tier: 'normal',
    hp: 36,
    art: 'newHire',
    main: atk('coffeeSpill', 6, 6),
    every: 2,
    specials: [{ id: 'blankStare', intent: 'debuff', windup: 7, hex: { id: 'petrify', belt: 'all', draw: 3 } }],
  },
  {
    id: 'boneKnight',
    act: 1,
    tier: 'elite',
    hp: 88,
    art: 'automaton',
    main: atk('cleave', 13, 8),
    every: 2,
    specials: [
      atk('rend', 18, 11, { intent: 'charge', status: [{ id: 'vulnerable', t: 5, target: 'hero' }] }),
      { id: 'shieldWall', intent: 'defend', block: 24, windup: 6 },
    ],
    onHalf: (c) => c.applyStatus('enemy', 'strength', 3),
  },
  {
    id: 'lich',
    act: 1,
    tier: 'boss',
    hp: 145,
    art: 'ceo',
    main: atk('soulBolt', 11, 7),
    every: 2,
    specials: [
      { id: 'hexes', intent: 'curse', windup: 7, curse: { id: 'hex', n: 2, to: 'draw' } },
      { id: 'bombs', intent: 'curse', windup: 7, curse: { id: 'bomb', n: 2, to: 'belt' } },
      atk('doom', 34, 13, { intent: 'charge' }),
    ],
    onHalf: (c) => c.applyStatus('enemy', 'haste', 1, 9999),
  },
];

export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(defs.map((e) => [e.id, e]));
export const ENEMY_LIST: readonly EnemyDef[] = defs;

/** Main attack followed by the specials, for lists such as the compendium. */
export const enemyMoves = (e: EnemyDef): MoveDef[] => [e.main, ...e.specials];

export const enemiesFor = (act: number, tier: EnemyDef['tier']): EnemyDef[] => defs.filter((e) => e.act === act && e.tier === tier);
