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
  startDeck: [...rep('strike', 4), ...rep('defend', 4), 'manaGeode'],
  firstRewards: [
    ['heavyLifting', 'cleave', 'ironWall', 'bandage'],
    ['battleCry', 'shieldBash', 'coffeeBreak', 'counterstrike'],
    ['warDrums', 'rampage', 'secondWind', 'parry'],
  ],
  // The simplest class: no once-per-run special. One arm left: a single sleeve slot.
  sleeve: 1,
  color: '#d0563f',
  ability: {
    id: 'berserk',
    cost: 6,
    use: (c) => c.applyStatus('hero', 'berserk', 1, 10),
  },
  hooks: {
    damageMult: (c, def) => (def?.type === 'attack' && c.has('hero', 'berserk') ? 2 : 1),
  },
};

const mage: HeroDef = {
  id: 'mage',
  unlock: { finishRun: 'warrior' },
  hp: 70,
  maxMana: 3,
  regen: 0.8,
  blockDecay: 1.0,
  startDeck: [...rep('arcaneBolt', 4), ...rep('ward', 3), 'manaShard', 'manaGeode'],
  firstRewards: [
    ['frostbolt', 'fireball', 'frostArmor', 'bandage'],
    ['manaSurge', 'spark', 'coffeeBreak', 'ignite'],
    ['arcaneMissiles', 'shatter', 'timeSlip', 'mirrorImage'],
  ],
  special: 'meteor',
  sleeve: 2,
  color: '#5b8cff',
  ability: {
    id: 'timeWarp',
    cost: 6,
    use: (c) => {
      c.applyStatus('enemy', 'frozen', 1, 5);
      c.rushBelt(5);
    },
  },
  hooks: {
    // Spellweave: each spell cast within the window adds a Weave stack (+1 spell damage each).
    onCardPlayed: (c, _card, def) => {
      if (def.type !== 'spell') return;
      const stacks = Math.min(CONFIG.weaveMax, c.stacks('hero', 'weave') + 1);
      c.hero.statuses.weave = { v: stacks, t: CONFIG.weaveWindow };
    },
    bonusDamage: (c, def) => (def?.type === 'spell' ? c.stacks('hero', 'weave') : 0),
  },
};

const necromancer: HeroDef = {
  id: 'necromancer',
  unlock: { reachBoss: 1 },
  hp: 50,
  maxMana: 2,
  regen: 1.25,
  blockDecay: 0.9,
  startDeck: [...rep('boneSpike', 3), ...rep('graveWard', 3), 'toxicDart', 'manaShard', 'manaGeode'],
  firstRewards: [
    ['drainLife', 'rot', 'boneWall', 'bandage'],
    ['unionDues', 'ghoulBite', 'coffeeBreak', 'frailty'],
    ['deathCoil', 'festeringStrike', 'plague', 'wither'],
  ],
  special: 'deathsDoor',
  sleeve: 3,
  color: '#2a8a4a',
  ability: {
    id: 'pandemic',
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
