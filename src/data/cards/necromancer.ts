import type { CardDef } from '../../game/types';

/** The Necromancer rots enemies away: Poison, weakening curses and life drain. */
export const necromancerCards: CardDef[] = [
  // Starters
  {
    id: 'skeletonCrew',
    face: '{dmg:0}',
    cls: 'necromancer',
    type: 'attack',
    rarity: 'starter',
    cost: 2,
    vals: [6],
    upVals: [9],
    art: 'bone',
    play: (c, v) => void c.hit(v[0]),
  },
  {
    id: 'solidarity',
    face: '{block:0}',
    cls: 'necromancer',
    type: 'skill',
    rarity: 'starter',
    cost: 2,
    vals: [7],
    upVals: [10],
    art: 'tomb',
    play: (c, v) => c.gainBlock('hero', v[0]),
  },
  {
    id: 'toxicMemo',
    face: '{dmg:0}|{poison:1}',
    cls: 'necromancer',
    type: 'attack',
    rarity: 'starter',
    cost: 3,
    vals: [2, 4],
    upVals: [3, 6],
    art: 'toxicMemo',
    play: (c, v) => {
      c.hit(v[0]);
      c.applyStatus('enemy', 'poison', v[1]);
    },
  },
  {
    id: 'bloodMoney',
    face: '{dmg:0}|{heal:1}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    vals: [4, 3],
    upVals: [6, 4],
    art: 'bloodMoney',
    play: (c, v) => {
      c.hit(v[0], { kind: 'arcane' });
      c.heal('hero', v[1]);
    },
  },

  // Commons
  {
    id: 'rust',
    face: '{poison:0}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    vals: [3],
    upVals: [6],
    art: 'nail',
    play: (c, v) => c.applyStatus('enemy', 'poison', v[0]),
  },
  {
    id: 'zombieShift',
    face: '{dmg:0}|{heal:1}',
    cls: 'necromancer',
    type: 'attack',
    rarity: 'common',
    cost: 0,
    vals: [3, 1],
    upVals: [5, 2],
    art: 'zombieHand',
    play: (c, v) => {
      c.hit(v[0]);
      c.heal('hero', v[1]);
    },
  },
  {
    id: 'whistleblow',
    face: '{stun:0}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    vals: [3],
    upVals: [5],
    art: 'whistle',
    // Buys time: the enemy stands still while the Poison keeps ticking.
    play: (c, v) => c.applyStatus('enemy', 'stun', 1, v[0]),
  },
  {
    id: 'smokestack',
    face: '{poison:0}|{weak:1}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    vals: [2, 4],
    upVals: [4, 6],
    art: 'smokestack',
    play: (c, v) => {
      c.applyStatus('enemy', 'poison', v[0]);
      c.applyStatus('enemy', 'weak', 1, v[1]);
    },
  },
  {
    id: 'barricade',
    face: '{block:0}',
    cls: 'necromancer',
    type: 'skill',
    rarity: 'common',
    cost: 3,
    vals: [12],
    upVals: [16],
    art: 'barricade',
    play: (c, v) => c.gainBlock('hero', v[0]),
  },
  {
    id: 'toxicLeak',
    cat: 'attack',
    face: '{poison}×{0}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'common',
    cost: 5,
    vals: [2],
    upVals: [3],
    art: 'pipeLeak',
    play: (c, v) => void c.hit(c.stacks('enemy', 'poison') * v[0], { kind: 'poison' }),
  },

  // Rares
  {
    id: 'deadLetter',
    face: '{dmg:0}|{?poison}{dmg:1}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'rare',
    cost: 3,
    vals: [10, 18],
    upVals: [14, 24],
    art: 'envelope',
    play: (c, v) => void c.hit(c.has('enemy', 'poison') ? v[1] : v[0], { kind: 'arcane' }),
  },
  {
    id: 'sickLeave',
    face: '{dmg:0}|{poison:1}',
    cls: 'necromancer',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    vals: [4, 2],
    upVals: [8, 4],
    art: 'pillBottle',
    play: (c, v) => {
      c.hit(v[0]);
      c.applyStatus('enemy', 'poison', v[1]);
    },
  },
  {
    id: 'sabotage',
    face: '{dmg}{poison:0}',
    cls: 'necromancer',
    type: 'power',
    rarity: 'rare',
    cost: 4,
    upCost: 3,
    vals: [2],
    upVals: [3],
    art: 'sabot',
    play: (c, v) => c.applyStatus('hero', 'plague', v[0]),
  },
  {
    id: 'slowdown',
    face: '{weak:0}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'rare',
    cost: 2,
    upCost: 1,
    vals: [15],
    upVals: [20],
    art: 'snail',
    play: (c, v) => c.applyStatus('enemy', 'weak', 1, v[0]),
  },

  // Epics
  {
    id: 'walkout',
    face: '{poison}×2',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'epic',
    cost: 6,
    upCost: 5,
    vals: [],
    keywords: ['exhaust'],
    art: 'walkout',
    play: (c) => c.applyStatus('enemy', 'poison', c.stacks('enemy', 'poison')),
  },
  {
    id: 'classStruggle',
    face: '{poison}+{0}',
    cls: 'necromancer',
    type: 'power',
    rarity: 'epic',
    cost: 4,
    upCost: 3,
    vals: [2],
    art: 'crown',
    play: (c, v) => c.applyStatus('hero', 'virulence', v[0]),
  },

  // Archetype synergy: Poison
  {
    id: 'wordOfMouth',
    face: '{poison:0}|{?poison}{poison:1}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'common',
    cost: 3,
    vals: [2, 5],
    upVals: [4, 7],
    art: 'speech',
    play: (c, v) => c.applyStatus('enemy', 'poison', c.has('enemy', 'poison') ? v[1] : v[0]),
  },
  {
    id: 'mealVoucher',
    cat: 'defense',
    face: '{heal}={poison}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'rare',
    cost: 3,
    upCost: 2,
    vals: [],
    keywords: ['exhaust'],
    art: 'mealVoucher',
    play: (c) => void c.heal('hero', c.stacks('enemy', 'poison')),
  },

  // Legendary
  {
    id: 'blackFriday',
    face: '{poison:0}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'legendary',
    cost: 5,
    vals: [14],
    upVals: [18],
    keywords: ['exhaust', 'pending'],
    art: 'cart',
    play: (c, v) => c.applyStatus('enemy', 'poison', v[0]),
  },

  // Workplace additions
  {
    id: 'toxicPositivity',
    face: '{weak:0}|{heal:1}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    vals: [3, 4],
    upVals: [4, 6],
    art: 'smiley',
    play: (c, v) => {
      c.applyStatus('enemy', 'weak', 1, v[0]);
      c.heal('hero', v[1]);
    },
  },
  {
    id: 'unionDues',
    face: '{hp:0}|{mana:1}',
    cls: 'necromancer',
    type: 'skill',
    rarity: 'common',
    cost: 0,
    vals: [2, 2],
    upVals: [2, 3],
    art: 'unionCard',
    play: (c, v) => {
      c.loseHp(v[0]);
      c.gainMana(v[1]);
    },
  },
  {
    id: 'deadWeight',
    face: '{dmg:0}|{vuln:1}',
    cls: 'necromancer',
    type: 'attack',
    rarity: 'rare',
    cost: 3,
    vals: [12, 12],
    upVals: [18, 18],
    art: 'kettlebell',
    play: (c, v) => {
      c.hit(v[0]);
      c.applyStatus('enemy', 'vulnerable', 1, v[1]);
    },
  },
  {
    id: 'nightShift',
    face: '{poison:0}|{block:1}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'epic',
    cost: 4,
    vals: [6, 8],
    upVals: [8, 10],
    art: 'moon',
    play: (c, v) => {
      c.applyStatus('enemy', 'poison', v[0]);
      c.gainBlock('hero', v[1]);
    },
  },
  // Sleeve card: while it waits there, every hit you take goes in the book (Poison on the enemy)
  {
    id: 'burnBook',
    face: '{poison:0}|{?sleeve}{poison:1}',
    cls: 'necromancer',
    type: 'skill',
    rarity: 'rare',
    cost: 4,
    vals: [3, 1],
    upVals: [5, 2],
    art: 'burnBook',
    inSleeve: { onHeroHit: (c, v) => c.applyStatus('enemy', 'poison', v[1]) },
    play: (c, v) => c.applyStatus('enemy', 'poison', v[0]),
  },
];
