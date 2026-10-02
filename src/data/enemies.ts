import type { EnemyDef, MoveDef } from '../game/types';

const atk = (id: string, dmg: number, windup: number, extra: Partial<MoveDef> = {}): MoveDef => ({ id, intent: 'attack', dmg, windup, ...extra });
/** +1 Strength for the enemy: elites and some bosses get it with every attack (`ramp`), so a long fight costs more. */
const gainStrength = { id: 'strength', v: 1, target: 'enemy' } as const;
const ramp: Partial<MoveDef> = { status: [gainStrength] };

/** What the half-HP moves bring (their texts quote these, see `data/values.ts`). */
export const HALF = { paperCuts: 2, securityBlock: 30, slavesStall: 8, complianceSlow: 20 } as const;

/**
 * Every enemy has one steady main attack and, every `every` main attacks, a special move
 * (slow heavy hits, curses, theft…). Specials rotate when there are several.
 * Moves are slow and heavy on purpose: each hit is an event to prepare for, with room to breathe in between.
 * Ids follow the English names (`enemy.<id>.name`); sprites come from `art`.
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
    main: atk('safetyThird', 6, 6),
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
    main: atk('snitchesGetStitches', 7, 5),
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
    hp: 80,
    art: 'seniorBoomer',
    main: atk('boxCutter', 13, 11),
    every: 2,
    specials: [
      atk('seniority', 17, 13, { intent: 'charge' }),
      { id: 'gatekeep', intent: 'curse', windup: 4, curse: [{ id: 'gatekeeping', n: 2, to: 'belt' }], status: [gainStrength] },
    ],
    // Paper cuts: every card you let slip off the belt hurts, and at half HP it's worse.
    start: [{ id: 'paperCuts' }],
    onHalf: (c) => c.applyStatus('enemy', 'paperCuts', HALF.paperCuts),
  },
  {
    id: 'toxicCoworker',
    act: 1,
    tier: 'normal',
    hp: 70,
    art: 'toxicCoworker',
    // Toxic: the snark doesn't hit, it poisons (and Block can't stop it).
    main: { id: 'snark', intent: 'debuff', windup: 6, status: [{ id: 'poison', v: 2, target: 'hero' }] },
    every: 2,
    specials: [
      { id: 'stirDrama', intent: 'curse', windup: 5, curse: [{ id: 'drama', n: 2, to: 'belt' }] },
      { id: 'spreadGossip', intent: 'curse', windup: 5, curse: [{ id: 'gossip', n: 2, to: 'draw' }] },
    ],
  },
  {
    id: 'teamLeader',
    act: 1,
    tier: 'normal',
    hp: 60,
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
    hp: 80,
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
    hp: 70,
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
    hp: 70,
    art: 'guyAsleep',
    main: atk('theMatrix', 25, 30, { intent: 'charge' }),
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
    hp: 60,
    art: 'bossSon',
    main: atk('tantrum', 6, 6),
    every: 2,
    specials: [atk('nepoBaby', 8, 8, { intent: 'defend', block: 12 }), { id: 'ccDad', intent: 'buff', windup: 4, status: [gainStrength] }],
    start: [{ id: 'weakSpot' }],
  },
  {
    // Came in anyway: his sneezes put a virus on your cards, which then spreads along the belt on its own.
    id: 'sickCoworker',
    act: 1,
    tier: 'normal',
    hp: 60,
    art: 'sickCoworker',
    main: atk('cough', 3, 3),
    every: 4,
    specials: [
      { id: 'sneezeOnYou', intent: 'curse', windup: 5, infect: 2, status: [gainStrength] },
      atk('stillHereWithFever', 12, 9, { intent: 'charge' }),
    ],
  },
  {
    // Moves in with you: her boxes fill your sleeve from the start, and only get cheaper to unpack with time.
    id: 'workWife',
    act: 1,
    tier: 'normal',
    hp: 60,
    art: 'workWife',
    main: atk('lunchTogether', 5, 6),
    every: 2,
    specials: [
      { id: 'didYouHear', intent: 'curse', windup: 6, curse: [{ id: 'gossip', n: 2, to: 'draw' }], status: [gainStrength] },
      atk('passiveAggressiveNote', 12, 9, { intent: 'charge' }),
    ],
    fillSleeve: 'dunderMifflinBox',
  },
  {
    id: 'securityMonitor',
    act: 1,
    tier: 'elite',
    hp: 90,
    block: 15,
    art: 'securityMonitor',
    main: atk('baton', 8, 8, ramp),
    every: 2,
    specials: [
      atk('patDown', 11, 7, { intent: 'defend', block: 14, windup: 6 }),
      { id: 'needToKnow', intent: 'curse', windup: 2, curse: [{ id: 'papersPlease', n: 2, to: 'draw' }] },
    ],
    onHalf: (c) => c.gainBlock('enemy', HALF.securityBlock),
  },
  {
    // Leaving with a golden parachute: the first time he would fall, he retires instead and comes back for more.
    id: 'outgoingVp',
    act: 1,
    tier: 'elite',
    hp: 90,
    block: 15,
    art: 'outgoingVp',
    main: atk('reorg', 6, 8),
    every: 2,
    specials: [
      atk('goldenHandshake', 10, 8, { intent: 'steal', steal: 2 }),
      { id: 'stockBuyback', intent: 'buff', windup: 5, block: 10, status: [{ id: 'strength', v: 2, target: 'enemy' }] },
      { id: 'legacyProject', intent: 'curse', windup: 5, curse: [{ id: 'debt', n: 1, to: 'belt' }] },
    ],
    start: [{ id: 'goldenParachute' }],
  },
  {
    id: 'slavesCeo',
    act: 1,
    tier: 'boss',
    hp: 190,
    block: 25,
    art: 'slavesCeo',
    main: atk('taylorsStopwatch', 8, 6, ramp),
    every: 2,
    specials: [
      { id: 'writeUps', intent: 'curse', windup: 7, curse: [{ id: 'writeUp', n: 2, to: 'draw' }] },
      { id: 'deadlines', intent: 'curse', windup: 7, curse: [{ id: 'deadline', n: 2, to: 'belt' }] },
      { id: 'crunchTime', intent: 'debuff', windup: 5, status: [{ id: 'crunch', t: 10, target: 'hero' }] },
      atk('youreFired', 24, 12, { intent: 'charge' }),
    ],
    halfSpeech: true,
    // The emergency button: at half HP everything stops for a moment.
    onHalf: (c) => c.applyStatus('hero', 'stalled', 1, HALF.slavesStall),
  },

  // ------------------------------------------------------------- Act 2
  {
    // Never fixes anything: rust builds up on the belt until it crawls, and then stops. The mop beside him scrubs it off.
    id: 'facilitiesManager',
    act: 2,
    tier: 'normal',
    hp: 90,
    art: 'facilitiesManager',
    main: atk('clipboardSmack', 7, 6),
    every: 2,
    specials: [atk('wetFloor', 14, 9, { intent: 'charge' }), { id: 'submitATicket', intent: 'buff', windup: 5, status: [gainStrength] }],
    start: [{ id: 'deferredMaintenance' }],
    ruleBreaker: true,
  },
  {
    // Everything in its lane: you have to alternate the rows of the belt.
    id: 'meticulousColleague',
    act: 2,
    tier: 'normal',
    hp: 90,
    art: 'meticulousColleague',
    main: atk('nitpick', 6, 6),
    every: 2,
    specials: [
      { id: 'reprioritize', intent: 'curse', windup: 7, curse: [{ id: 'priorityTask', n: 1, to: 'belt' }], status: [gainStrength] },
      atk('redPen', 19, 9, { intent: 'charge' }),
    ],
    start: [{ id: 'meticulous' }],
    ruleBreaker: true,
  },
  {
    // Does nothing for a long while, then everything at once.
    id: 'dave',
    act: 2,
    tier: 'normal',
    hp: 90,
    art: 'dave',
    main: { id: 'scrolling', intent: 'idle', windup: 4 },
    every: 3,
    specials: [
      atk('lastMinute', 14, 3, {
        intent: 'charge',
        status: [gainStrength],
        curse: [
          { id: 'godfathersFavour', n: 1, to: 'draw' },
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
    hp: 90,
    art: 'happinessOfficer',
    main: atk('leftHanging', 12, 8),
    every: 2,
    specials: [
      { id: 'pizzaParty', intent: 'curse', windup: 5, curse: [{ id: 'freePizza', n: 4, to: 'draw' }] },
      { id: 'positiveVibes', intent: 'buff', windup: 5, status: [gainStrength, { id: 'regen', v: 5, target: 'enemy' }] },
    ],
  },
  {
    id: 'wellnessCoach',
    act: 2,
    tier: 'normal',
    hp: 70,
    art: 'wellnessCoach',
    main: atk('stretch', 6, 6),
    every: 2,
    specials: [
      { id: 'mindfulness', intent: 'heal', windup: 6, heal: 8, status: [gainStrength] },
      atk('burpees', 8, 8, { hits: 3, intent: 'charge' }),
    ],
    start: [{ id: 'chillOut' }],
  },
  {
    id: 'beanCounter',
    act: 2,
    tier: 'normal',
    hp: 90,
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
    hp: 90,
    art: 'complianceOfficer',
    main: atk('citation', 7, 7),
    every: 2,
    specials: [
      { id: 'paperwork', intent: 'curse', windup: 7, curse: [{ id: 'papersPlease', n: 2, to: 'draw' }], status: [gainStrength] },
      atk('violation', 15, 10, { intent: 'charge' }),
    ],
    onHalf: (c) => c.applyStatus('hero', 'slowdown', 1, HALF.complianceSlow),
  },
  {
    // Bills by the second: every hit of your cards is docked, so only Poison and Burn go through whole. Shuts you up with a gag order.
    id: 'contractLawyer',
    act: 2,
    tier: 'normal',
    hp: 90,
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
    hp: 90,
    art: 'nightJanitor',
    main: atk('wetMop', 3, 3),
    every: 6,
    specials: [
      { id: 'lightsOut', intent: 'debuff', windup: 5, status: [gainStrength, { id: 'blackout', t: 10, target: 'hero' }] },
      { id: 'fuseBox', intent: 'curse', windup: 6, curse: [{ id: 'pcLoadLetter', n: 1, to: 'belt' }], status: [gainStrength] },
    ],
  },
  {
    // The office chair nobody claims: spins, sinks, and swears the RGB strip adds performance.
    id: 'officeChair',
    act: 2,
    tier: 'normal',
    hp: 90,
    art: 'officeChair',
    main: atk('swivel', 6, 6),
    every: 2,
    specials: [
      atk('beybladeChair', 3, 9, { hits: 6, intent: 'charge' }),
      { id: 'slowSink', intent: 'debuff', windup: 4, status: [{ id: 'slowdown', t: 8, target: 'hero' }] },
      { id: 'postureCheck', intent: 'buff', windup: 4, status: [{ id: 'strength', v: 2, target: 'enemy' }] },
    ],
  },
  {
    // Walks in like it's a runway: the whole office stops. After a few seconds your sleeves and ability slip out of sight and a third belt row opens: more cards, nowhere to stash them.
    id: 'exaggeratedGirl',
    act: 2,
    tier: 'normal',
    hp: 90,
    art: 'exaggeratedGirl',
    main: atk('hairFlip', 6, 6),
    every: 2,
    specials: [
      { id: 'overreaction', intent: 'buff', windup: 5, status: [gainStrength] },
      { id: 'catwalk', intent: 'debuff', windup: 5, status: [{ id: 'slowdown', t: 14, target: 'hero' }] },
      atk('highHeels', 15, 10, { intent: 'charge' }),
    ],
    deepBelt: 5,
    ruleBreaker: true,
  },
  {
    // A wall socket with a temper: ten seconds in, the belt goes dead. Any card that gets moving does it by your hand.
    id: 'powerSocket',
    act: 2,
    tier: 'normal',
    hp: 85,
    art: 'powerSocket',
    main: atk('shortCircuit', 6, 6),
    every: 2,
    specials: [
      { id: 'surge', intent: 'buff', windup: 5, status: [gainStrength] },
      { id: 'brownout', intent: 'drain', windup: 5, drainMana: 2 },
      atk('overload', 14, 10, { intent: 'charge' }),
    ],
    beltOff: 10,
    ruleBreaker: true,
  },
  {
    // Streamlines your workflow: at half HP one belt row is let go, with the cards on it.
    id: 'changeManager',
    act: 2,
    tier: 'normal',
    hp: 90,
    art: 'changeManager',
    main: atk('bestPractice', 7, 7),
    every: 2,
    specials: [{ id: 'synergies', intent: 'defend', windup: 6, block: 10, status: [gainStrength] }, atk('rightsizing', 17, 10, { intent: 'charge' })],
    halfSpeech: true,
    onHalf: (c) => c.closeBeltRows(1),
  },
  {
    // One big idea, slowly charged; hit it hard enough meanwhile and it loses its train of thought.
    id: 'overthinker',
    act: 2,
    tier: 'normal',
    hp: 100,
    art: 'overthinker',
    main: atk('bigIdea', 28, 14, { intent: 'charge' }),
    every: 0,
    specials: [],
    start: [{ id: 'trainOfThought', v: 28 }],
  },
  {
    // Last day on the job, nothing to lose: hands you a bomb nobody can afford to defuse. Keep it in your sleeve.
    id: 'leaver',
    act: 2,
    tier: 'normal',
    hp: 90,
    art: 'leaver',
    main: atk('clearTheDesk', 7, 6),
    every: 2,
    specials: [
      { id: 'nothingToLose', intent: 'curse', windup: 7, curse: [{ id: 'kamikaze', n: 1, to: 'belt' }], status: [gainStrength] },
      atk('exitInterview', 16, 10, { intent: 'charge' }),
    ],
  },
  {
    // Copies the damage it takes while scanning, then prints it back at you.
    id: 'printer',
    act: 2,
    tier: 'elite',
    hp: 115,
    block: 15,
    art: 'printer',
    main: { id: 'scan', intent: 'absorb', windup: 8, absorb: true },
    every: 1,
    specials: [atk('printOut', 5, 8, { intent: 'charge', release: true, ...ramp })],
  },
  {
    // The IT guy: every so often an UPDATE NEEDED window covers your belt. Postponing it only buys a few seconds; sitting through the update costs a long one.
    id: 'theNerd',
    act: 2,
    tier: 'elite',
    hp: 115,
    block: 15,
    art: 'theNerd',
    main: atk('ctrlAltDel', 7, 7, ramp),
    every: 2,
    specials: [
      { id: 'phishingTest', intent: 'curse', windup: 5, curse: [{ id: 'phishing', n: 2, to: 'belt' }] },
      atk('formatC', 16, 11, { intent: 'charge' }),
    ],
    start: [{ id: 'updateNeeded' }],
  },
  {
    id: 'veteran',
    act: 2,
    tier: 'elite',
    hp: 115,
    block: 20,
    art: 'veteran',
    main: atk('grumble', 9, 7, ramp),
    every: 2,
    specials: [
      { id: 'backInMyDay', intent: 'debuff', windup: 7, inflate: 4 },
      atk('oldSchool', 18, 11, { intent: 'charge' }),
      { id: 'longStory', intent: 'debuff', windup: 6, status: [{ id: 'slowdown', t: 8, target: 'hero' }] },
    ],
  },
  {
    // Cuts in with "any updates?" whenever you stop playing for a moment. Nothing else to learn: one rule, two specials.
    id: 'micromanager',
    act: 2,
    tier: 'boss',
    hp: 220,
    block: 20,
    art: 'micromanager',
    main: atk('anyUpdates', 7, 5),
    every: 2,
    specials: [
      { id: 'quickQuestion', intent: 'curse', windup: 6, curse: [{ id: 'godfathersFavour', n: 1, to: 'draw' }], status: [gainStrength] },
      atk('annualReview', 20, 8, { intent: 'charge' }),
    ],
    start: [{ id: 'micromanagement' }],
  },

  // ------------------------------------------------------------- Act 3
  {
    // Nobody told him he could go home: every so often he nods off on his feet, and then he's easy prey.
    id: 'graveyardIntern',
    act: 3,
    tier: 'normal',
    hp: 110,
    art: 'graveyardIntern',
    main: atk('sleepTyping', 8, 6),
    every: 2,
    specials: [
      { id: 'energyDrink', intent: 'buff', windup: 5, status: [{ id: 'strength', v: 2, target: 'enemy' }] },
      atk('allNighter', 17, 10, { intent: 'charge' }),
    ],
    start: [{ id: 'microsleep' }],
  },
  {
    // Error 429: no hit of yours counts for more than a few points. Small hits, poison and burn get through.
    id: 'rateLimiter',
    act: 3,
    tier: 'normal',
    hp: 100,
    art: 'rateLimiter',
    main: atk('timeout', 7, 6),
    every: 2,
    specials: [
      { id: 'http429', intent: 'debuff', windup: 6, status: [gainStrength, { id: 'slowdown', t: 6, target: 'hero' }] },
      atk('banHammer', 16, 9, { intent: 'charge' }),
    ],
    start: [{ id: 'rateLimit', v: 4 }],
  },
  {
    // Keep it moving: only the card at the front of its row can be played.
    id: 'lineLead',
    act: 3,
    tier: 'normal',
    hp: 120,
    art: 'lineLead',
    main: atk('keepItMoving', 8, 6),
    every: 2,
    specials: [
      { id: 'pickUpThePace', intent: 'debuff', windup: 5, status: [gainStrength, { id: 'hurry', t: 8, target: 'hero' }] },
      atk('quotaCheck', 15, 9, { intent: 'charge' }),
    ],
    start: [{ id: 'assemblyLine' }],
  },
  {
    // A glass cannon: it hits fast and hard, and every attack burns it too.
    id: 'miningRig',
    act: 3,
    tier: 'normal',
    hp: 80,
    art: 'miningRig',
    main: atk('hashRate', 9, 4),
    every: 3,
    specials: [
      {
        id: 'overclock',
        intent: 'buff',
        windup: 4,
        status: [
          { id: 'strength', v: 2, target: 'enemy' },
          { id: 'haste', t: 6, target: 'enemy' },
        ],
      },
      atk('thermalThrottling', 14, 5, { intent: 'charge' }),
    ],
    start: [{ id: 'burn', v: 2 }],
  },
  {
    // Learns from every card you let slip.
    id: 'helpdeskChatbot',
    act: 3,
    tier: 'normal',
    hp: 110,
    art: 'helpdeskChatbot',
    main: atk('haveYouTriedRestarting', 6, 6),
    every: 2,
    specials: [
      {
        id: 'hallucinate',
        intent: 'curse',
        windup: 6,
        curse: [
          { id: 'pcLoadLetter', n: 1, to: 'draw' },
          { id: 'godfathersFavour', n: 1, to: 'draw' },
        ],
        status: [gainStrength],
      },
      atk('escalateToTierTwo', 14, 9, { intent: 'charge' }),
    ],
    start: [{ id: 'machineLearning' }],
  },
  {
    // Stronger every few seconds whatever you do: the longer the fight, the more overtime it demands.
    id: 'punchClock',
    act: 3,
    tier: 'normal',
    hp: 120,
    art: 'punchClock',
    main: atk('kaChunk', 7, 5),
    every: 2,
    specials: [
      { id: 'overtimeDemand', intent: 'debuff', windup: 5, status: [gainStrength, { id: 'crunch', t: 8, target: 'hero' }] },
      atk('lateFee', 14, 9, { intent: 'charge' }),
    ],
    start: [{ id: 'overtimeCreep' }],
  },
  {
    // Chirps at 3 a.m., and every chirp takes a mana.
    id: 'smokeDetector',
    act: 3,
    tier: 'normal',
    hp: 90,
    art: 'smokeDetector',
    main: atk('shriek', 6, 5),
    every: 2,
    specials: [
      { id: 'sprinklers', intent: 'debuff', windup: 6, status: [gainStrength, { id: 'chill', t: 8, target: 'hero' }] },
      atk('testButton', 12, 8, { intent: 'charge' }),
    ],
    start: [{ id: 'lowBattery' }],
  },
  {
    id: 'microwave',
    act: 3,
    tier: 'normal',
    hp: 120,
    art: 'microwave',
    main: atk('reheat', 8, 7),
    every: 3,
    specials: [
      atk('beepBeepBeep', 4, 9, { hits: 3 }),
      { id: 'leftoverFish', intent: 'debuff', windup: 6, status: [gainStrength, { id: 'poison', v: 4, target: 'hero' }] },
      atk('metalForkIncident', 22, 14, { intent: 'charge' }),
    ],
  },
  {
    // Nobody watered it since spring: every attack you land with a card stings back.
    id: 'witheredFicus',
    act: 3,
    tier: 'normal',
    hp: 120,
    art: 'witheredFicus',
    main: atk('droppedLeaf', 6, 6),
    every: 2,
    specials: [{ id: 'photosynthesis', intent: 'heal', windup: 6, heal: 10, status: [gainStrength] }, atk('overgrowth', 15, 9, { intent: 'charge' })],
    start: [{ id: 'thorns', v: 1 }],
  },
  {
    // Every call it patches through turns some of your cards to stone.
    id: 'switchboard',
    act: 3,
    tier: 'normal',
    hp: 110,
    art: 'switchboard',
    main: atk('pleaseHold', 7, 6),
    every: 2,
    specials: [
      { id: 'transferCall', intent: 'curse', windup: 6, hex: { id: 'petrify', share: 0.35 }, status: [gainStrength] },
      atk('pressZero', 15, 9, { intent: 'charge' }),
    ],
  },
  {
    // Your replacement, already on the floor: at half HP it recalibrates and works half as fast again.
    id: 'replacement',
    act: 3,
    tier: 'elite',
    hp: 140,
    block: 20,
    art: 'replacement',
    main: atk('weld', 8, 7, ramp),
    every: 2,
    specials: [
      atk('pickAndPlace', 4, 8, { hits: 3 }),
      { id: 'safetyInterlock', intent: 'curse', windup: 6, curse: [{ id: 'lockout', n: 1, to: 'belt' }] },
      atk('crush', 18, 11, { intent: 'charge' }),
    ],
    halfSpeech: true,
    onHalf: (c) => c.applyStatus('enemy', 'haste', 1, 9999),
  },
  {
    // Pressure builds up in its Block: chew through it before it bursts.
    id: 'oldBoiler',
    act: 3,
    tier: 'elite',
    hp: 140,
    block: 20,
    art: 'oldBoiler',
    main: atk('steamBlast', 9, 8, ramp),
    every: 2,
    specials: [
      { id: 'stokeTheFire', intent: 'buff', windup: 6, block: 15, status: [{ id: 'strength', v: 2, target: 'enemy' }] },
      atk('overpressure', 20, 12, { intent: 'charge' }),
    ],
    start: [{ id: 'pressure' }],
  },
  {
    // Three directors in one chassis: each third of its HP you take, one more loses patience.
    id: 'theBoard',
    act: 3,
    tier: 'boss',
    hp: 260,
    block: 40,
    art: 'theBoard',
    main: atk('gavel', 9, 6, ramp),
    every: 2,
    specials: [
      { id: 'motionToCut', intent: 'curse', windup: 6, curse: [{ id: 'debt', n: 1, to: 'belt' }], status: [gainStrength] },
      { id: 'hostileTakeover', intent: 'steal', windup: 5, steal: 2, status: [gainStrength] },
      { id: 'quarterlyTargets', intent: 'curse', windup: 7, curse: [{ id: 'deadline', n: 2, to: 'belt' }] },
      atk('liquidation', 26, 12, { intent: 'charge' }),
    ],
    start: [{ id: 'boardroom' }],
  },
];

/** The handbook lists the enemies in this order: the very first run's enemies first, in the order it meets them. */
export const DIFFICULTY = [
  'hrOrientationVideo',
  'snitch',
  'newHire',
  'bossSon',
  'sickCoworker',
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
  'exaggeratedGirl',
  'powerSocket',
  'overthinker',
  'changeManager',
  'leaver',
  'wellnessCoach',
  'contractLawyer',
  'meticulousColleague',
  'facilitiesManager',
  'beanCounter',
  'complianceOfficer',
  'nightJanitor',
  'printer',
  'theNerd',
  'veteran',
  'micromanager',
  'graveyardIntern',
  'rateLimiter',
  'lineLead',
  'miningRig',
  'helpdeskChatbot',
  'punchClock',
  'smokeDetector',
  'microwave',
  'witheredFicus',
  'switchboard',
  'replacement',
  'oldBoiler',
  'theBoard',
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
