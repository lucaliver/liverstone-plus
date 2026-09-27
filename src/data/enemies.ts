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
    hp: 30,
    art: 'snitch',
    main: atk('bite', 4, 6),
    every: 2,
    specials: [atk('frenzy', 2, 8, { hits: 3, intent: 'charge' })],
    // Tells the boss: from half HP on, your belt is rushed for the rest of the fight.
    onHalf: (c) => c.applyStatus('hero', 'hurry', 1, 9999),
  },
  {
    id: 'skeleton',
    act: 1,
    tier: 'normal',
    hp: 40,
    art: 'boomer',
    main: atk('slash', 5, 8),
    every: 2,
    specials: [
      atk('boneCrush', 13, 11, { intent: 'charge' }),
      { id: 'gatekeep', intent: 'curse', windup: 7, curse: { id: 'gatekeeping', n: 2, to: 'belt' } },
    ],
  },
  {
    id: 'slime',
    act: 1,
    tier: 'normal',
    hp: 50,
    art: 'coworker',
    main: atk('slam', 5, 8),
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
    hp: 45,
    art: 'teamLeader',
    main: atk('darkBolt', 4, 7),
    every: 2,
    specials: [
      { id: 'ritual', intent: 'buff', windup: 8, status: [{ id: 'strength', v: 3, target: 'enemy' }], curse: { id: 'leech', n: 1, to: 'draw' } },
      { id: 'syncUp', intent: 'curse', windup: 7, curse: { id: 'quickSync', n: 2, to: 'belt' } },
    ],
  },
  {
    id: 'goblin',
    act: 1,
    tier: 'normal',
    hp: 35,
    art: 'consultant',
    main: atk('stab', 4, 6),
    every: 2,
    specials: [
      { id: 'snatch', intent: 'steal', windup: 6, dmg: 3, steal: 1 },
      { id: 'lightFuse', intent: 'curse', windup: 6, curse: { id: 'bomb', n: 1, to: 'belt' } },
    ],
  },
  {
    id: 'hr',
    act: 1,
    tier: 'normal',
    hp: 45,
    art: 'hr',
    main: atk('memo', 4, 7),
    every: 2,
    specials: [
      { id: 'review', intent: 'curse', windup: 7, curse: { id: 'pip', n: 2, to: 'draw' } },
      { id: 'writeYouUp', intent: 'curse', windup: 7, curse: { id: 'hex', n: 1, to: 'draw' } },
    ],
    start: [{ id: 'policy' }],
  },
  {
    // One huge hit on a long fuse; every card played wakes him sooner.
    id: 'sleeper',
    act: 1,
    tier: 'normal',
    hp: 50,
    art: 'sleeper',
    main: atk('rudeAwakening', 25, 30, { intent: 'charge' }),
    every: 0,
    specials: [],
    start: [{ id: 'lightSleeper' }],
  },
  {
    id: 'newHire',
    act: 1,
    tier: 'normal',
    hp: 40,
    art: 'newHire',
    main: atk('coffeeSpill', 4, 6),
    every: 2,
    specials: [{ id: 'blankStare', intent: 'debuff', windup: 7, hex: { id: 'petrify', share: 0.5 } }],
  },
  {
    id: 'boneKnight',
    act: 1,
    tier: 'elite',
    hp: 100,
    art: 'automaton',
    main: atk('cleave', 8, 8),
    every: 2,
    specials: [
      atk('rend', 11, 11, { intent: 'charge', status: [{ id: 'vulnerable', t: 5, target: 'hero' }] }),
      { id: 'shieldWall', intent: 'defend', block: 14, windup: 6 },
      { id: 'clearance', intent: 'curse', windup: 6, curse: { id: 'redTape', n: 2, to: 'draw' } },
    ],
    onHalf: (c) => c.applyStatus('enemy', 'strength', 3),
  },
  {
    id: 'lich',
    act: 1,
    tier: 'boss',
    hp: 165,
    art: 'ceo',
    main: atk('soulBolt', 7, 7),
    every: 2,
    specials: [
      { id: 'hexes', intent: 'curse', windup: 7, curse: { id: 'hex', n: 2, to: 'draw' } },
      { id: 'bombs', intent: 'curse', windup: 7, curse: { id: 'bomb', n: 2, to: 'belt' } },
      atk('doom', 20, 13, { intent: 'charge' }),
    ],
    onHalf: (c) => c.applyStatus('enemy', 'haste', 1, 9999),
  },
];

export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(defs.map((e) => [e.id, e]));
export const ENEMY_LIST: readonly EnemyDef[] = defs;

/** Main attack followed by the specials, for lists such as the compendium. */
export const enemyMoves = (e: EnemyDef): MoveDef[] => [e.main, ...e.specials];

export const enemiesFor = (act: number, tier: EnemyDef['tier']): EnemyDef[] => defs.filter((e) => e.act === act && e.tier === tier);
