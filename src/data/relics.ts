import type { Combat } from '../game/combat';
import type { RelicDef } from '../game/types';

/** A relic shows itself in the fight: a floating name over the hero. */
const proc = (c: Combat, id: string): void => c.events.emit({ type: 'relic', id });

const STRESS_BALL_BLOCK = 8;
const THERMOS_HEAL = 5;
const STAPLER_EVERY = 6;
export const STAPLER_DAMAGE = 6;
const BOOT_MANA = 2;
const MUG_EVERY = 5;
export const MUG_MANA = 1;
const CLOCK_EVERY = 10;
export const CLOCK_BLOCK = 4;
/** Share of max HP the Emergency Exit gets you back on your feet with. */
const EXIT_HP = 0.35;

/**
 * Relics found in the Lost & Found (and one sold by the Tailor). `n` is the number their text shows (`{n}`); the hooks and
 * modifiers use the same constants, so text and effect can't drift apart.
 */
const defs: RelicDef[] = [
  {
    id: 'stressBall',
    rarity: 'common',
    n: STRESS_BALL_BLOCK,
    hooks: {
      onCombatStart: (c) => {
        c.gainBlock('hero', STRESS_BALL_BLOCK);
        proc(c, 'stressBall');
      },
    },
  },
  {
    id: 'thermos',
    rarity: 'common',
    n: THERMOS_HEAL,
    hooks: { onCombatEnd: (c) => void (c.heal('hero', THERMOS_HEAL) > 0 && proc(c, 'thermos')) },
  },
  { id: 'ergoChair', rarity: 'common', n: 12, mods: { regen: 1.12 } },
  {
    id: 'coffeeMug',
    rarity: 'common',
    n: MUG_EVERY,
    progress: (c) => ((c.mem.mug ?? 0) % MUG_EVERY) / MUG_EVERY,
    hooks: {
      onCardPlayed: (c) => {
        c.mem.mug = (c.mem.mug ?? 0) + 1;
        if (c.mem.mug % MUG_EVERY) return;
        c.gainMana(MUG_MANA);
        proc(c, 'coffeeMug');
      },
    },
  },
  {
    id: 'wallClock',
    rarity: 'common',
    n: CLOCK_EVERY,
    progress: (c) => (c.mem.clock ?? 0) / CLOCK_EVERY,
    hooks: {
      tick: (c, dt) => {
        c.mem.clock = (c.mem.clock ?? 0) + dt;
        if (c.mem.clock < CLOCK_EVERY) return;
        c.mem.clock -= CLOCK_EVERY;
        c.gainBlock('hero', CLOCK_BLOCK);
        proc(c, 'wallClock');
      },
    },
  },
  {
    id: 'unionArmband',
    rarity: 'rare',
    n: 1,
    hooks: {
      onCombatStart: (c) => {
        c.applyStatus('hero', 'strength', 1);
        proc(c, 'unionArmband');
      },
    },
  },
  {
    id: 'inboxZero',
    rarity: 'rare',
    n: BOOT_MANA,
    mods: { maxMana: 1 },
    hooks: {
      onCombatStart: (c) => {
        c.gainMana(BOOT_MANA);
        proc(c, 'inboxZero');
      },
    },
  },
  {
    id: 'heavyStapler',
    rarity: 'rare',
    n: STAPLER_EVERY,
    progress: (c) => ((c.mem.stapler ?? 0) % STAPLER_EVERY) / STAPLER_EVERY,
    hooks: {
      onCardPlayed: (c) => {
        c.mem.stapler = (c.mem.stapler ?? 0) + 1;
        if (c.mem.stapler % STAPLER_EVERY) return;
        c.damage('hero', 'enemy', STAPLER_DAMAGE, { raw: true, kind: 'blunt' }, 'hero');
      },
    },
  },
  { id: 'spareBadge', rarity: 'epic', n: 1, mods: { maxMana: 1 } },
  {
    id: 'emergencyExit',
    rarity: 'epic',
    n: Math.round(EXIT_HP * 100),
    hooks: {
      // Once per run: the flag lives in the run, so it survives the fight.
      onDeath: (c) => {
        if (c.relicFlags.emergencyExit) return false;
        c.relicFlags.emergencyExit = 1;
        c.heal('hero', Math.round(c.hero.maxHp * EXIT_HP));
        return true;
      },
    },
  },
  // The Tailor's: not found in the Lost & Found.
  { id: 'cargoPants', rarity: 'special', n: 1, mods: { sleeve: 1 } },
];

export const RELICS: Record<string, RelicDef> = Object.fromEntries(defs.map((r) => [r.id, r]));
export const RELIC_LIST: readonly RelicDef[] = defs;

/** The sum of a numeric modifier over the relics a run holds (the hero sheet shows the stats as the fight will start). */
export const relicSum = (relics: readonly string[], key: 'sleeve' | 'maxMana'): number =>
  relics.reduce((s, id) => s + (RELICS[id]?.mods?.[key] ?? 0), 0);
