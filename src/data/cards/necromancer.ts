import type { CardDef } from '../../game/types';

/** The Necromancer rots enemies away: Poison, weakening curses and life drain. */
export const necromancerCards: CardDef[] = [
  // Starters
  {
    id: 'boneSpike',
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
    id: 'graveWard',
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
    id: 'toxicDart',
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
    id: 'drainLife',
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
    id: 'rot',
    face: '{poison:0}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    vals: [7],
    upVals: [10],
    art: 'nail',
    play: (c, v) => c.applyStatus('enemy', 'poison', v[0]),
  },
  {
    id: 'ghoulBite',
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
    id: 'frailty',
    face: '{vuln:0}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    vals: [5],
    upVals: [8],
    art: 'whistle',
    play: (c, v) => c.applyStatus('enemy', 'vulnerable', 1, v[0]),
  },
  {
    id: 'noxiousCloud',
    face: '{poison:0}|{weak:1}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    vals: [4, 3],
    upVals: [6, 4],
    art: 'smokestack',
    play: (c, v) => {
      c.applyStatus('enemy', 'poison', v[0]);
      c.applyStatus('enemy', 'weak', 1, v[1]);
    },
  },
  {
    id: 'boneWall',
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
    id: 'blightBurst',
    cat: 'attack',
    face: '{poison}×{0}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'common',
    cost: 3,
    vals: [1],
    upVals: [2],
    art: 'pipeLeak',
    play: (c, v) => void c.hit(c.stacks('enemy', 'poison') * v[0], { kind: 'poison' }),
  },

  // Rares
  {
    id: 'deathCoil',
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
    id: 'festeringStrike',
    face: '{dmg:0}|{poison:1}',
    cls: 'necromancer',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    vals: [6, 4],
    upVals: [8, 6],
    art: 'pillBottle',
    play: (c, v) => {
      c.hit(v[0]);
      c.applyStatus('enemy', 'poison', v[1]);
    },
  },
  {
    id: 'plague',
    face: '{dmg}{poison:0}',
    cls: 'necromancer',
    type: 'power',
    rarity: 'rare',
    cost: 3,
    upCost: 2,
    vals: [2],
    upVals: [3],
    art: 'sabot',
    play: (c, v) => c.applyStatus('hero', 'plague', v[0]),
  },
  {
    id: 'wither',
    face: '{weak:0}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'rare',
    cost: 2,
    upCost: 1,
    vals: [6],
    art: 'snail',
    play: (c, v) => c.applyStatus('enemy', 'weak', 1, v[0]),
  },

  // Epics
  {
    id: 'epidemic',
    face: '{poison}×2',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'epic',
    cost: 3,
    upCost: 2,
    vals: [],
    keywords: ['exhaust'],
    art: 'walkout',
    play: (c) => c.applyStatus('enemy', 'poison', c.stacks('enemy', 'poison')),
  },
  {
    id: 'virulentForm',
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

  // Unique (hero special, once per run)
  {
    id: 'deathsDoor',
    cat: 'defense',
    face: '{heal:0}|{poison:1}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'unique',
    cost: 0,
    vals: [10, 10],
    keywords: ['unique'],
    art: 'cat',
    play: (c, v) => {
      c.heal('hero', v[0]);
      c.applyStatus('enemy', 'poison', v[1]);
    },
  },

  // Archetype synergy: Poison
  {
    id: 'contagion',
    face: '{poison:0}|{?poison}{poison:1}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    vals: [3, 7],
    upVals: [4, 10],
    art: 'speech',
    play: (c, v) => c.applyStatus('enemy', 'poison', c.has('enemy', 'poison') ? v[1] : v[0]),
  },
  {
    id: 'siphonRot',
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
    id: 'blackDeath',
    face: '{poison:0}',
    cls: 'necromancer',
    type: 'spell',
    rarity: 'legendary',
    cost: 5,
    vals: [20],
    upVals: [28],
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
    vals: [10, 3],
    upVals: [14, 4],
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
    vals: [8, 8],
    upVals: [11, 11],
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
    cost: 2,
    vals: [4, 2],
    upVals: [6, 3],
    art: 'burnBook',
    inSleeve: { onHeroHit: (c, v) => c.applyStatus('enemy', 'poison', v[1]) },
    play: (c, v) => c.applyStatus('enemy', 'poison', v[0]),
  },
];
