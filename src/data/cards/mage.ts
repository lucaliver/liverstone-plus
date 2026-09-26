import type { CardDef } from '../../game/types';

export const mageCards: CardDef[] = [
  // Starters
  { id: 'arcaneBolt', face: '{dmg:0}', cls: 'mage', type: 'spell', rarity: 'starter', cost: 1, vals: [6], upVals: [9], dmg: [0], art: 'bolt', play: (c, v) => void c.hit(v[0]) },
  { id: 'ward', face: '{block:0}', cls: 'mage', type: 'skill', rarity: 'starter', cost: 1, vals: [7], upVals: [10], art: 'ward', play: (c, v) => c.gainBlock('hero', v[0]) },
  {
    id: 'frostbolt', face: '{dmg:0}|{chill:1}', cls: 'mage', type: 'spell', rarity: 'starter', cost: 1, vals: [4, 3], upVals: [6, 4], dmg: [0], art: 'frost',
    play: (c, v) => {
      c.hit(v[0], { kind: 'ice' });
      c.applyStatus('enemy', 'chill', 1, v[1]);
    },
  },
  { id: 'arcaneIntellect', face: '{draw:0}', cls: 'mage', type: 'spell', rarity: 'starter', cost: 1, upCost: 0, vals: [2], art: 'book', play: (c, v) => c.drawCards(v[0]) },

  // Commons
  {
    id: 'fireball', face: '{dmg:0}|{burn:1}', cls: 'mage', type: 'spell', rarity: 'common', cost: 3, vals: [14, 3], upVals: [18, 4], dmg: [0], art: 'fireball',
    play: (c, v) => {
      c.hit(v[0], { kind: 'fire' });
      c.applyStatus('enemy', 'burn', v[1]);
    },
  },
  {
    id: 'iceLance', face: '{dmg:0}|{snow}{dmg:1}', cls: 'mage', type: 'spell', rarity: 'common', cost: 2, vals: [7, 16], upVals: [9, 20], dmg: [0, 1], art: 'iceLance',
    play: (c, v) => void c.hit(c.has('enemy', 'chill') ? v[1] : v[0], { kind: 'ice' }),
  },
  { id: 'manaSurge', face: '{mana:0}', cls: 'mage', type: 'skill', rarity: 'common', cost: 0, vals: [2], upVals: [3], art: 'crystal', play: (c, v) => c.gainMana(v[0]) },
  { id: 'spark', face: '{dmg:0}', cls: 'mage', type: 'spell', rarity: 'common', cost: 0, vals: [3], upVals: [5], dmg: [0], art: 'spark', play: (c, v) => void c.hit(v[0], { kind: 'arcane' }) },
  {
    id: 'frostArmor', face: '{block:0}|{chill:1}', cls: 'mage', type: 'skill', rarity: 'common', cost: 2, vals: [10, 3], upVals: [13, 4], art: 'frostArmor',
    play: (c, v) => {
      c.gainBlock('hero', v[0]);
      c.applyStatus('enemy', 'chill', 1, v[1]);
    },
  },
  { id: 'ignite', face: '{burn:0}', cls: 'mage', type: 'spell', rarity: 'common', cost: 1, vals: [6], upVals: [9], art: 'flame', play: (c, v) => c.applyStatus('enemy', 'burn', v[0]) },

  // Rares
  { id: 'arcaneMissiles', face: '{dmg:0}×{1}', cls: 'mage', type: 'spell', rarity: 'rare', cost: 3, vals: [3, 5], upVals: [3, 7], dmg: [0], art: 'missiles', play: (c, v) => void c.hit(v[0], { hits: v[1] }) },
  {
    id: 'timeSlip', face: '{slow:0}|{draw:1}', cls: 'mage', type: 'skill', rarity: 'rare', cost: 1, upCost: 0, vals: [5, 1], art: 'hourglass',
    play: (c, v) => {
      c.slowBelt(v[0]);
      c.drawCards(v[1]);
    },
  },
  { id: 'mirrorImage', face: '{dodge:0}', cls: 'mage', type: 'skill', rarity: 'rare', cost: 1, upCost: 0, vals: [1], art: 'mirror', play: (c, v) => c.applyStatus('hero', 'dodge', v[0]) },
  {
    id: 'combustion', face: '{burn}×{0}', cls: 'mage', type: 'spell', rarity: 'rare', cost: 2, upCost: 1, vals: [2], upVals: [3], art: 'combust',
    play: (c, v) => {
      const burn = c.stacks('enemy', 'burn');
      c.removeStatus('enemy', 'burn');
      c.hit(burn * v[0], { kind: 'fire' });
    },
  },

  // Epics
  { id: 'polymorph', face: '{stun:0}', cls: 'mage', type: 'spell', rarity: 'epic', cost: 4, upCost: 3, vals: [4], upVals: [6], keywords: ['exhaust'], art: 'sheep', play: (c, v) => c.applyStatus('enemy', 'stun', 1, v[0]) },
  {
    id: 'blizzard', face: '{dmg:0}|{chill:1}', cls: 'mage', type: 'spell', rarity: 'epic', cost: 4, vals: [14, 6], upVals: [18, 8], dmg: [0], art: 'blizzard',
    play: (c, v) => {
      c.hit(v[0], { kind: 'ice' });
      c.applyStatus('enemy', 'chill', 1, v[1]);
    },
  },
  {
    id: 'evocation', face: '{maxmana:0}|{mana:1}', cls: 'mage', type: 'skill', rarity: 'epic', cost: 1, vals: [1, 2], upVals: [1, 4], keywords: ['exhaust'], art: 'evocation',
    play: (c, v) => {
      c.gainMaxMana(v[0]);
      c.gainMana(v[1]);
    },
  },

  // Legendary
  { id: 'pyroblast', face: '{dmg:0}', cls: 'mage', type: 'spell', rarity: 'legendary', cost: 6, upCost: 5, vals: [40], dmg: [0], art: 'pyro', play: (c, v) => void c.hit(v[0], { kind: 'fire' }) },
];
