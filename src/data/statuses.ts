import type { Combat } from '../game/combat';
import type { Side, StatusDef, StatusVal } from '../game/types';

/** How long every card played brings the Light Sleeper's hit closer (seconds). */
const WAKE_PER_CARD = 1;
/** The No Repeats Policy only covers cards played this close together (s), so a one-type deck is slowed, never locked. */
const POLICY_WINDOW = 3;

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
  { id: 'strength', kind: 'stacks', good: true, icon: 'fist' },
  { id: 'spellpower', kind: 'stacks', good: true, icon: 'wand' },
  { id: 'thorns', kind: 'stacks', good: true, icon: 'thorns' },
  { id: 'dodge', kind: 'stacks', good: true, icon: 'mirror' },
  { id: 'juggernaut', kind: 'stacks', good: true, icon: 'helm' },
  { id: 'fortified', kind: 'timed', good: true, icon: 'fortress' },
  { id: 'regen', kind: 'dot', good: true, icon: 'leaf' },
  { id: 'berserk', kind: 'timed', good: true, icon: 'overtime' },
  { id: 'parry', kind: 'timed', good: true, icon: 'crossed' },
  { id: 'haste', kind: 'timed', good: true, icon: 'gauge' },
  { id: 'rush', kind: 'timed', good: true, icon: 'speedCards' },
  { id: 'weave', kind: 'timed', good: true, icon: 'bolt2', showStacks: true },
  { id: 'plague', kind: 'stacks', good: true, icon: 'wrench' },
  // Slacking off (v = amount per second), until the hero plays another card.
  {
    id: 'bareMinimum',
    kind: 'timed',
    good: true,
    icon: 'battery',
    tick: everySecond((c, side, n, s) => c.gainBlock(side, n * s.v)),
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
  { id: 'burn', kind: 'dot', good: false, icon: 'flame' },
  { id: 'poison', kind: 'dot', good: false, icon: 'drop' },
  { id: 'weak', kind: 'timed', good: false, icon: 'broken' },
  { id: 'vulnerable', kind: 'timed', good: false, icon: 'crack' },
  { id: 'chill', kind: 'timed', good: false, icon: 'snow' },
  // A stunned enemy's timer stops (see enemyTimeRate); a stunned hero can't play cards.
  { id: 'stun', kind: 'timed', good: false, icon: 'stars', canPlay: (_c, side) => (side === 'hero' ? 'combat.stunned' : null) },
  { id: 'frozen', kind: 'timed', good: false, icon: 'hourglass' },
  { id: 'hurry', kind: 'timed', good: false, icon: 'stopwatch' },
  { id: 'slowdown', kind: 'timed', good: false, icon: 'cone' },
  // Enemy passives (permanent traits).
  {
    id: 'policy',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'rulebook',
    // Curses are exempt: paying one off is never "the same type" as the card before.
    canPlay: (c, side, def) =>
      side === 'enemy' && def.type !== 'curse' && c.lastPlayed?.type === def.type && c.time - c.lastPlayedAt < POLICY_WINDOW ? 'combat.policy' : null,
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
