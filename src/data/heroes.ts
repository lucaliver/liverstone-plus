import { CONFIG } from './config';
import type { HeroDef, HeroId } from '../game/types';

const rep = (id: string, n: number): string[] => new Array(n).fill(id);

const warrior: HeroDef = {
  id: 'warrior',
  hp: 80,
  maxMana: 3,
  regen: 1.4,
  blockDecay: 1.2,
  resourceMax: 10,
  startDeck: [...rep('strike', 4), ...rep('defend', 4), 'bash', 'manaGeode'],
  color: '#d0563f',
  ability: {
    id: 'berserk',
    use: (c) => c.applyStatus('hero', 'berserk', 1, 6),
  },
  hooks: {
    // Rage: +1 per enemy hit taken, +1 per attack played.
    onHeroHit: (c) => c.addResource(1),
    onCardPlayed: (c, _card, def) => {
      if (def.type === 'attack') c.addResource(1);
    },
    damageMult: (c, def) => (def?.type === 'attack' && c.has('hero', 'berserk') ? 2 : 1),
  },
};

const mage: HeroDef = {
  id: 'mage',
  hp: 70,
  maxMana: 3,
  regen: 1.0,
  blockDecay: 1.0,
  resourceMax: 12,
  startDeck: [...rep('arcaneBolt', 4), ...rep('ward', 3), 'frostbolt', 'manaShard', 'manaGeode'],
  color: '#5b8cff',
  ability: {
    id: 'timeWarp',
    use: (c) => {
      c.applyStatus('enemy', 'frozen', 1, 4);
      c.slowBelt(4);
    },
  },
  hooks: {
    // Arcana fills with mana spent. Spellweave: chained spells gain +1 damage per Weave.
    onCardPlayed: (c, _card, def, spent) => {
      c.addResource(spent);
      if (def.type !== 'spell') return;
      const h = c.hero;
      h.weave = Math.min(h.weaveMax, h.weave + 1);
      h.weaveTimer = CONFIG.weaveWindow;
      c.events.emit({ type: 'weave', n: h.weave });
    },
    bonusDamage: (c, def) => (def?.type === 'spell' ? c.hero.weave : 0),
  },
};

const necromancer: HeroDef = {
  id: 'necromancer',
  hp: 58,
  maxMana: 2,
  regen: 1.25,
  blockDecay: 0.9,
  resourceMax: 10,
  startDeck: [...rep('boneSpike', 3), ...rep('graveWard', 2), ...rep('raiseSkeleton', 2), 'drainLife', 'manaShard', 'manaGeode'],
  color: '#2a8a4a',
  ability: {
    id: 'armyOfTheDead',
    use: (c) => {
      for (let i = 0; i < 3; i++) c.summon('skeleton');
    },
  },
  hooks: {
    // Grave Harvest: a card lost off the belt feeds the dark: +1 Soul and 1 damage.
    onCardExpired: (c) => {
      c.addResource(1);
      c.damage('hero', 'enemy', 1, { raw: true, kind: 'arcane' }, 'hero');
    },
    onMinionDeath: (c) => c.addResource(1),
    tick: (c, dt) => {
      // Lich Form: a Soul every 3 seconds.
      if (c.stacks('hero', 'lichForm') <= 0) return;
      c.mem.lichT = (c.mem.lichT ?? 0) + dt;
      if (c.mem.lichT >= 3) {
        c.mem.lichT -= 3;
        c.addResource(1);
      }
    },
  },
};

export const HEROES: Record<HeroId, HeroDef> = { warrior, mage, necromancer };
export const HERO_LIST: HeroDef[] = [warrior, mage, necromancer];
