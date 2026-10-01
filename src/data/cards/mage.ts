import type { CardDef } from '../../game/types';

export const mageCards: CardDef[] = [
  // Starters
  {
    id: 'clippy',
    face: '{dmg:0}',
    cls: 'mage',
    type: 'spell',
    rarity: 'starter',
    cost: 1,
    vals: [3],
    upVals: [5],
    art: 'clippy',
    play: (c, v) => void c.hit(v[0]),
  },
  {
    id: 'fireDoor',
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
    id: 'coldCall',
    face: '{dmg:0}|{chill:1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    vals: [4, 5],
    upVals: [6, 10],
    art: 'coldCall',
    play: (c, v) => {
      c.hit(v[0], { kind: 'ice' });
      c.applyStatus('enemy', 'chill', 1, v[1]);
    },
  },

  // Commons
  {
    id: 'slagBall',
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
    id: 'coldShoulder',
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
    id: 'caffeineJolt',
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
    id: 'staticShock',
    face: '{dmg:0}',
    cls: 'mage',
    type: 'spell',
    rarity: 'common',
    cost: 0,
    vals: [2],
    upVals: [4],
    art: 'plug',
    play: (c, v) => void c.hit(v[0], { kind: 'arcane' }),
  },
  {
    id: 'coldStorage',
    face: '{block:0}|{chill:1}',
    cls: 'mage',
    type: 'skill',
    rarity: 'common',
    cost: 3,
    vals: [10, 7],
    upVals: [14, 12],
    art: 'coldStorage',
    play: (c, v) => {
      c.gainBlock('hero', v[0]);
      c.applyStatus('enemy', 'chill', 1, v[1]);
    },
  },
  {
    id: 'burnout',
    face: '{burn:0}',
    cls: 'mage',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    vals: [2],
    upVals: [4],
    art: 'match',
    play: (c, v) => c.applyStatus('enemy', 'burn', v[0]),
  },

  // Rares
  {
    id: 'replyAll',
    face: '{dmg:0}×{1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'rare',
    cost: 4,
    vals: [4, 4],
    upVals: [5, 5],
    art: 'missiles',
    play: (c, v) => void c.hit(v[0], { hits: v[1] }),
  },
  {
    id: 'modernTimes',
    face: '{rush:0}',
    cls: 'mage',
    type: 'skill',
    rarity: 'rare',
    cost: 2,
    upCost: 1,
    vals: [6],
    upVals: [8],
    art: 'gears',
    play: (c, v) => c.rushBelt(v[0]),
  },
  {
    id: 'lookBusy',
    face: '{dodge:0}',
    cls: 'mage',
    type: 'skill',
    rarity: 'rare',
    cost: 2,
    upCost: 1,
    vals: [2],
    upVals: [3],
    keywords: ['exhaust'],
    art: 'papers',
    play: (c, v) => c.applyStatus('hero', 'dodge', 1, v[0]),
  },
  {
    id: 'meltdown',
    cat: 'attack',
    face: '{dmg}={burn}×{0}|{burn}=0',
    cls: 'mage',
    type: 'spell',
    rarity: 'rare',
    cost: 3,
    upCost: 2,
    vals: [3],
    upVals: [4],
    art: 'meltdown',
    play: (c, v) => {
      const burn = c.stacks('enemy', 'burn');
      c.removeStatus('enemy', 'burn');
      c.hit(burn * v[0], { kind: 'fire' });
    },
  },

  // Epics
  {
    id: 'metamorphosis',
    face: '{stun:0}',
    cls: 'mage',
    type: 'spell',
    rarity: 'legendary',
    cost: 4,
    upCost: 3,
    vals: [10],
    upVals: [16],
    keywords: ['pending'],
    art: 'beetle',
    play: (c, v) => c.applyStatus('enemy', 'stun', 1, v[0]),
  },
  {
    id: 'officeAC',
    face: '{dmg:0}|{chill:1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'epic',
    cost: 4,
    vals: [20, 12],
    upVals: [25, 18],
    art: 'blizzard',
    play: (c, v) => {
      c.hit(v[0], { kind: 'ice' });
      c.applyStatus('enemy', 'chill', 1, v[1]);
    },
  },
  {
    id: 'powerNap',
    face: '{crystal:0}|{mana:1}',
    cls: 'mage',
    type: 'skill',
    rarity: 'epic',
    cost: 2,
    minCost: 1,
    vals: [1, 3],
    upVals: [1, 4],
    keywords: ['exhaust'],
    art: 'powerNap',
    play: (c, v) => {
      c.addManaCrystals(v[0]);
      c.gainMana(v[1]);
    },
  },

  // Archetype synergy: Multitasking and Chill
  {
    id: 'busyHands',
    face: '{dmg:0}×{1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'rare',
    cost: 1,
    vals: [0, 3],
    upVals: [2, 3],
    art: 'keyboard',
    // Every hit gets the Multitasking bonus.
    play: (c, v) => void c.hit(v[0], { hits: v[1] }),
  },
  {
    id: 'echoChamber',
    face: '{dmg:0}×{1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'rare',
    cost: 2,
    vals: [2, 2],
    upVals: [3, 2],
    art: 'echo',
    play: (c, v) => void c.hit(v[0], { hits: v[1] }),
  },
  {
    id: 'blueScreen',
    face: '{dmg:0}|{?snow}{stun:1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'rare',
    cost: 3,
    vals: [8, 8],
    upVals: [13, 13],
    art: 'blueScreen',
    play: (c, v) => {
      const chilled = c.has('enemy', 'chill');
      c.hit(v[0], { kind: 'ice' });
      if (chilled) c.applyStatus('enemy', 'stun', 1, v[1]);
    },
  },

  // Legendary
  {
    id: 'blastFurnace',
    face: '{dmg:0}',
    cls: 'mage',
    type: 'spell',
    rarity: 'legendary',
    cost: 5,
    upCost: 4,
    vals: [35],
    keywords: ['pending'],
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
    vals: [2, 6],
    upVals: [4, 12],
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
    cost: 2,
    vals: [4, 2],
    upVals: [7, 4],
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

  // Sleeve card: every spell played while it waits there is cached into it
  {
    id: 'cache',
    face: '{dmg:0}|{?sleeve}{grow:1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'legendary',
    cost: 2,
    vals: [4, 1],
    upVals: [7, 2],
    art: 'floppy',
    inSleeve: {
      onCardPlayed: (_c, v, card, played) => {
        if (played.type === 'spell') card.bonus += v[1];
      },
    },
    play: (c, v, card) => {
      c.hit(v[0]);
      card.bonus = 0;
    },
  },
  // Pop culture: IT support
  {
    id: 'turnItOff',
    face: '{selfStun:0}|{addCard}',
    cls: 'mage',
    type: 'skill',
    rarity: 'rare',
    cost: 1,
    upCost: 0,
    vals: [3],
    keywords: ['exhaust'],
    art: 'powerOff',
    play: (c, v, card) => {
      c.applyStatus('hero', 'stun', 1, v[0]);
      c.addTempCard('turnItOn', 'draw', card.up);
    },
  },
  {
    id: 'sudo',
    face: '{sudo:0}|{rush:1}',
    cls: 'mage',
    type: 'skill',
    rarity: 'epic',
    cost: 2,
    upCost: 1,
    vals: [5, 5],
    upVals: [8, 8],
    art: 'rootKey',
    play: (c, v) => {
      c.applyStatus('hero', 'rootAccess', 1, v[0]);
      c.rushBelt(v[1]);
    },
  },
  // Filling the class out: Spell Power, a cheap ward, and a Burn + Chill payoff
  {
    id: 'continuingEducation',
    face: '{spell:0}',
    cls: 'mage',
    type: 'power',
    rarity: 'epic',
    cost: 3,
    vals: [2],
    upVals: [3],
    art: 'gradCap',
    play: (c, v) => c.applyStatus('hero', 'spellPower', v[0]),
  },
  {
    id: 'spamFilter',
    face: '{block:0}',
    cls: 'mage',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    vals: [5],
    upVals: [8],
    art: 'spamFilter',
    play: (c, v) => c.gainBlock('hero', v[0]),
  },
  {
    id: 'thermalShock',
    face: '{dmg:0}|{?snow+burn}{dmg:1}',
    cls: 'mage',
    type: 'spell',
    rarity: 'epic',
    cost: 3,
    vals: [8, 26],
    upVals: [11, 34],
    art: 'thermalShock',
    play: (c, v) => {
      const shock = c.has('enemy', 'chill') && c.has('enemy', 'burn');
      c.hit(shock ? v[1] : v[0]);
      // The glass cracks: the Chill is spent.
      if (shock) c.removeStatus('enemy', 'chill');
    },
  },
  // Generated during a fight (never offered as rewards).
  {
    id: 'turnItOn',
    face: '{mana:0}',
    cls: 'mage',
    type: 'skill',
    rarity: 'special',
    cost: 0,
    vals: [4],
    keywords: ['exhaust'],
    art: 'powerOn',
    play: (c, v) => c.gainMana(v[0]),
  },
];
