import type { EnemyDef, MoveDef } from '../game/types';

const atk = (id: string, dmg: number, windup: number, extra: Partial<MoveDef> = {}): MoveDef => ({ id, intent: 'attack', dmg, windup, ...extra });
/** Elites and some bosses get stronger with every attack (+1 Strength), so a long fight costs more. */
const ramp: Partial<MoveDef> = { status: [{ id: 'strength', v: 1, target: 'enemy' }] };

/**
 * Every enemy has one steady main attack and, every `every` main attacks, a special move
 * (slow heavy hits, curses, theft…). Specials rotate when there are several.
 * Moves are slow and heavy on purpose: each hit is an event to prepare for, with room to breathe in between.
 * Ids predate the workplace theme (`rat` is The Snitch, `lich` the Slaves CEO…): they stay so saved runs remain valid;
 * names come from `enemy.<id>.name` and sprites from `art`.
 */
const defs: EnemyDef[] = [
  {
    // The very first fight of the very first run: an orientation video on a haunted TV. One belt row to start with;
    // at half HP it assigns you the second one, and the friendly face on the screen turns out to be a mask.
    id: 'hrVideo',
    act: 1,
    tier: 'normal',
    hp: 30,
    art: 'hrVideo',
    main: atk('safetyFirst', 3, 6),
    every: 2,
    specials: [{ id: 'coreValues', intent: 'defend', windup: 6, block: 3 }],
    startRows: 1,
    firstRunOnly: true,
    halfSpeech: true,
    halfArt: 'hrVideoAngry',
    halfSecret: true,
    onHalf: (c) => c.openBeltRows(),
  },
  // ------------------------------------------------------------- Act 1
  {
    id: 'rat',
    act: 1,
    tier: 'normal',
    hp: 40,
    art: 'snitch',
    main: atk('bite', 4, 6),
    every: 2,
    specials: [atk('frenzy', 4, 8, { hits: 4, intent: 'charge' })],
    // Tells the boss: from half HP on, your belt is rushed for the rest of the fight.
    halfSpeech: true,
    onHalf: (c) => c.applyStatus('hero', 'hurry', 1, 9999),
  },
  {
    id: 'skeleton',
    act: 1,
    tier: 'normal',
    hp: 40,
    art: 'boomer',
    main: atk('slash', 13, 11),
    every: 2,
    specials: [
      atk('boneCrush', 17, 13, { intent: 'charge' }),
      { id: 'gatekeep', intent: 'curse', windup: 4, curse: [{ id: 'gatekeeping', n: 2, to: 'belt' }] },
    ],
  },
  {
    id: 'slime',
    act: 1,
    tier: 'normal',
    hp: 50,
    art: 'coworker',
    // Toxic: the snark doesn't hit, it poisons (and Block can't stop it).
    main: { id: 'slam', intent: 'debuff', windup: 6, status: [{ id: 'poison', v: 2, target: 'hero' }] },
    every: 2,
    specials: [
      { id: 'spit', intent: 'curse', windup: 4, curse: [{ id: 'slime', n: 2, to: 'belt' }] },
      { id: 'toxicSpit', intent: 'curse', windup: 4, curse: [{ id: 'toxin', n: 2, to: 'draw' }] },
    ],
  },
  {
    id: 'cultist',
    act: 1,
    tier: 'normal',
    hp: 45,
    art: 'teamLeader',
    main: atk('darkBolt', 4, 4),
    every: 2,
    specials: [
      { id: 'ritual', intent: 'buff', windup: 6, status: [{ id: 'strength', v: 2, target: 'enemy' }], curse: [{ id: 'leech', n: 2, to: 'draw' }] },
      { id: 'syncUp', intent: 'curse', windup: 6, curse: [{ id: 'quickSync', n: 2, to: 'belt' }] },
    ],
  },
  {
    id: 'goblin',
    act: 1,
    tier: 'normal',
    hp: 40,
    art: 'consultant',
    main: atk('stab', 6, 6),
    every: 2,
    specials: [
      { id: 'snatch', intent: 'steal', windup: 6, dmg: 10, steal: 1 },
      { id: 'lightFuse', intent: 'curse', windup: 4, curse: [{ id: 'bomb', n: 1, to: 'belt' }] },
    ],
  },
  {
    id: 'hr',
    act: 1,
    tier: 'normal',
    hp: 50,
    art: 'hr',
    main: { id: 'review', intent: 'curse', windup: 8, curse: [{ id: 'pip', n: 2, to: 'draw' }] },
    every: 2,
    specials: [atk('memo', 8, 6), { id: 'writeYouUp', intent: 'curse', windup: 4, curse: [{ id: 'hex', n: 2, to: 'draw' }] }],
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
    main: atk('coffeeSpill', 6, 6),
    every: 2,
    specials: [{ id: 'blankStare', intent: 'debuff', windup: 6, hex: { id: 'petrify', share: 0.5 } }],
  },
  {
    id: 'boneKnight',
    act: 1,
    tier: 'elite',
    hp: 100,
    art: 'automaton',
    main: atk('cleave', 8, 8, ramp),
    every: 2,
    specials: [
      atk('rend', 11, 7, { intent: 'defend', block: 14, windup: 6 }),
      { id: 'clearance', intent: 'curse', windup: 2, curse: [{ id: 'redTape', n: 2, to: 'draw' }] },
    ],
    onHalf: (c) => c.applyStatus('enemy', 'strength', 3),
  },
  {
    id: 'lich',
    act: 1,
    tier: 'boss',
    hp: 180,
    art: 'ceo',
    main: atk('soulBolt', 7, 7, ramp),
    every: 2,
    specials: [
      { id: 'hexes', intent: 'curse', windup: 7, curse: [{ id: 'hex', n: 2, to: 'draw' }] },
      { id: 'bombs', intent: 'curse', windup: 7, curse: [{ id: 'bomb', n: 2, to: 'belt' }] },
      atk('doom', 20, 13, { intent: 'charge' }),
    ],
    halfSpeech: true,
    onHalf: (c) => c.applyStatus('enemy', 'haste', 1, 9999),
  },

  // ------------------------------------------------------------- Act 2
  {
    // Everything in its lane: you have to alternate the rows of the belt.
    id: 'meticulous',
    act: 2,
    tier: 'normal',
    hp: 60,
    art: 'mantis',
    main: atk('nitpick', 6, 6),
    every: 2,
    specials: [
      { id: 'reprioritize', intent: 'curse', windup: 7, curse: [{ id: 'priorityTask', n: 1, to: 'belt' }] },
      atk('redPen', 19, 9, { intent: 'charge' }),
    ],
    start: [{ id: 'meticulous' }],
  },
  {
    // Does nothing for a long while, then everything at once.
    id: 'dave',
    act: 2,
    tier: 'normal',
    hp: 65,
    art: 'dave',
    main: { id: 'scrolling', intent: 'idle', windup: 4 },
    every: 4,
    specials: [
      atk('lastMinute', 14, 2, {
        intent: 'charge',
        curse: [
          { id: 'quickFavour', n: 1, to: 'draw' },
          { id: 'officePlant', n: 1, to: 'draw' },
          { id: 'machineDown', n: 1, to: 'draw' },
          { id: 'hex', n: 1, to: 'draw' },
        ],
      }),
    ],
  },
  {
    id: 'happiness',
    act: 2,
    tier: 'normal',
    hp: 60,
    art: 'happiness',
    main: atk('highFive', 10, 6),
    every: 2,
    specials: [
      { id: 'pizzaParty', intent: 'curse', windup: 7, curse: [{ id: 'freePizza', n: 4, to: 'draw' }] },
      { id: 'teamLunch', intent: 'curse', windup: 5, curse: [{ id: 'freePizza', n: 3, to: 'belt' }] },
    ],
  },
  {
    id: 'wellness',
    act: 2,
    tier: 'normal',
    hp: 50,
    art: 'wellness',
    main: atk('stretch', 6, 6),
    every: 2,
    specials: [{ id: 'mindfulness', intent: 'heal', windup: 6, heal: 8 }, atk('burpees', 10, 2, { hits: 3, intent: 'charge' })],
    start: [{ id: 'chillOut' }],
  },
  {
    id: 'beanCounter',
    act: 2,
    tier: 'normal',
    hp: 65,
    art: 'beanCounter',
    main: atk('audit', 8, 8),
    every: 2,
    specials: [
      { id: 'expenseReport', intent: 'curse', windup: 6, curse: [{ id: 'officePlant', n: 2, to: 'draw' }] },
      { id: 'costCutting', intent: 'drain', windup: 6, drainMana: 3 },
    ],
    start: [{ id: 'budgetFreeze' }],
  },
  {
    // The Snitch's opposite number: from half HP on, everything slows to a crawl.
    id: 'compliance',
    act: 2,
    tier: 'normal',
    hp: 65,
    art: 'compliance',
    main: atk('citation', 7, 7),
    every: 2,
    specials: [
      { id: 'paperwork', intent: 'curse', windup: 7, curse: [{ id: 'redTape', n: 2, to: 'draw' }] },
      atk('violation', 15, 10, { intent: 'charge' }),
    ],
    onHalf: (c) => c.applyStatus('hero', 'slowdown', 1, 20),
  },
  {
    id: 'janitor',
    act: 2,
    tier: 'normal',
    hp: 60,
    art: 'janitor',
    main: atk('mop', 2, 2),
    every: 8,
    specials: [
      { id: 'lightsOut', intent: 'debuff', windup: 6, status: [{ id: 'blackout', t: 8, target: 'hero' }] },
      { id: 'fuseBox', intent: 'curse', windup: 6, curse: [{ id: 'machineDown', n: 1, to: 'belt' }] },
    ],
  },
  {
    // The office chair nobody claims: spins, sinks, and swears the RGB strip adds performance.
    id: 'officeChair',
    act: 2,
    tier: 'normal',
    hp: 60,
    art: 'officeChair',
    main: atk('swivel', 6, 6),
    every: 2,
    specials: [
      atk('spinToWin', 3, 9, { hits: 6, intent: 'charge' }),
      { id: 'slowSink', intent: 'debuff', windup: 4, status: [{ id: 'slowdown', t: 8, target: 'hero' }] },
      { id: 'gamerMode', intent: 'buff', windup: 4, status: [{ id: 'strength', v: 2, target: 'enemy' }] },
    ],
  },
  {
    // Streamlines your workflow: at half HP one belt row is let go, with the cards on it.
    id: 'changeManager',
    act: 2,
    tier: 'normal',
    hp: 60,
    art: 'changeManager',
    main: atk('bestPractice', 6, 6),
    every: 2,
    specials: [{ id: 'synergies', intent: 'defend', windup: 6, block: 10 }, atk('rightsizing', 15, 10, { intent: 'charge' })],
    halfSpeech: true,
    onHalf: (c) => c.closeBeltRows(1),
  },
  {
    // One big idea, slowly charged; hit it hard enough meanwhile and it loses its train of thought.
    id: 'overthinker',
    act: 2,
    tier: 'normal',
    hp: 70,
    art: 'overthinker',
    main: atk('bigIdea', 28, 14, { intent: 'charge' }),
    every: 0,
    specials: [],
    start: [{ id: 'trainOfThought', v: 24 }],
  },
  {
    // Copies the damage it takes while scanning, then prints it back at you.
    id: 'printer',
    act: 2,
    tier: 'elite',
    hp: 100,
    art: 'printer',
    main: { id: 'scan', intent: 'absorb', windup: 7, absorb: true },
    every: 1,
    specials: [atk('printOut', 10, 7, { intent: 'charge', release: true, ...ramp })],
  },
  {
    id: 'veteran',
    act: 2,
    tier: 'elite',
    hp: 110,
    art: 'veteran',
    main: atk('grumble', 9, 7, ramp),
    every: 2,
    specials: [
      { id: 'inMyDay', intent: 'debuff', windup: 7, inflate: 4 },
      atk('oldSchool', 18, 11, { intent: 'charge' }),
      { id: 'longStory', intent: 'debuff', windup: 6, status: [{ id: 'slowdown', t: 8, target: 'hero' }] },
    ],
  },
  {
    // Cuts in with "any updates?" whenever you stop playing for a moment.
    id: 'micromanager',
    act: 2,
    tier: 'boss',
    hp: 200,
    art: 'micromanager',
    main: atk('anyUpdates', 8, 5),
    every: 2,
    specials: [
      { id: 'topPriority', intent: 'curse', windup: 6, curse: [{ id: 'priorityTask', n: 1, to: 'belt' }] },
      { id: 'quickQuestion', intent: 'curse', windup: 6, curse: [{ id: 'quickFavour', n: 1, to: 'draw' }] },
      { id: 'allHands', intent: 'curse', windup: 6, curse: [{ id: 'lockout', n: 1, to: 'belt' }] },
      atk('performanceReview', 22, 8, { intent: 'charge' }),
    ],
    start: [{ id: 'micromanage' }],
  },
];

