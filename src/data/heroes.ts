import { CONFIG } from './config';
import type { HeroDef, HeroId } from '../game/types';

const rep = (id: string, n: number): string[] => new Array(n).fill(id);

/** The starter deck as cards: one copy of each `startUpgraded` id starts upgraded. */
export function starterCards(hero: HeroDef): { id: string; up: boolean }[] {
  const pending = new Set(hero.startUpgraded);
  return hero.startDeck.map((id) => ({ id, up: pending.delete(id) }));
}
/** Virulence (Necromancer passive) only kicks in once the enemy carries this much Poison, and then adds this much per tick. */
export const VIRULENCE_AT = 7;
export const VIRULENCE_BONUS = 1;
/** Overtime (Warrior ability): attacks deal this many times as much, for this long (s). */
export const OVERTIME_MULT = 2;
export const OVERTIME_TIME = 10;
/** Time Theft (Mage ability): the enemy is stunned and the belt rushed for this long (s). */
export const TIME_THEFT = 5;

const warrior: HeroDef = {
  id: 'warrior',
  hp: 60,
  maxMana: 3,
  regen: 1.25,
  blockDecay: 1.2,
  // Starter decks: only basic cards (plus mana crystals); everything else comes from rewards.
  startDeck: [...rep('punch', 6), ...rep('hardHat', 6), 'unionChant', 'coffee', 'coffee'],
  startUpgraded: ['punch', 'hardHat'],
  firstRewards: [
    ['heavyLifting', 'crowbar', 'palletWall', 'ductTape'],
    ['wrenchWhack', 'shoulderCheck', 'coffeeBreak', 'grievance'],
    ['picketDrums', 'stonks', 'lunchBreak', 'pushback'],
  ],
  // The simplest class: no once-per-run special. One arm left: a single sleeve slot.
  sleeve: 1,
  ink: 'var(--p)',
  ability: {
    id: 'overtime',
    cost: 6,
    use: (c) => c.applyStatus('hero', 'overtime', 1, OVERTIME_TIME),
  },
  hooks: {
    damageMult: (c, def) => (def?.type === 'attack' && c.has('hero', 'overtime') ? OVERTIME_MULT : 1),
  },
};

const mage: HeroDef = {
  id: 'mage',
  unlock: { finishRun: 'warrior' },
  hp: 70,
  maxMana: 3,
  regen: 1.25,
  blockDecay: 1.0,
  startDeck: [...rep('clippy', 7), ...rep('fireDoor', 5), 'coffee', 'doubleEspresso', 'caffeineJolt'],
  startUpgraded: ['clippy', 'fireDoor'],
  firstRewards: [
    ['coldCall', 'slagBall', 'coldStorage', 'ductTape'],
    ['caffeineJolt', 'staticShock', 'coffeeBreak', 'burnout'],
    ['replyAll', 'blueScreen', 'modernTimes', 'lookBusy'],
  ],
  sleeve: 2,
  ink: 'var(--b)',
  ability: {
    id: 'timeTheft',
    cost: 6,
    use: (c) => {
      c.applyStatus('enemy', 'stun', 1, TIME_THEFT);
      c.rushBelt(TIME_THEFT);
    },
  },
  hooks: {
    // Multitasking: each spell cast within the window adds a stack (+1 spell damage each).
    onCardPlayed: (c, _card, def) => {
      if (def.type !== 'spell') return;
      const stacks = Math.min(CONFIG.multitaskingMax, c.stacks('hero', 'multitasking') + 1);
      c.hero.statuses.multitasking = { v: stacks, t: CONFIG.multitaskingWindow };
    },
    bonusDamage: (c, def) => (def?.type === 'spell' ? c.stacks('hero', 'multitasking') : 0),
  },
};

const necromancer: HeroDef = {
  id: 'necromancer',
  unlock: { reachBoss: 1 },
  hp: 50,
  maxMana: 2,
  regen: 1.25,
  blockDecay: 0.9,
  startDeck: [...rep('skeletonCrew', 6), ...rep('karlMarx', 5), ...rep('toxicMemo', 2), 'coffee', 'doubleEspresso'],
  startUpgraded: ['skeletonCrew', 'karlMarx'],
  firstRewards: [
    ['bloodMoney', 'rust', 'barricade', 'ductTape'],
    ['unionDues', 'zombieShift', 'coffeeBreak', 'whistleblow'],
    ['deadLetter', 'sickLeave', 'sabotage', 'slowdown'],
  ],
  sleeve: 3,
  ink: 'var(--green)',
  ability: {
    id: 'generalStrike',
    cost: 6,
    // Double the enemy's Poison.
    use: (c) => c.applyStatus('enemy', 'poison', c.stacks('enemy', 'poison')),
  },
  hooks: {
    // Virulence: heavy Poison (7+) deals +1 per tick; Virulent Form adds its bonus on top, always.
    enemyDotBonus: (c, id) =>
      id === 'poison' ? (c.stacks('enemy', 'poison') >= VIRULENCE_AT ? VIRULENCE_BONUS : 0) + c.stacks('hero', 'virulence') : 0,
    // Plague: Attacks also apply Poison.
    onCardPlayed: (c, _card, def) => {
      const plague = c.stacks('hero', 'plague');
      if (plague > 0 && def.type === 'attack') c.applyStatus('enemy', 'poison', plague, 0, true);
    },
  },
};

export const HEROES: Record<HeroId, HeroDef> = { warrior, mage, necromancer };
export const HERO_LIST: HeroDef[] = [warrior, mage, necromancer];
