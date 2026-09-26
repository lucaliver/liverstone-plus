import type { StatusDef } from '../game/types';

const defs: StatusDef[] = [
  { id: 'strength', kind: 'stacks', good: true, icon: 'fist' },
  { id: 'spellpower', kind: 'stacks', good: true, icon: 'star' },
  { id: 'thorns', kind: 'stacks', good: true, icon: 'thorns' },
  { id: 'dodge', kind: 'stacks', good: true, icon: 'mirror' },
  { id: 'juggernaut', kind: 'stacks', good: true, icon: 'helm' },
  { id: 'regen', kind: 'dot', good: true, icon: 'leaf' },
  { id: 'berserk', kind: 'timed', good: true, icon: 'rage' },
  { id: 'parry', kind: 'timed', good: true, icon: 'crossed' },
  { id: 'haste', kind: 'timed', good: true, icon: 'wing' },
  { id: 'burn', kind: 'dot', good: false, icon: 'flame' },
  { id: 'poison', kind: 'dot', good: false, icon: 'drop' },
  { id: 'weak', kind: 'timed', good: false, icon: 'broken' },
  { id: 'vulnerable', kind: 'timed', good: false, icon: 'crack' },
  { id: 'chill', kind: 'timed', good: false, icon: 'snow' },
  { id: 'stun', kind: 'timed', good: false, icon: 'stars' },
  { id: 'frozen', kind: 'timed', good: false, icon: 'hourglass' },
];

export const STATUSES: Record<string, StatusDef> = Object.fromEntries(defs.map((d) => [d.id, d]));
export const STATUS_ORDER = defs.map((d) => d.id);
