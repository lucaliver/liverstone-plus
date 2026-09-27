import { CONFIG } from './config';
import type { HeroDef, HeroId } from '../game/types';

const rep = (id: string, n: number): string[] => new Array(n).fill(id);

const warrior: HeroDef = {
  id: 'warrior',
  hp: 72,
  maxMana: 3,
  regen: 1.3,
  blockDecay: 1.2,
  // Starter decks: only basic cards (plus mana crystals); everything else comes from rewards.
  startDeck: [...rep('strike', 5), ...rep('defend', 4), 'manaGeode'],
  special: 'lastStand',
  color: '#d0563f',
  ability: {
    id: 'berserk',
    cost: 5,
    use: (c) => c.applyStatus('hero', 'berserk', 1, 6),
  },
  hooks: {
    damageMult: (c, def) => (def?.type === 'attack' && c.has('hero', 'berserk') ? 2 : 1),
  },
};

const mage: HeroDef = {
  id: 'mage',
  hp: 74,
  maxMana: 3,
  regen: 0.8,
  blockDecay: 1.0,
  startDeck: [...rep('arcaneBolt', 5), ...rep('ward', 3), 'manaShard', 'manaGeode'],
  special: 'meteor',
  color: '#5b8cff',
  ability: {
    id: 'timeWarp',
    cost: 5,
    use: (c) => {
      c.applyStatus('enemy', 'frozen', 1, 4);
      c.rushBelt(4);
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
  hp: 62,
  maxMana: 2,
  regen: 1.25,
  blockDecay: 0.9,
  startDeck: [...rep('boneSpike', 3), ...rep('graveWard', 3), ...rep('toxicDart', 2), 'manaShard', 'manaGeode'],
  special: 'deathsDoor',
  color: '#2a8a4a',
  ability: {
    id: 'pandemic',
    cost: 4,
    // Double the enemy's Poison (at least +5).
    use: (c) => c.applyStatus('enemy', 'poison', Math.max(5, c.stacks('enemy', 'poison'))),
  },
  hooks: {
    // Virulence: Poison deals +1 per tick (more with Virulent Form).
    enemyDotBonus: (c, id) => (id === 'poison' ? 1 + c.stacks('hero', 'virulence') : 0),
    // Plague: Attacks also apply Poison.
    onCardPlayed: (c, _card, def) => {
      const plague = c.stacks('hero', 'plague');
      if (plague > 0 && def.type === 'attack') c.applyStatus('enemy', 'poison', plague, 0, true);
    },
  },
};

export const HEROES: Record<HeroId, HeroDef> = { warrior, mage, necromancer };
export const HERO_LIST: HeroDef[] = [warrior, mage, necromancer];
