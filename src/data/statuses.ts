import type { Combat } from '../game/combat';
import type { MoveDef, Side, StatusDef, StatusVal } from '../game/types';
import { type CardCategory, cardCategory } from './cards';
import { CONFIG } from './config';

/** How long every card played brings the Light Sleeper's hit closer (seconds). */
export const WAKE_PER_CARD = 1;
/** The No Repeats Policy only covers cards played this close together (s), so a one-type deck is slowed, never locked. */
export const POLICY_WINDOW = 3;
/** Meticulous: two cards from the same belt row can't be played this close together (s), so an empty row never locks you. */
export const LANE_WINDOW = 4;
/** Chill Out: seconds between two cards. */
export const CHILL_GAP = 2;
/** Micromanagement: seconds without playing a card before he cuts in. */
export const IDLE_LIMIT = 3;
/** Seconds since a card was last played or he last cut in. */
const idleFor = (c: Combat, s: StatusVal): number => c.time - Math.max(c.lastPlayedAt, s.e ?? 0);
/** Card colours, by index (a status's free number `e` remembers one). */
const CATEGORIES: CardCategory[] = ['attack', 'defense', 'utility', 'curse'];
/** Golden Parachute: the share of its max HP the enemy is back on its feet with, the Block it retires with and the Strength it gains. */
const PARACHUTE_HP = 0.4;
const PARACHUTE_BLOCK = 20;
const PARACHUTE_STRENGTH = 3;
/** What the Overthinker does once it has lost its train of thought. */
const WHERE_WAS_I: MoveDef = { id: 'thePreviousSlide', intent: 'idle', windup: 4 };
/** Weak Spot: how long its target stays up, and the random wait (s) between the end of one and the next. */
export const WEAK_SPOT_TIME = 2;
const WEAK_SPOT_GAP = [5, 9];
/** Deferred Maintenance: a rust spot lands on the belt this often (s); this many stop the belt, and the slowdown follows an ease-in-out sine of their share (the mop warns from `RUST_WARN` of them). */
const RUST_EVERY = 2;
const RUST_MAX = 20;
const RUST_WARN = 0.75;
/** Spending Freeze: the hero's max mana. */
export const SPENDING_FREEZE_CAP = 3;

/** Microsleep: awake this long (s), then asleep this long: its clock stops and it takes more damage. */
export const AWAKE = 7;
export const ASLEEP = 3;
/** Overtime Creep: +1 Strength this often (s). */
export const CREEP_EVERY = 10;
/** Low Battery: chirps this often (s). */
export const CHIRP_EVERY = 5;
/** Machine Learning: every this many cards slipping off the belt teach it +1 Strength. */
export const LEARN_EVERY = 3;
/** Pressure: gains this much Block every so many seconds; at the limit it bursts (the Block is gone, the hero takes the blast). */
export const PRESSURE_EVERY = 5;
export const PRESSURE_STEP = 6;
export const PRESSURE_LIMIT = 30;
const PRESSURE_BLAST = 12;
/** Paradigm Shift: the belt turns around each time the enemy loses another 1/this of its max HP. */
export const PARADIGM_TURNS = 4;
/** The Board: what the first director to leave brings (Block, Strength); the second one speeds the whole board up. */
const BOARD_BLOCK = 30;
const BOARD_STRENGTH = 2;

/** A status tick that runs `fn` once per whole second the status has been up (n = 1, 2, 3…). */
const everySecond =
  (fn: (c: Combat, side: Side, n: number, s: StatusVal) => void): NonNullable<StatusDef['tick']> =>
  (c, side, s, dt) => {
    const before = Math.floor((s.e ?? 0) + 1e-6);
    s.e = (s.e ?? 0) + dt;
    for (let n = before + 1; n <= Math.floor(s.e + 1e-6); n++) fn(c, side, n, s);
  };

/** Slacking statuses last only until the hero plays another card. */
const endOnPlay =
  (id: string): StatusDef['onCardPlayed'] =>
  (c, side) =>
    c.removeStatus(side, id);

const buildPressure = everySecond((c, side, n) => {
  if (n % PRESSURE_EVERY === 0) c.gainBlock(side, PRESSURE_STEP);
});

