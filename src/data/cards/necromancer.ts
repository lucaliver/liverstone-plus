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
    vals: [5],
    upVals: [8],
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
    vals: [6],
    upVals: [9],
    art: 'tomb',
    play: (c, v) => c.gainBlock('hero', v[0]),
  },
  {
    id: 'toxicDart',
    face: '{dmg:0}|{poison:1}',
    cls: 'necromancer',
    type: 'attack',
    rarity: 'starter',
    cost: 2,
    vals: [3, 3],
    upVals: [4, 5],
    art: 'dagger',
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
    art: 'fang',
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
    vals: [6],
    upVals: [9],
    art: 'drop',
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
    art: 'fang',
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
    art: 'crack',
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
    art: 'smoke',
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
    art: 'wall',
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
    art: 'combust',
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
    art: 'whirl',
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
    art: 'execute',
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
    art: 'skull',
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
    art: 'broken',
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
    art: 'thorns',
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
    vals: [15, 12],
    keywords: ['unique'],
    art: 'tomb',
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
    art: 'drop',
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
    art: 'fang',
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
    keywords: ['exhaust'],
    art: 'skull',
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
    art: 'leaf',
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
    art: 'blood',
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
    art: 'tomb',
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
    art: 'bone',
    play: (c, v) => {
      c.applyStatus('enemy', 'poison', v[0]);
      c.gainBlock('hero', v[1]);
    },
  },
];
