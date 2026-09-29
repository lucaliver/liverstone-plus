import { CONFIG } from './config';
import type { HeroDef, HeroId } from '../game/types';

const rep = (id: string, n: number): string[] => new Array(n).fill(id);
/** Virulence (Necromancer passive) only kicks in once the enemy carries this much Poison. */
const VIRULENCE_AT = 7;

const warrior: HeroDef = {
  id: 'warrior',
  hp: 60,
  maxMana: 3,
  regen: 1.3,
  blockDecay: 1.2,
  // Starter decks: only basic cards (plus mana crystals); everything else comes from rewards.
  startDeck: [...rep('punch', 7), ...rep('hardHat', 6), 'unionChant', 'doubleEspresso'],
  firstRewards: [
    ['heavyLifting', 'crowbar', 'palletWall', 'ductTape'],
    ['wrenchWhack', 'shoulderCheck', 'coffeeBreak', 'grievance'],
    ['picketDrums', 'stonks', 'lunchBreak', 'pushback'],
  ],
  // The simplest class: no once-per-run special. One arm left: a single sleeve slot.
  sleeve: 1,
  color: '#d0563f',
  ability: {
    id: 'overtime',
    cost: 6,
    use: (c) => c.applyStatus('hero', 'overtime', 1, 10),
  },
  hooks: {
    damageMult: (c, def) => (def?.type === 'attack' && c.has('hero', 'overtime') ? 2 : 1),
  },
};

const mage: HeroDef = {
  id: 'mage',
  unlock: { finishRun: 'warrior' },
  hp: 70,
  maxMana: 3,
  regen: 0.8,
  blockDecay: 1.0,
  startDeck: [...rep('arcaneMemo', 7), ...rep('fireDoor', 6), 'coffee', 'doubleEspresso'],
  firstRewards: [
    ['coldCall', 'slagBall', 'coldStorage', 'ductTape'],
    ['caffeineJolt', 'staticShock', 'coffeeBreak', 'burnout'],
    ['replyAll', 'blueScreen', 'modernTimes', 'lookBusy'],
  ],
  sleeve: 2,
  color: '#5b8cff',
  ability: {
    id: 'timeTheft',
    cost: 6,
    use: (c) => {
      c.applyStatus('enemy', 'frozen', 1, 5);
      c.rushBelt(5);
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
  startDeck: [...rep('skeletonCrew', 6), ...rep('solidarity', 5), ...rep('toxicMemo', 2), 'coffee', 'doubleEspresso'],
  firstRewards: [
    ['bloodMoney', 'rust', 'barricade', 'ductTape'],
    ['unionDues', 'zombieShift', 'coffeeBreak', 'whistleblow'],
    ['deadLetter', 'sickLeave', 'sabotage', 'slowdown'],
  ],
  sleeve: 3,
  color: '#2a8a4a',
  ability: {
    id: 'generalStrike',
    cost: 6,
    // Double the enemy's Poison.
    use: (c) => c.applyStatus('enemy', 'poison', c.stacks('enemy', 'poison')),
  },
  hooks: {
    // Virulence: heavy Poison (7+) deals +1 per tick; Virulent Form adds its bonus on top, always.
    enemyDotBonus: (c, id) => (id === 'poison' ? (c.stacks('enemy', 'poison') >= VIRULENCE_AT ? 1 : 0) + c.stacks('hero', 'virulence') : 0),
    // Plague: Attacks also apply Poison.
    onCardPlayed: (c, _card, def) => {
      const plague = c.stacks('hero', 'plague');
      if (plague > 0 && def.type === 'attack') c.applyStatus('enemy', 'poison', plague, 0, true);
    },
  },
};

export const HEROES: Record<HeroId, HeroDef> = { warrior, mage, necromancer };
export const HERO_LIST: HeroDef[] = [warrior, mage, necromancer];
