import type { StatusDef } from '../game/types';

/** How long every card played brings the Light Sleeper's hit closer (seconds). */
const WAKE_PER_CARD = 1;
/** The No Repeats Policy only covers cards played this close together (s), so a one-type deck is slowed, never locked. */
const POLICY_WINDOW = 3;

const defs: StatusDef[] = [
  { id: 'strength', kind: 'stacks', good: true, icon: 'fist' },
  { id: 'spellpower', kind: 'stacks', good: true, icon: 'star' },
  { id: 'thorns', kind: 'stacks', good: true, icon: 'thorns' },
  { id: 'dodge', kind: 'stacks', good: true, icon: 'mirror' },
  { id: 'juggernaut', kind: 'stacks', good: true, icon: 'helm' },
  { id: 'fortified', kind: 'timed', good: true, icon: 'fortress' },
  { id: 'regen', kind: 'dot', good: true, icon: 'leaf' },
  { id: 'berserk', kind: 'timed', good: true, icon: 'rage' },
  { id: 'parry', kind: 'timed', good: true, icon: 'crossed' },
  { id: 'haste', kind: 'timed', good: true, icon: 'wing' },
  { id: 'rush', kind: 'timed', good: true, icon: 'cards' },
  { id: 'weave', kind: 'timed', good: true, icon: 'bolt2', showStacks: true },
  { id: 'plague', kind: 'stacks', good: true, icon: 'drop' },
  { id: 'virulence', kind: 'stacks', good: true, icon: 'skull' },
  { id: 'burn', kind: 'dot', good: false, icon: 'flame' },
  { id: 'poison', kind: 'dot', good: false, icon: 'drop' },
  { id: 'weak', kind: 'timed', good: false, icon: 'broken' },
  { id: 'vulnerable', kind: 'timed', good: false, icon: 'crack' },
  { id: 'chill', kind: 'timed', good: false, icon: 'snow' },
  { id: 'stun', kind: 'timed', good: false, icon: 'stars' },
  { id: 'frozen', kind: 'timed', good: false, icon: 'hourglass' },
  // Enemy passives (permanent traits).
  {
    id: 'policy',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'clipboard',
    // Curses are exempt: paying one off is never "the same type" as the card before.
    canPlay: (c, side, def) =>
      side === 'enemy' && def.type !== 'curse' && c.lastPlayed?.type === def.type && c.time - c.lastPlayedAt < POLICY_WINDOW ? 'combat.policy' : null,
  },
  {
    id: 'lightSleeper',
    kind: 'stacks',
    good: true,
    passive: true,
    icon: 'hourglass',
    onCardPlayed: (c, side) => {
      if (side === 'enemy') c.hurryEnemy(WAKE_PER_CARD);
    },
  },
];

export const STATUSES: Record<string, StatusDef> = Object.fromEntries(defs.map((d) => [d.id, d]));
export const STATUS_ORDER = defs.map((d) => d.id);
