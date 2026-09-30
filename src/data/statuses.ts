import type { Combat } from '../game/combat';
import type { MoveDef, Side, StatusDef, StatusVal } from '../game/types';
import { type CardCategory, cardCategory } from './cards';

/** How long every card played brings the Light Sleeper's hit closer (seconds). */
const WAKE_PER_CARD = 1;
/** The No Repeats Policy only covers cards played this close together (s), so a one-type deck is slowed, never locked. */
const POLICY_WINDOW = 3;
/** Meticulous: two cards from the same belt row can't be played this close together (s), so an empty row never locks you. */
const LANE_WINDOW = 4;
/** Chill Out: seconds between two cards. */
const CHILL_GAP = 2;
/** Micromanagement: seconds without playing a card before he cuts in. */
const IDLE_LIMIT = 2;
/** Card colours, by index (a status's free number `e` remembers one). */
const CATEGORIES: CardCategory[] = ['attack', 'defense', 'utility', 'curse'];
/** What the Overthinker does once it has lost its train of thought. */
const WHERE_WAS_I: MoveDef = { id: 'whereWasI', intent: 'idle', windup: 4 };
/** Spending Freeze: the hero's max mana. */
const SPENDING_FREEZE_CAP = 3;

/** A status tick that runs `fn` once per whole second the status has been up (n = 1, 2, 3…). */
const everySecond =
  (fn: (c: Combat, side: Side, n: number, s: StatusVal) => void): StatusDef['tick'] =>
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

const defs: StatusDef[] = [
  { id: 'strength', kind: 'stacks', good: true, icon: 'fist', strength: true },
  // Workaholic: `v` Strength, for a while only.
  { id: 'workaholic', kind: 'timed', good: true, icon: 'fist', strength: true },
  { id: 'brownNosing', kind: 'timed', good: true, icon: 'crystalUp', regenMul: 2 },
  { id: 'spellPower', kind: 'stacks', good: true, icon: 'wand' },
  { id: 'thorns', kind: 'stacks', good: true, icon: 'thorns' },
  { id: 'dodge', kind: 'timed', good: true, icon: 'mirror' },
  { id: 'juggernaut', kind: 'stacks', good: true, icon: 'helm' },
  { id: 'fortified', kind: 'timed', good: true, icon: 'fortress' },
  { id: 'regen', kind: 'dot', good: true, icon: 'leaf' },
  { id: 'overtime', kind: 'timed', good: true, icon: 'overtime' },
  { id: 'parry', kind: 'timed', good: true, icon: 'crossed' },
  { id: 'haste', kind: 'timed', good: true, icon: 'gauge' },
  { id: 'rush', kind: 'timed', good: true, icon: 'speedCards' },
  // Work-Life Balance: every card played hits again (for v), until two cards of the same colour come one after the
  // other; `e` is the colour of the last one.
  {
    id: 'workLifeBalance',
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
  { id: 'autopilot', kind: 'timed', good: true, icon: 'autopilot' },
  // Root access (sudo): no rule can stop the hero's cards.
  { id: 'rootAccess', kind: 'timed', good: true, icon: 'terminal' },
  { id: 'multitasking', kind: 'timed', good: true, icon: 'bolt2', showStacks: true },
  { id: 'plague', kind: 'stacks', good: true, icon: 'wrench' },
  // Slacking off (v = amount per second), until the hero plays another card.
  {
    id: 'bareMinimum',
    kind: 'timed',
    good: true,
    icon: 'battery',
    tick: everySecond((c, side, n, s) => c.gainBlock(side, s.v + n - 1)),
    onCardPlayed: endOnPlay('bareMinimum'),
  },
  {
    id: 'outOfOffice',
    kind: 'timed',
    good: true,
    icon: 'sun',
    tick: everySecond((c, side, _n, s) => void c.heal(side, s.v)),
    onCardPlayed: endOnPlay('outOfOffice'),
  },
  {
    id: 'grindset',
    kind: 'timed',
    good: true,
    icon: 'rocket',
    tick: everySecond((c, side, _n, s) => void c.damage(side, side === 'hero' ? 'enemy' : 'hero', s.v, { kind: 'blunt' }, side)),
    onCardPlayed: endOnPlay('grindset'),
  },
  { id: 'virulence', kind: 'stacks', good: true, icon: 'biohazard' },
  // Burn: no clock and no decay; the enemy takes its stacks every time it attacks (Poison is the slow, fading one).
  {
    id: 'burn',
    kind: 'stacks',
    good: false,
    icon: 'flame',
    onAttack: (c, side, s) => void c.damage(side === 'enemy' ? 'hero' : 'enemy', side, s.v, { raw: true, ignoreBlock: true, kind: 'burn' }, 'dot'),
  },
  { id: 'poison', kind: 'dot', good: false, icon: 'drop' },
  { id: 'weak', kind: 'timed', good: false, icon: 'broken' },
  { id: 'vulnerable', kind: 'timed', good: false, icon: 'crack' },
  { id: 'chill', kind: 'timed', good: false, icon: 'snow', regenMul: 0.5 },
  // A stunned enemy's timer stops (see enemyTimeRate); a stunned hero can't play cards.
  { id: 'stun', kind: 'timed', good: false, icon: 'stars', selfIcon: 'ko', canPlay: (_c, side) => (side === 'hero' ? 'combat.stunned' : null) },
  { id: 'frozen', kind: 'timed', good: false, icon: 'hourglass' },
  { id: 'hurry', kind: 'timed', good: false, icon: 'stopwatch' },
  // Emergency button: the belt stops dead.
  { id: 'stalled', kind: 'timed', good: false, icon: 'pause' },
  { id: 'crunch', kind: 'timed', good: false, icon: 'siren' },
  // Every card turns black: only the art and the cost are left to go by.
  { id: 'blackout', kind: 'timed', good: false, icon: 'bulbOff' },
  { id: 'slowdown', kind: 'timed', good: false, icon: 'cone' },
  // Enemy passives (permanent traits).
  {
    id: 'noRepeatsPolicy',
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
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'lotus',
    canPlay: (c, side) => (side === 'enemy' && c.time - c.lastPlayedAt < CHILL_GAP ? 'combat.chillOut' : null),
  },
  { id: 'spendingFreeze', kind: 'stacks', good: true, passive: true, icon: 'calculator', manaCap: SPENDING_FREEZE_CAP },
  // Train of thought: take `v` damage while it charges a move and it forgets what it was doing (the move is lost).
  {
    id: 'trainOfThought',
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
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'watchEye',
    // `e` holds when he last cut in, so one quiet spell costs one hit.
    tick: (c, side, s) => {
      if (side !== 'enemy' || c.time - Math.max(c.lastPlayedAt, s.e ?? 0) < IDLE_LIMIT) return;
      s.e = c.time;
      c.enemyStrike();
    },
  },
  // Paper cuts: every card slipping off the belt cuts the hero for `v`.
  {
    id: 'paperCuts',
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
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'uTurn',
    onHurt: (c, side) => {
      const e = c.enemy;
      if (side !== 'enemy' || e.hp <= 0) return;
      const quarters = Math.floor((4 * (e.maxHp - e.hp)) / e.maxHp);
      if (quarters > (e.mem.turns ?? 0)) c.say('status.paradigmShift.speech');
      for (let n = e.mem.turns ?? 0; n < quarters; n++) c.reverseBelt();
      e.mem.turns = Math.max(e.mem.turns ?? 0, quarters);
    },
  },
  {
    id: 'lightSleeper',
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