const defs: StatusDef[] = [
  { id: 'strength', tone: 'red', kind: 'stacks', good: true, chip: 'icon', icon: 'muscle', strength: true },
  // Workaholic: `v` Strength, for a while only.
  { id: 'workaholic', tone: 'red', kind: 'timed', good: true, icon: 'muscle', strength: true },
  { id: 'brownNosing', tone: 'blue', kind: 'timed', good: true, icon: 'crystalUp', regenMul: 2 },
  { id: 'spellPower', tone: 'blue', kind: 'stacks', good: true, icon: 'wand' },
  { id: 'thorns', tone: 'red', kind: 'stacks', good: true, icon: 'thorns' },
  { id: 'dodge', tone: 'teal', kind: 'timed', good: true, icon: 'dodge', immune: true },
  { id: 'juggernaut', tone: 'teal', kind: 'stacks', good: true, icon: 'helm' },
  { id: 'fortified', tone: 'teal', kind: 'timed', good: true, icon: 'fortress', holdsBlock: true },
  { id: 'regen', tone: 'green', kind: 'dot', good: true, chip: 'short', icon: 'leaf', heals: true },
  { id: 'overtime', tone: 'red', kind: 'timed', good: true, icon: 'overtime' },
  { id: 'parry', tone: 'red', kind: 'timed', good: true, icon: 'crossed' },
  { id: 'haste', tone: 'amber', kind: 'timed', good: true, icon: 'gauge', timeMul: 1.5, look: 'enraged' },
  { id: 'rush', tone: 'amber', kind: 'timed', good: true, icon: 'speedCards', beltMul: CONFIG.beltRush },
  // Work-Life Balance: every card played hits again (for v), until two cards of the same colour come one after the
  // other; `e` is the colour of the last one.
  {
    id: 'workLifeBalance',
    tone: 'red',
    kind: 'stacks',
    good: true,
    icon: 'seesaw',
    onCardPlayed: (c, side, def) => {
      const s = c.fighter(side).statuses.workLifeBalance;
      const cat = CATEGORIES.indexOf(cardCategory(def.id));
      if (s.e === cat) {
        c.removeStatus(side, 'workLifeBalance');
        return;
      }
      s.e = cat;
      c.hit(s.v);
    },
  },
  // Autopilot (Severance): cards slipping off the belt play themselves when they can.
  { id: 'autopilot', tone: 'blue', kind: 'timed', good: true, icon: 'autopilot', autoplay: true },
  // Root access (sudo): no rule can stop the hero's cards.
  { id: 'rootAccess', tone: 'blue', kind: 'timed', good: true, icon: 'terminal', ignoresRules: true },
  { id: 'multitasking', tone: 'purple', kind: 'timed', good: true, icon: 'bolt2', showStacks: true, span: CONFIG.multitaskingWindow },
  { id: 'plague', tone: 'green', kind: 'stacks', good: true, icon: 'wrench' },
  // Slacking off (v = amount per second), until the hero plays another card.
  {
    id: 'bareMinimum',
    tone: 'amber',
    kind: 'timed',
    good: true,
    icon: 'battery',
    tick: everySecond((c, side, n, s) => c.gainBlock(side, s.v + n - 1)),
    onCardPlayed: endOnPlay('bareMinimum'),
  },
  {
    id: 'outOfOffice',
    tone: 'green',
    kind: 'timed',
    good: true,
    icon: 'sun',
    tick: everySecond((c, side, _n, s) => void c.heal(side, s.v)),
    onCardPlayed: endOnPlay('outOfOffice'),
  },
  {
    id: 'grindset',
    tone: 'red',
    kind: 'timed',
    good: true,
    icon: 'rocket',
    tick: everySecond((c, side, _n, s) => void c.damage(side, side === 'hero' ? 'enemy' : 'hero', s.v, { kind: 'blunt' }, side)),
    onCardPlayed: endOnPlay('grindset'),
  },
  { id: 'virulence', tone: 'green', kind: 'stacks', good: true, icon: 'biohazard' },
  // Steel Toes: every attack played gives `v` Block.
  {
    id: 'steelToes',
    tone: 'teal',
    kind: 'stacks',
    good: true,
    icon: 'shield',
    onCardPlayed: (c, side, def) => {
      if (def.type === 'attack') c.gainBlock(side, c.stacks(side, 'steelToes'));
    },
  },
  // Burn: no clock and no decay; the enemy takes its stacks every time it attacks (Poison is the slow, fading one).
  {
    id: 'burn',
    tone: 'red',
    kind: 'stacks',
    good: false,
    icon: 'flame',
    burst: { kind: 'fire', n: 10 },
    onAttack: (c, side, s) => void c.damage(side === 'enemy' ? 'hero' : 'enemy', side, s.v, { raw: true, ignoreBlock: true, kind: 'burn' }, 'dot'),
  },
  { id: 'poison', tone: 'green', kind: 'dot', good: false, icon: 'drop' },
  { id: 'weak', tone: 'purple', kind: 'timed', good: false, icon: 'broken', dealtMul: 0.75 },
  { id: 'vulnerable', tone: 'red', kind: 'timed', good: false, icon: 'crack', takenMul: 1.5 },
  {
    id: 'chill',
    tone: 'blue',
    kind: 'timed',
    good: false,
    icon: 'snow',
    regenMul: 0.5,
    timeMul: 0.5,
    burst: { kind: 'ice', n: 14 },
    look: 'chilled',
  },
  // A stunned enemy's timer stops (see enemyTimeRate); a stunned hero can't play cards.
  {
    id: 'stun',
    tone: 'purple',
    kind: 'timed',
    good: false,
    icon: 'stars',
    look: 'stunned',
    selfIcon: 'ko',
    timeMul: 0,
    canPlay: (_c, side) => (side === 'hero' ? 'combat.stunned' : null),
  },
  { id: 'hurry', tone: 'purple', kind: 'timed', good: false, icon: 'stopwatch', beltMul: CONFIG.beltHurry },
  // Emergency button: the belt stops dead.
  { id: 'stalled', tone: 'purple', kind: 'timed', good: false, icon: 'pause', beltMul: 0 },
  { id: 'crunch', tone: 'purple', kind: 'timed', good: false, icon: 'siren', beltMul: CONFIG.beltCrunch },
  // Every card turns black: only the art and the cost are left to go by.
  { id: 'blackout', tone: 'purple', kind: 'timed', good: false, icon: 'bulbOff' },
  { id: 'slowdown', tone: 'purple', kind: 'timed', good: false, icon: 'cone', beltMul: CONFIG.beltSlow },
  // Enemy passives (permanent traits).
  {
    id: 'noRepeatsPolicy',
    tone: 'purple',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'rulebook',
    // Same colour as the card before (attack, defense, utility, curse): the card's art tells.
    canPlay: (c, side, def) =>
      side === 'enemy' && c.lastPlayed && cardCategory(c.lastPlayed.id) === cardCategory(def.id) && c.time - c.lastPlayedAt < POLICY_WINDOW
        ? 'combat.policy'
        : null,
  },
  {
    id: 'meticulous',
    tone: 'purple',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'ruler',
    // Belt cards only (the sleeve is off the belt), and curses can always be paid off.
    canPlay: (c, side, def, uid) => {
      if (side !== 'enemy' || def.type === 'curse' || c.time - c.lastPlayedAt >= LANE_WINDOW) return null;
      const row = c.rowOf(uid);
      return row >= 0 && row === c.lastRow ? 'combat.meticulous' : null;
    },
  },
  {
    id: 'chillOut',
    tone: 'purple',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'lotus',
    canPlay: (c, side) => (side === 'enemy' && c.time - c.lastPlayedAt < CHILL_GAP ? 'combat.chillOut' : null),
  },
  { id: 'spendingFreeze', tone: 'blue', kind: 'stacks', good: true, passive: true, icon: 'calculator', manaCap: SPENDING_FREEZE_CAP },
  // Train of thought: take `v` damage while it charges a move and it forgets what it was doing (the move is lost).
  {
    id: 'trainOfThought',
    tone: 'purple',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'thoughtBubble',
    onHurt: (c, side, s, lost) => {
      const e = c.enemy;
      if (side !== 'enemy' || e.move === WHERE_WAS_I) return;
      // Damage counts per move: `mem.focusMove` is the move it started taking damage on.
      if (e.mem.focusMove !== e.moveCount) {
        e.mem.focusMove = e.moveCount;
        e.mem.focusDmg = 0;
      }
      e.mem.focusDmg += lost;
      if (e.mem.focusDmg >= s.v) c.distractEnemy(WHERE_WAS_I);
    },
  },
  {
    id: 'micromanagement',
    tone: 'red',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'watchEye',
    // `e` holds when he last cut in, so one quiet spell costs one hit.
    tick: (c, side, s) => {
      if (side !== 'enemy' || idleFor(c, s) < IDLE_LIMIT) return;
      s.e = c.time;
      c.enemyStrike();
    },
    warning: (c, s) => idleFor(c, s) / IDLE_LIMIT,
  },
  // Rusty belt: on the hero, one per rust spot on the belt (`Combat.syncRustStatus` keeps the count).
  { id: 'rustedBelt', tone: 'amber', kind: 'stacks', good: false, icon: 'rust' },
  // Deferred maintenance: rust builds up on the belt, slowing it down; the hero scrubs it off with the mop.
  {
    id: 'deferredMaintenance',
    tone: 'amber',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'rust',
    rust: { every: RUST_EVERY, max: RUST_MAX, warn: RUST_WARN },
  },
  // Weak spot: now and then a target shows on his sprite; `e` counts down to the next one.
  {
    id: 'weakSpot',
    tone: 'red',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'target',
    tick: (c, _side, s, dt) => {
      if (c.weakSpot) return;
      s.e ??= WEAK_SPOT_GAP[0] + c.rng.next() * (WEAK_SPOT_GAP[1] - WEAK_SPOT_GAP[0]);
      s.e -= dt;
      if (s.e > 0) return;
      delete s.e;
      c.openWeakSpot(WEAK_SPOT_TIME);
    },
  },
  // Critical: the hero's next attack card deals double damage (consumed in `Combat.resolvePlay`).
  { id: 'crit', tone: 'red', kind: 'stacks', good: true, icon: 'target' },
  // Paper cuts: every card slipping off the belt cuts the hero for `v`.
  {
    id: 'paperCuts',
    tone: 'red',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'paperCut',
    onExpire: (c, side, s) => {
      if (side === 'enemy') c.damage('enemy', 'hero', s.v, { raw: true, kind: 'slash' }, 'dot');
    },
  },
  // Paradigm shift: every quarter of its HP lost turns the belt around (`mem.turns` counts the turns made).
  {
    id: 'paradigmShift',
    tone: 'purple',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'uTurn',
    onHurt: (c, side) => {
      const e = c.enemy;
      if (side !== 'enemy' || e.hp <= 0) return;
      const quarters = Math.floor((PARADIGM_TURNS * (e.maxHp - e.hp)) / e.maxHp);
      if (quarters > (e.mem.turns ?? 0)) c.say('status.paradigmShift.speech');
      for (let n = e.mem.turns ?? 0; n < quarters; n++) c.reverseBelt();
      e.mem.turns = Math.max(e.mem.turns ?? 0, quarters);
    },
  },
  // Fine print: every hit of your cards deals `v` less damage (Poison, Burn and thorns don't count as hits).
  { id: 'finePrint', tone: 'teal', kind: 'stacks', good: true, passive: true, icon: 'magnifier', cutsHits: true },
  // Golden parachute: the first time it would fall, it takes the severance package instead and gets back up.
  {
    id: 'goldenParachute',
    tone: 'amber',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'parachute',
    onDeath: (c, side) => {
      c.removeStatus(side, 'goldenParachute');
      c.heal(side, Math.round(c.enemy.maxHp * PARACHUTE_HP));
      c.gainBlock(side, PARACHUTE_BLOCK);
      c.applyStatus(side, 'strength', PARACHUTE_STRENGTH);
      c.say('status.goldenParachute.speech');
      return true;
    },
  },
  // Microsleep: `e` is the clock of its day; at the end of the awake spell it dozes off (stunned, so its attack waits, and vulnerable).
  {
    id: 'microsleep',
    tone: 'purple',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'sleepMask',
    tick: (c, side, s, dt) => {
      const before = s.e ?? 0;
      s.e = before + dt;
      if (before < AWAKE && s.e >= AWAKE) {
        c.applyStatus(side, 'stun', 1, ASLEEP);
        c.applyStatus(side, 'vulnerable', 1, ASLEEP);
        c.say('status.microsleep.speech');
      }
      if (s.e >= AWAKE + ASLEEP) s.e -= AWAKE + ASLEEP;
    },
  },
  // Rate limit: `v` is the most one hit of your cards can deal.
  { id: 'rateLimit', tone: 'teal', kind: 'stacks', good: true, passive: true, icon: 'funnel', capsHits: true },
  // Assembly line: only the card at the front of its belt row can be played (curses can always be paid off).
  {
    id: 'assemblyLine',
    tone: 'purple',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'conveyorLine',
    canPlay: (c, side, def, uid) => {
      const me = c.belt.find((b) => b.card.uid === uid);
      if (side !== 'enemy' || def.type === 'curse' || !me || me.pinned) return null;
      return c.belt.some((b) => b.row === me.row && !b.pinned && b.pos > me.pos) ? 'combat.assemblyLine' : null;
    },
  },
  // Overtime creep: a little stronger every so often, whatever you do.
  {
    id: 'overtimeCreep',
    tone: 'red',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'creepClock',
    tick: everySecond((c, side, n) => {
      if (n % CREEP_EVERY === 0) c.applyStatus(side, 'strength', 1);
    }),
  },
  // Low battery: it chirps now and then, and every chirp costs the hero `v` mana.
  {
    id: 'lowBattery',
    tone: 'blue',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'lowBattery',
    tick: everySecond((c, _side, n, s) => {
      if (n % CHIRP_EVERY === 0 && c.hero.mana > 0) c.drainMana(s.v);
    }),
  },
  // Machine learning: `e` counts the cards you let slip.
  {
    id: 'machineLearning',
    tone: 'blue',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'brainChip',
    onExpire: (c, side, s) => {
      if (side !== 'enemy') return;
      s.e = (s.e ?? 0) + 1;
      if (s.e < LEARN_EVERY) return;
      s.e = 0;
      c.applyStatus(side, 'strength', 1);
    },
  },
  // Pressure: Block builds up on its own; let it reach the limit and it bursts. `e` is the clock of the build-up.
  {
    id: 'pressure',
    tone: 'teal',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'steamGauge',
    tick: (c, side, s, dt) => {
      buildPressure(c, side, s, dt);
      const f = c.fighter(side);
      if (f.block < PRESSURE_LIMIT) return;
      f.block = 0;
      c.say('status.pressure.speech');
      c.damage(side, 'hero', Math.round(PRESSURE_BLAST * c.enemy.dmgScale), { raw: true, kind: 'claw' }, 'enemy');
    },
  },
  // The Board: every third of its HP you take, one more director loses patience (`mem.thirds` counts them).
  {
    id: 'boardroom',
    tone: 'purple',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'gavel',
    onHurt: (c, side) => {
      const e = c.enemy;
      if (side !== 'enemy' || e.hp <= 0) return;
      const thirds = Math.min(2, Math.floor((3 * (e.maxHp - e.hp)) / e.maxHp));
      for (let n = e.mem.thirds ?? 0; n < thirds; n++) {
        c.say(`status.boardroom.speech${n + 1}`);
        if (n === 0) {
          c.gainBlock(side, BOARD_BLOCK);
          c.applyStatus(side, 'strength', BOARD_STRENGTH);
        } else c.applyStatus(side, 'haste', 1, 9999);
      }
      e.mem.thirds = Math.max(e.mem.thirds ?? 0, thirds);
    },
  },
  {
    id: 'lightSleeper',
    tone: 'purple',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'zzz',
    onCardPlayed: (c, side) => {
      if (side === 'enemy') c.hurryEnemy(WAKE_PER_CARD);
    },
  },
];

export const STATUSES: Record<string, StatusDef> = Object.fromEntries(defs.map((d) => [d.id, d]));
export const STATUS_ORDER = defs.map((d) => d.id);

/** A status's icon on a side: some read differently on the hero (you stunned vs the enemy stunned). */
export const statusIcon = (id: string, side: Side): string => (side === 'hero' ? (STATUSES[id].selfIcon ?? STATUSES[id].icon) : STATUSES[id].icon);