/** Easiest first: the very first run meets the normal enemies in this order, and the handbook lists them so. */
export const DIFFICULTY = [
  'hrVideo',
  'rat',
  'sleeper',
  'slime',
  'newHire',
  'cultist',
  'goblin',
  'skeleton',
  'hr',
  'boneKnight',
  'lich',
  'happiness',
  'dave',
  'officeChair',
  'overthinker',
  'changeManager',
  'wellness',
  'meticulous',
  'beanCounter',
  'compliance',
  'janitor',
  'printer',
  'veteran',
  'micromanager',
];

export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(defs.map((e) => [e.id, e]));
export const ENEMY_LIST: readonly EnemyDef[] = [...defs].sort((a, b) => DIFFICULTY.indexOf(a.id) - DIFFICULTY.indexOf(b.id));

/** Main attack followed by the specials, for lists such as the compendium. */
export const enemyMoves = (e: EnemyDef): MoveDef[] => [e.main, ...e.specials];

/** Enemies of an act and tier, easiest first. */
export const enemiesFor = (act: number, tier: EnemyDef['tier']): EnemyDef[] =>
  ENEMY_LIST.filter((e) => e.act === act && e.tier === tier && !e.firstRunOnly);

/** The enemy of the very first fight of the very first run, if any. */
export const firstRunEnemy = (): EnemyDef | undefined => ENEMY_LIST.find((e) => e.firstRunOnly);
