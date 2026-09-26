import type { CardDef } from '../../game/types';

export const necromancerCards: CardDef[] = [
  // Starters
  { id: 'boneSpike', face: '{dmg:0}', cls: 'necromancer', type: 'attack', rarity: 'starter', cost: 1, vals: [5], upVals: [8], dmg: [0], art: 'bone', play: (c, v) => void c.hit(v[0]) },
  {
    id: 'graveWard', face: '{block:0}|{soul:1}', cls: 'necromancer', type: 'skill', rarity: 'starter', cost: 1, vals: [5, 1], upVals: [8, 1], art: 'tomb',
    play: (c, v) => {
      c.gainBlock('hero', v[0]);
      c.addResource(v[1]);
    },
  },
  { id: 'raiseSkeleton', face: '{raise:0}', cls: 'necromancer', type: 'skill', rarity: 'starter', cost: 2, upCost: 1, vals: [1], art: 'skull', play: (c) => c.summon('skeleton') },
  {
    id: 'drainLife', face: '{dmg:0}|{heal:1}', cls: 'necromancer', type: 'spell', rarity: 'starter', cost: 1, vals: [4, 3], upVals: [6, 4], dmg: [0], art: 'fang',
    play: (c, v) => {
      c.hit(v[0], { kind: 'arcane' });
      c.heal('hero', v[1]);
    },
  },

  // Commons
  {
    id: 'corpseExplosion', face: '{sac}|{dmg:0}', cls: 'necromancer', type: 'spell', rarity: 'common', cost: 1, vals: [14, 3], upVals: [20, 5], dmg: [0, 1], art: 'combust',
    play: (c, v) => void c.hit(c.sacrifice() ? v[0] : v[1], { kind: 'fire' }),
  },
  {
    id: 'ghoulBite', face: '{dmg:0}|{heal:1}', cls: 'necromancer', type: 'attack', rarity: 'common', cost: 0, vals: [3, 1], upVals: [5, 2], dmg: [0], art: 'fang',
    play: (c, v) => {
      c.hit(v[0]);
      c.heal('hero', v[1]);
    },
  },
  { id: 'raiseZombie', face: '{raise:0}', cls: 'necromancer', type: 'skill', rarity: 'common', cost: 3, upCost: 2, vals: [1], art: 'hand', play: (c) => c.summon('zombie') },
  { id: 'frailty', face: '{vuln:0}', cls: 'necromancer', type: 'spell', rarity: 'common', cost: 1, vals: [5], upVals: [8], art: 'crack', play: (c, v) => c.applyStatus('enemy', 'vulnerable', 1, v[0]) },
  { id: 'soulSiphon', face: '{soul:0}', cls: 'necromancer', type: 'spell', rarity: 'common', cost: 0, vals: [2], upVals: [3], art: 'ghost', play: (c, v) => c.addResource(v[0]) },
  { id: 'rot', face: '{poison:0}', cls: 'necromancer', type: 'spell', rarity: 'common', cost: 1, vals: [6], upVals: [9], art: 'drop', play: (c, v) => c.applyStatus('enemy', 'poison', v[0]) },

  // Rares
  {
    id: 'deathCoil', face: '{dmg:0}|{poison}{dmg:1}', cls: 'necromancer', type: 'spell', rarity: 'rare', cost: 2, vals: [10, 18], upVals: [14, 24], dmg: [0, 1], art: 'whirl',
    play: (c, v) => void c.hit(c.has('enemy', 'poison') ? v[1] : v[0], { kind: 'arcane' }),
  },
  { id: 'unholyFrenzy', face: '{frenzy}', cls: 'necromancer', type: 'skill', rarity: 'rare', cost: 1, upCost: 0, vals: [], art: 'rage', play: (c) => c.minionsStrike() },
  { id: 'boneArmor', face: '{skull}{block:0}', cls: 'necromancer', type: 'power', rarity: 'rare', cost: 2, vals: [5], upVals: [8], art: 'helm', play: (c, v) => c.applyStatus('hero', 'boneArmor', v[0]) },
  { id: 'plague', face: '{raise}{poison:0}', cls: 'necromancer', type: 'power', rarity: 'rare', cost: 2, vals: [1], upVals: [2], art: 'drop', play: (c, v) => c.applyStatus('hero', 'plague', v[0]) },

  // Epics
  {
    id: 'lichForm', face: '{might:0}|{soul}', cls: 'necromancer', type: 'power', rarity: 'epic', cost: 3, upCost: 2, vals: [2], art: 'crown',
    play: (c, v) => {
      c.applyStatus('hero', 'undeadMight', v[0]);
      c.applyStatus('hero', 'lichForm', 1);
    },
  },
  {
    id: 'massRaise', face: '{raise:0}', cls: 'necromancer', type: 'skill', rarity: 'epic', cost: 4, upCost: 3, vals: [2], keywords: ['exhaust'], art: 'skull',
    play: (c, v) => {
      for (let i = 0; i < v[0]; i++) c.summon('skeleton');
    },
  },

  // Legendary
  { id: 'boneDragon', face: '{raise:0}', cls: 'necromancer', type: 'skill', rarity: 'legendary', cost: 5, upCost: 4, vals: [1], keywords: ['exhaust'], art: 'wing', play: (c) => c.summon('boneDragon') },
];
