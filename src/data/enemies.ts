import type { EnemyDef, MoveDef } from '../game/types';

const atk = (id: string, dmg: number, windup: number, extra: Partial<MoveDef> = {}): MoveDef => ({ id, intent: 'attack', dmg, windup, ...extra });
/** +1 Strength for the enemy: elites and some bosses get it with every attack (`ramp`), so a long fight costs more. */
const gainStrength = { id: 'strength', v: 1, target: 'enemy' } as const;
const ramp: Partial<MoveDef> = { status: [gainStrength] };

/**
 * Every enemy has one steady main attack and, every `every` main attacks, a special move
 * (slow heavy hits, curses, theft…). Specials rotate when there are several.
 * Moves are slow and heavy on purpose: each hit is an event to prepare for, with room to breathe in between.
 * Ids follow the English names (`enemy.<id>.name`); sprites come from `art`. Saves from before the rename are migrated
 * (`game/renamed.ts`).
 */
const defs: EnemyDef[] = [
  {
    // The very first fight of the very first run: an orientation video on a haunted TV. One belt row to start with;
    // at half HP it assigns you the second one, and the friendly face on the screen turns out to be a mask.
    id: 'hrOrientationVideo',
    act: 1,
    tier: 'normal',
    hp: 50,
    art: 'hrOrientationVideo',
    main: atk('safetyFirst', 6, 6),
    every: 2,
    specials: [{ id: 'coreValues', intent: 'defend', windup: 5, block: 3 }],
    startRows: 1,
    firstRunOnly: true,
    halfSpeech: true,
    halfArt: 'hrOrientationVideoAngry',
    halfSecret: true,
    onHalf: (c) => c.openBeltRows(),
  },
  // ------------------------------------------------------------- Act 1
  {
    id: 'snitch',
    act: 1,
    tier: 'normal',
    hp: 50,
    art: 'snitch',
    main: atk('tattle', 7, 5),
    every: 2,
    specials: [atk('ratOut', 14, 10, { intent: 'charge' })],
    // Tells the boss: from half HP on, your belt is rushed for the rest of the fight.
    halfSpeech: true,
    onHalf: (c) => c.applyStatus('hero', 'hurry', 1, 9999),
  },
  {
    id: 'seniorBoomer',
    act: 1,
    tier: 'normal',
    hp: 40,
    art: 'seniorBoomer',
    main: atk('boxCutter', 13, 11),
    every: 2,
    specials: [
      atk('seniority', 17, 13, { intent: 'charge' }),
      { id: 'gatekeep', intent: 'curse', windup: 4, curse: [{ id: 'gatekeeping', n: 2, to: 'belt' }], status: [gainStrength] },
    ],
    // Paper cuts: every card you let slip off the belt hurts, and at half HP it's worse.
    start: [{ id: 'paperCuts' }],
    onHalf: (c) => c.applyStatus('enemy', 'paperCuts', 2),
  },
  {
    id: 'toxicCoworker',
    act: 1,
    tier: 'normal',
    hp: 50,
    art: 'toxicCoworker',
    // Toxic: the snark doesn't hit, it poisons (and Block can't stop it).
    main: { id: 'snark', intent: 'debuff', windup: 6, status: [{ id: 'poison', v: 2, target: 'hero' }] },
    every: 2,
    specials: [
      { id: 'stirDrama', intent: 'curse', windup: 4, curse: [{ id: 'drama', n: 2, to: 'belt' }] },
      { id: 'spreadGossip', intent: 'curse', windup: 4, curse: [{ id: 'gossip', n: 2, to: 'draw' }] },
    ],
  },
  {
    id: 'teamLeader',
    act: 1,
    tier: 'normal',
    hp: 45,
    art: 'teamLeader',
    main: atk('buzzword', 4, 4),
    every: 2,
    specials: [
      {
        id: 'teamBuilding',
        intent: 'buff',
        windup: 6,
        status: [{ id: 'strength', v: 2, target: 'enemy' }],
        curse: [{ id: 'mandatoryFun', n: 2, to: 'draw' }],
      },
      { id: 'letsSync', intent: 'curse', windup: 6, curse: [{ id: 'quickSync', n: 2, to: 'belt' }] },
    ],
  },
  {
    id: 'goblinConsultant',
    act: 1,
    tier: 'normal',
    hp: 40,
    art: 'goblinConsultant',
    main: atk('invoice', 6, 6),
    every: 2,
    specials: [
      { id: 'outsource', intent: 'steal', windup: 4, steal: 1, status: [gainStrength] },
      { id: 'setDeadline', intent: 'curse', windup: 4, curse: [{ id: 'deadline', n: 1, to: 'belt' }] },
    ],
    start: [{ id: 'paradigmShift' }],
  },
  {
    id: 'hrBitch',
    act: 1,
    tier: 'normal',
    hp: 50,
    art: 'hrBitch',
    main: { id: 'performanceReview', intent: 'curse', windup: 6, curse: [{ id: 'tpsReport', n: 2, to: 'draw' }] },
    every: 2,
    specials: [
      atk('memo', 10, 6),
      { id: 'writeYouUp', intent: 'curse', windup: 4, curse: [{ id: 'writeUp', n: 2, to: 'draw' }], status: [gainStrength] },
    ],
    start: [{ id: 'noRepeatsPolicy' }],
  },
  {
    // One huge hit on a long fuse; every card played wakes him sooner.
    id: 'guyAsleep',
    act: 1,
    tier: 'normal',
    hp: 50,
    art: 'guyAsleep',
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
    every: 0,
    specials: [],
    startHex: { id: 'petrify', share: 0.5 },
  },
  {
    // Nepotism hire: a target shows on him now and then; tap it in time and your next attack is critical.
    id: 'bossSon',
    act: 1,
    tier: 'normal',
    hp: 45,
    art: 'bossSon',
    main: atk('tantrum', 6, 6),
    every: 2,
    specials: [atk('hideBehindDad', 8, 6, { intent: 'defend', block: 12 }), { id: 'ccDad', intent: 'buff', windup: 5, status: [gainStrength] }],
    start: [{ id: 'weakSpot' }],
  },
  {
    // Moves in with you: her boxes fill your sleeve from the start, and only get cheaper to unpack with time.
    id: 'workWife',
    act: 1,
    tier: 'normal',
    hp: 45,
    art: 'workWife',
    main: atk('lunchTogether', 5, 6),
    every: 2,
    specials: [
      { id: 'didYouHear', intent: 'curse', windup: 6, curse: [{ id: 'gossip', n: 2, to: 'draw' }], status: [gainStrength] },
      atk('passiveAggressiveNote', 12, 9, { intent: 'charge' }),
    ],
    fillSleeve: 'movingBox',
  },
  {
    id: 'securityMonitor',
    act: 1,
    tier: 'elite',
    hp: 100,
    block: 15,
    art: 'securityMonitor',
    main: atk('baton', 8, 8, ramp),
    every: 2,
    specials: [
      atk('patDown', 11, 7, { intent: 'defend', block: 14, windup: 6 }),
      { id: 'clearanceCheck', intent: 'curse', windup: 2, curse: [{ id: 'papersPlease', n: 2, to: 'draw' }] },
    ],
    onHalf: (c) => c.gainBlock('enemy', 30),
  },
  {
    // Leaving with a golden parachute: the first time he would fall, he retires instead and comes back for more.
    id: 'outgoingVp',
    act: 1,
    tier: 'elite',
    hp: 80,
    block: 15,
    art: 'outgoingVp',
    main: atk('reorg', 8, 8, ramp),
    every: 2,
    specials: [
      atk('goldenHandshake', 6, 6, { intent: 'steal', steal: 1 }),
      { id: 'stockBuyback', intent: 'buff', windup: 6, block: 10, status: [{ id: 'strength', v: 2, target: 'enemy' }] },
      { id: 'legacyProject', intent: 'curse', windup: 6, curse: [{ id: 'debt', n: 1, to: 'belt' }] },
    ],
    start: [{ id: 'goldenParachute' }],
  },
  {
    id: 'slavesCeo',
    act: 1,
    tier: 'boss',
    hp: 222,
    block: 25,
    art: 'slavesCeo',
    main: atk('stopwatch', 8, 6, ramp),
    every: 2,
    specials: [
      { id: 'writeUps', intent: 'curse', windup: 7, curse: [{ id: 'writeUp', n: 2, to: 'draw' }] },
      { id: 'deadlines', intent: 'curse', windup: 7, curse: [{ id: 'deadline', n: 2, to: 'belt' }] },
      { id: 'crunchTime', intent: 'debuff', windup: 5, status: [{ id: 'crunch', t: 10, target: 'hero' }] },
      atk('youreFired', 24, 12, { intent: 'charge' }),
    ],
    halfSpeech: true,
    // The emergency button: at half HP everything stops for a moment.
    onHalf: (c) => c.applyStatus('hero', 'stalled', 1, 8),
  },

  // ------------------------------------------------------------- Act 2
  {
    // Everything in its lane: you have to alternate the rows of the belt.
    id: 'meticulousColleague',
    act: 2,
    tier: 'normal',
    hp: 60,
    art: 'meticulousColleague',
    main: atk('nitpick', 6, 6),
    every: 2,
    specials: [
      { id: 'reprioritize', intent: 'curse', windup: 7, curse: [{ id: 'priorityTask', n: 1, to: 'belt' }], status: [gainStrength] },
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
        status: [gainStrength],
        curse: [
          { id: 'quickFavour', n: 1, to: 'draw' },
          { id: 'officePlant', n: 1, to: 'draw' },
          { id: 'pcLoadLetter', n: 1, to: 'draw' },
          { id: 'writeUp', n: 1, to: 'draw' },
        ],
      }),
    ],
  },
  {
    id: 'happinessOfficer',
    act: 2,
    tier: 'normal',
    hp: 60,
    art: 'happinessOfficer',
    main: atk('highFive', 10, 6),
    every: 2,
    specials: [
      { id: 'pizzaParty', intent: 'curse', windup: 7, curse: [{ id: 'freePizza', n: 4, to: 'draw' }] },
      { id: 'positiveVibes', intent: 'buff', windup: 5, status: [gainStrength, { id: 'regen', v: 5, target: 'enemy' }] },
    ],
  },
  {
    id: 'wellnessCoach',
    act: 2,
    tier: 'normal',
    hp: 50,
    art: 'wellnessCoach',
    main: atk('stretch', 6, 6),
    every: 2,
    specials: [
      { id: 'mindfulness', intent: 'heal', windup: 6, heal: 8, status: [gainStrength] },
      atk('burpees', 10, 2, { hits: 3, intent: 'charge' }),
    ],
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
      { id: 'costCutting', intent: 'drain', windup: 6, drainMana: 3, status: [gainStrength] },
    ],
    start: [{ id: 'spendingFreeze' }],
  },
  {
    // The Snitch's opposite number: from half HP on, everything slows to a crawl.
    id: 'complianceOfficer',
    act: 2,
    tier: 'normal',
    hp: 65,
    art: 'complianceOfficer',
    main: atk('citation', 7, 7),
    every: 2,
    specials: [
      { id: 'paperwork', intent: 'curse', windup: 7, curse: [{ id: 'papersPlease', n: 2, to: 'draw' }], status: [gainStrength] },
      atk('violation', 15, 10, { intent: 'charge' }),
    ],
    onHalf: (c) => c.applyStatus('hero', 'slowdown', 1, 20),
  },
  {
    // Bills by the second: every hit of your cards is docked, so only Poison and Burn go through whole. Shuts you up with a gag order.
    id: 'contractLawyer',
    act: 2,
    tier: 'normal',
    hp: 60,
    art: 'contractLawyer',
    main: atk('objection', 7, 6),
    every: 2,
    specials: [
      { id: 'ceaseAndDesist', intent: 'debuff', windup: 6, status: [gainStrength, { id: 'stun', t: 3, target: 'hero' }] },
      atk('classAction', 17, 10, { intent: 'charge' }),
    ],
    start: [{ id: 'finePrint', v: 2 }],
  },
  {
    id: 'nightJanitor',
    act: 2,
    tier: 'normal',
    hp: 60,
    art: 'nightJanitor',
    main: atk('wetMop', 2, 2),
    every: 8,
    specials: [
      { id: 'lightsOut', intent: 'debuff', windup: 6, status: [gainStrength, { id: 'blackout', t: 8, target: 'hero' }] },
      { id: 'fuseBox', intent: 'curse', windup: 6, curse: [{ id: 'pcLoadLetter', n: 1, to: 'belt' }], status: [gainStrength] },
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
      { id: 'tenPercentPerformance', intent: 'buff', windup: 4, status: [{ id: 'strength', v: 2, target: 'enemy' }] },
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
    specials: [{ id: 'synergies', intent: 'defend', windup: 6, block: 10, status: [gainStrength] }, atk('rightsizing', 15, 10, { intent: 'charge' })],
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
    // Last day on the job, nothing to lose: hands you a bomb nobody can afford to defuse. Keep it in your sleeve.
    id: 'leaver',
    act: 2,
    tier: 'normal',
    hp: 60,
    art: 'leaver',
    main: atk('clearTheDesk', 7, 6),
    every: 2,
    specials: [
      { id: 'nothingToLose', intent: 'curse', windup: 6, curse: [{ id: 'kamikaze', n: 1, to: 'belt' }], status: [gainStrength] },
      atk('exitInterview', 16, 10, { intent: 'charge' }),
    ],
  },
  {
    // Copies the damage it takes while scanning, then prints it back at you.
    id: 'printer',
    act: 2,
    tier: 'elite',
    hp: 100,
    block: 15,
    art: 'printer',
    main: { id: 'scan', intent: 'absorb', windup: 7, absorb: true },
    every: 1,
    specials: [atk('printOut', 10, 7, { intent: 'charge', release: true, ...ramp })],
  },
  {
    id: 'veteran',
    act: 2,
    tier: 'elite',
    hp: 130,
    block: 20,
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
    block: 30,
    art: 'micromanager',
    main: atk('anyUpdates', 8, 5),
    every: 2,
    specials: [
      { id: 'topPriority', intent: 'curse', windup: 6, curse: [{ id: 'priorityTask', n: 1, to: 'belt' }], status: [gainStrength] },
      { id: 'quickQuestion', intent: 'curse', windup: 6, curse: [{ id: 'quickFavour', n: 1, to: 'draw' }], status: [gainStrength] },
      { id: 'allHands', intent: 'curse', windup: 6, curse: [{ id: 'lockout', n: 1, to: 'belt' }], status: [gainStrength] },
      atk('annualReview', 22, 8, { intent: 'charge' }),
    ],
    start: [{ id: 'micromanagement' }],
  },
];

/** The handbook lists the enemies in this order: the very first run's enemies first, in the order it meets them. */
export const DIFFICULTY = [
  'hrOrientationVideo',
  'snitch',
  'newHire',
  'bossSon',
  'workWife',
  'teamLeader',
  'goblinConsultant',
  'seniorBoomer',
  'hrBitch',
  'guyAsleep',
  'toxicCoworker',
  'securityMonitor',
  'outgoingVp',
  'slavesCeo',
  'happinessOfficer',
  'dave',
  'officeChair',
  'overthinker',
  'changeManager',
  'leaver',
  'wellnessCoach',
  'contractLawyer',
  'meticulousColleague',
  'beanCounter',
  'complianceOfficer',
  'nightJanitor',
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
