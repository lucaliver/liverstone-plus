import type { MinionDef } from '../game/types';

const defs: MinionDef[] = [
  { id: 'skeleton', hp: 5, dmg: 2, interval: 2.2, art: 'skeleton' },
  { id: 'zombie', hp: 12, dmg: 4, interval: 3.4, art: 'zombie' },
  { id: 'boneDragon', hp: 22, dmg: 8, interval: 2.8, art: 'boneDragon' },
];

export const MINIONS: Record<string, MinionDef> = Object.fromEntries(defs.map((m) => [m.id, m]));
