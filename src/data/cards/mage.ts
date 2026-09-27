import type { CardDef } from '../../game/types';

export const mageCards: CardDef[] = [
  // Starters
  {
    id: 'arcaneBolt',
    face: '{dmg:0}',
    cls: 'mage',
    type: 'spell',
    rarity: 'starter',
    cost: 2,
    vals: [7],
    upVals: [10],
    art: 'bolt',
    play: (c, v) => void c.hit(v[0]),
  },
  {
    id: 'ward',
    face: '{block:0}',
    cls: 'mage',
    type: 'skill',
    rarity: 'starter',
    cost: 2,
    vals: [8],
    upVals: [11],
    art: 'ward',
    play: (c, v) => c.gainBlock('hero', v[0]),
  },
  {
    id: 'frostbolt',
    face: '{dmg:0}|{chill:1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    vals: [4, 3],
    upVals: [6, 4],
    art: 'coldCall',
    play: (c, v) => {
      c.hit(v[0], { kind: 'ice' });
      c.applyStatus('enemy', 'chill', 1, v[1]);
    },
  },

  // Commons
  {
    id: 'fireball',
    face: '{dmg:0}|{burn:1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'common',
    cost: 4,
    vals: [14, 3],
    upVals: [18, 4],
    art: 'fireball',
    play: (c, v) => {
      c.hit(v[0], { kind: 'fire' });
      c.applyStatus('enemy', 'burn', v[1]);
    },
  },
  {
    id: 'iceLance',
    face: '{dmg:0}|{?snow}{dmg:1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'common',
    cost: 3,
    vals: [7, 16],
    upVals: [9, 20],
    art: 'iceLance',
    play: (c, v) => void c.hit(c.has('enemy', 'chill') ? v[1] : v[0], { kind: 'ice' }),
  },
  {
    id: 'manaSurge',
    face: '{mana:0}',
    cls: 'mage',
    type: 'skill',
    rarity: 'common',
    cost: 0,
    vals: [2],
    upVals: [3],
    art: 'coffeePot',
    play: (c, v) => c.gainMana(v[0]),
  },
  {
    id: 'spark',
    face: '{dmg:0}',
    cls: 'mage',
    type: 'spell',
    rarity: 'common',
    cost: 0,
    vals: [3],
    upVals: [5],
    art: 'plug',
    play: (c, v) => void c.hit(v[0], { kind: 'arcane' }),
  },
  {
    id: 'frostArmor',
    face: '{block:0}|{chill:1}',
    cls: 'mage',
    type: 'skill',
    rarity: 'common',
    cost: 3,
    vals: [10, 3],
    upVals: [13, 4],
    art: 'coldStorage',
    play: (c, v) => {
      c.gainBlock('hero', v[0]);
      c.applyStatus('enemy', 'chill', 1, v[1]);
    },
  },
  {
    id: 'ignite',
    face: '{burn:0}',
    cls: 'mage',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    vals: [6],
    upVals: [9],
    art: 'match',
    play: (c, v) => c.applyStatus('enemy', 'burn', v[0]),
  },

  // Rares
  {
    id: 'arcaneMissiles',
    face: '{dmg:0}×{1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'rare',
    cost: 4,
    vals: [3, 5],
    upVals: [3, 7],
    art: 'missiles',
    play: (c, v) => void c.hit(v[0], { hits: v[1] }),
  },
  {
    id: 'timeSlip',
    face: '{rush:0}',
    cls: 'mage',
    type: 'skill',
    rarity: 'rare',
    cost: 2,
    upCost: 1,
    vals: [6],
    upVals: [8],
    art: 'remote',
    play: (c, v) => c.rushBelt(v[0]),
  },
  {
    id: 'mirrorImage',
    face: '{dodge:0}',
    cls: 'mage',
    type: 'skill',
    rarity: 'rare',
    cost: 2,
    upCost: 1,
    vals: [1],
    keywords: ['exhaust'],
    art: 'papers',
    play: (c, v) => c.applyStatus('hero', 'dodge', v[0]),
  },
  {
    id: 'combustion',
    cat: 'attack',
    face: '{burn}×{0}',
    cls: 'mage',
    type: 'spell',
    rarity: 'rare',
    cost: 3,
    upCost: 2,
    vals: [2],
    upVals: [3],
    art: 'meltdown',
    play: (c, v) => {
      const burn = c.stacks('enemy', 'burn');
      c.removeStatus('enemy', 'burn');
      c.hit(burn * v[0], { kind: 'fire' });
    },
  },

  // Epics
  {
    id: 'polymorph',
    face: '{stun:0}',
    cls: 'mage',
    type: 'spell',
    rarity: 'epic',
    cost: 5,
    upCost: 4,
    vals: [4],
    upVals: [6],
    keywords: ['exhaust'],
    art: 'sheep',
    play: (c, v) => c.applyStatus('enemy', 'stun', 1, v[0]),
  },
  {
    id: 'blizzard',
    face: '{dmg:0}|{chill:1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'epic',
    cost: 5,
    vals: [14, 6],
    upVals: [18, 8],
    art: 'blizzard',
    play: (c, v) => {
      c.hit(v[0], { kind: 'ice' });
      c.applyStatus('enemy', 'chill', 1, v[1]);
    },
  },
  {
    id: 'evocation',
    face: '{crystal:0}|{mana:1}',
    cls: 'mage',
    type: 'skill',
    rarity: 'epic',
    cost: 1,
    vals: [1, 3],
    upVals: [1, 5],
    keywords: ['exhaust'],
    art: 'powerNap',
    play: (c, v) => {
      c.addManaCrystals(v[0]);
      c.gainMana(v[1]);
    },
  },

  // Unique (hero special, once per run)
  {
    id: 'meteor',
    face: '{dmg:0}|{burn:1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'unique',
    cost: 0,
    vals: [25, 5],
    keywords: ['unique'],
    art: 'boiler',
    play: (c, v) => {
      c.hit(v[0], { kind: 'fire' });
      c.applyStatus('enemy', 'burn', v[1]);
    },
  },

  // Archetype synergy: Spellweave and Chill
  {
    id: 'flurry',
    face: '{dmg:0}×{1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'common',
    cost: 0,
    vals: [2, 2],
    upVals: [3, 2],
    art: 'keyboard',
    // Every hit gets the Spellweave bonus.
    play: (c, v) => void c.hit(v[0], { hits: v[1] }),
  },
  {
    id: 'arcaneEcho',
    face: '{dmg:0}|{weave:1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'rare',
    cost: 2,
    vals: [4, 2],
    upVals: [6, 3],
    art: 'echo',
    play: (c, v) => void c.hit(v[0] + v[1] * c.stacks('hero', 'weave')),
  },
  {
    id: 'shatter',
    face: '{dmg:0}|{?snow}{stun:1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'rare',
    cost: 3,
    vals: [8, 2],
    upVals: [11, 3],
    art: 'glassPane',
    play: (c, v) => {
      const chilled = c.has('enemy', 'chill');
      c.hit(v[0], { kind: 'ice' });
      if (chilled) c.applyStatus('enemy', 'stun', 1, v[1]);
    },
  },

  // Legendary
  {
    id: 'pyroblast',
    face: '{dmg:0}',
    cls: 'mage',
    type: 'spell',
    rarity: 'legendary',
    cost: 7,
    upCost: 6,
    vals: [40],
    art: 'blastFurnace',
    play: (c, v) => void c.hit(v[0], { kind: 'fire' }),
  },

  // Workplace additions
  {
    id: 'thermostatWar',
    face: '{burn:0}|{chill:1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    vals: [4, 2],
    upVals: [6, 3],
    art: 'thermostat',
    play: (c, v) => {
      c.applyStatus('enemy', 'burn', v[0]);
      c.applyStatus('enemy', 'chill', 1, v[1]);
    },
  },
  {
    id: 'sprintPlanning',
    face: '{rush:0}|{mana:1}',
    cls: 'mage',
    type: 'skill',
    rarity: 'rare',
    cost: 1,
    vals: [4, 2],
    upVals: [5, 3],
    art: 'kanban',
    play: (c, v) => {
      c.rushBelt(v[0]);
      c.gainMana(v[1]);
    },
  },
  {
    id: 'firewall',
    face: '{block:0}|{burn:1}',
    cls: 'mage',
    type: 'skill',
    rarity: 'epic',
    cost: 3,
    vals: [12, 4],
    upVals: [16, 6],
    art: 'fireWall',
    play: (c, v) => {
      c.gainBlock('hero', v[0]);
      c.applyStatus('enemy', 'burn', v[1]);
    },
  },
];
