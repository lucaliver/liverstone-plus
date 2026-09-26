import { CONFIG } from './config';
import type { HeroDef, HeroId } from '../game/types';

const rep = (id: string, n: number): string[] => new Array(n).fill(id);

const warrior: HeroDef = {
  id: 'warrior',
  hp: 80,
  maxMana: 5,
  regen: 1.4,
  blockDecay: 1.2,
  resourceMax: 10,
  startDeck: [...rep('strike', 5), ...rep('defend', 4), 'bash'],
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
  hp: 66,
  maxMana: 7,
  regen: 1.2,
  blockDecay: 0.6,
  resourceMax: 12,
  startDeck: [...rep('arcaneBolt', 4), ...rep('ward', 4), 'frostbolt', 'arcaneIntellect'],
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

export const HEROES: Record<HeroId, HeroDef> = { warrior, mage };
export const HERO_LIST: HeroDef[] = [warrior, mage];
