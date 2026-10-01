import type { CardDef } from '../../game/types';

export const warriorCards: CardDef[] = [
  // Starters
  {
    id: 'punch',
    face: '{dmg:0}',
    cls: 'warrior',
    type: 'attack',
    rarity: 'starter',
    cost: 2,
    vals: [6],
    upVals: [9],
    art: 'punchCard',
    play: (c, v) => void c.hit(v[0]),
  },
  {
    id: 'hardHat',
    face: '{block:0}',
    cls: 'warrior',
    type: 'skill',
    rarity: 'starter',
    cost: 2,
    vals: [6],
    upVals: [9],
    art: 'hardHat',
    play: (c, v) => c.gainBlock('hero', v[0]),
  },
  {
    id: 'wrenchWhack',
    face: '{dmg:0}|{stun:1}',
    cls: 'warrior',
    type: 'attack',
    rarity: 'rare',
    cost: 4,
    upCost: 3,
    vals: [12, 5],
    upVals: [16, 10],
    art: 'hammer',
    play: (c, v) => {
      c.hit(v[0], { kind: 'blunt' });
      c.applyStatus('enemy', 'stun', 1, v[1]);
    },
  },

  // Commons
  {
    id: 'crowbar',
    face: '{dmg:0}',
    cls: 'warrior',
    type: 'attack',
    rarity: 'common',
    cost: 2,
    vals: [9],
    upVals: [12],
    art: 'crowbar',
    play: (c, v) => void c.hit(v[0]),
  },
  {
    id: 'palletWall',
    face: '{block:0}',
    cls: 'warrior',
    type: 'skill',
    rarity: 'common',
    cost: 4,
    vals: [20],
    upVals: [25],
    art: 'wall',
    play: (c, v) => c.gainBlock('hero', v[0]),
  },
  {
    id: 'shoulderCheck',
    face: '{dmg}={block}',
    cls: 'warrior',
    type: 'attack',
    rarity: 'common',
    cost: 2,
    upCost: 1,
    vals: [],
    art: 'shoulderCheck',
    play: (c) => void c.hit(c.hero.block, { kind: 'blunt' }),
  },
  {
    id: 'unionChant',
    face: '{mana:0}|{block:1}',
    cls: 'warrior',
    type: 'skill',
    rarity: 'common',
    cost: 0,
    vals: [2, 2],
    upVals: [3, 5],
    art: 'megaphone',
    play: (c, v) => {
      c.gainMana(v[0]);
      c.gainBlock('hero', v[1]);
    },
  },
  {
    id: 'sledgehammer',
    face: '{dmg:0}',
    cls: 'warrior',
    type: 'attack',
    rarity: 'common',
    cost: 4,
    vals: [20],
    upVals: [30],
    art: 'maul',
    play: (c, v) => void c.hit(v[0], { kind: 'blunt' }),
  },
  {
    id: 'doubleShift',
    face: '{hp:0}|{mana:1}',
    cls: 'warrior',
    type: 'skill',
    rarity: 'common',
    cost: 0,
    vals: [1, 3],
    upVals: [1, 4],
    art: 'doubleClock',
    play: (c, v) => {
      c.loseHp(v[0]);
      c.gainMana(v[1]);
    },
  },

  // Rares
  {
    id: 'pushback',
    face: '{block:0}|{parry:1}',
    cls: 'warrior',
    type: 'skill',
    rarity: 'rare',
    cost: 3,
    upCost: 2,
    vals: [4, 10, 3],
    upVals: [6, 15, 6],
    art: 'pushback',
    play: (c, v) => {
      c.gainBlock('hero', v[0]);
      c.applyStatus('hero', 'parry', v[1], v[2]);
    },
  },
  {
    id: 'picketDrums',
    face: '{str:0}',
    cls: 'warrior',
    type: 'power',
    rarity: 'epic',
    cost: 3,
    upCost: 2,
    vals: [2],
    upVals: [3],
    keywords: ['exhaust'],
    art: 'drum',
    play: (c, v) => c.applyStatus('hero', 'strength', v[0]),
  },
  {
    id: 'declareBankruptcy',
    face: '{dmg:0}×X',
    cls: 'warrior',
    type: 'attack',
    rarity: 'rare',
    cost: -1,
    vals: [4],
    upVals: [6],
    art: 'bankrupt',
    // X cost: the engine appends the mana spent as the last value.
    play: (c, v) => void c.hit(v[0], { hits: v[v.length - 1] }),
  },
  {
    id: 'lunchBreak',
    face: '{heal:0}|{block:1}',
    cls: 'warrior',
    type: 'skill',
    rarity: 'rare',
    cost: 3,
    vals: [12, 8],
    upVals: [16, 11],
    keywords: ['exhaust', 'pending'],
    art: 'sandwich',
    play: (c, v) => {
      c.heal('hero', v[0]);
      c.gainBlock('hero', v[1]);
    },
  },
  {
    id: 'stonks',
    face: '{dmg:0}|{grow:1}',
    cls: 'warrior',
    type: 'attack',
    rarity: 'epic',
    cost: 3,
    vals: [4, 2],
    upVals: [6, 3],
    art: 'stonks',
    play: (c, v, card) => {
      c.hit(v[0]);
      card.bonus += v[1];
    },
  },

  // Epics
  {
    id: 'employeeOfTheMonth',
    face: '{block:0}',
    cls: 'warrior',
    type: 'skill',
    rarity: 'legendary',
    cost: 5,
    upCost: 4,
    vals: [30],
    upVals: [40],
    keywords: ['exhaust', 'pending'],
    art: 'employeeOfTheMonth',
    play: (c, v) => c.gainBlock('hero', v[0]),
  },
  {
    id: 'justCause',
    face: '{dmg:0}|{?skull}{dmg:1}',
    cls: 'warrior',
    type: 'attack',
    rarity: 'epic',
    cost: 4,
    vals: [15, 30],
    upVals: [20, 40],
    art: 'execute',
    play: (c, v) => void c.hit(c.enemy.hp <= c.enemy.maxHp * 0.3 ? v[1] : v[0]),
  },
  {
    id: 'backPay',
    face: '{dmg:0}|{heal}',
    cls: 'warrior',
    type: 'attack',
    rarity: 'epic',
    cost: 4,
    vals: [14],
    upVals: [18],
    keywords: ['pending'],
    art: 'fang',
    play: (c, v) => {
      const dealt = c.hit(v[0]);
      c.heal('hero', dealt);
    },
  },

  // Archetype synergy: Block
  {
    id: 'grievance',
    face: '{dmg:0}|{?block}{dmg:1}',
    cls: 'warrior',
    type: 'attack',
    rarity: 'common',
    cost: 2,
    vals: [6, 12],
    upVals: [8, 18],
    art: 'grievance',
    play: (c, v) => void c.hit(c.hero.block > 0 ? v[1] : v[0]),
  },
  {
    id: 'safetyRegs',
    face: '{block:0}|{fort:1}',
    cls: 'warrior',
    type: 'skill',
    rarity: 'rare',
    cost: 3,
    vals: [8, 6],
    upVals: [12, 8],
    art: 'safetySign',
    play: (c, v) => {
      c.gainBlock('hero', v[0]);
      c.applyStatus('hero', 'fortified', 1, v[1]);
    },
  },
  {
    id: 'forklift',
    face: '{?block}{dmg:0}',
    // Raw damage from the power, not modified by Strength/Weak: no live preview.
    dmg: [],
    cls: 'warrior',
    type: 'power',
    rarity: 'epic',
    cost: 3,
    vals: [3],
    upVals: [5],
    art: 'forklift',
    play: (c, v) => c.applyStatus('hero', 'juggernaut', v[0]),
  },

  // Legendary
  {
    id: 'hydraulicPress',
    face: '{dmg:0}|{stun:1}',
    cls: 'warrior',
    type: 'attack',
    rarity: 'legendary',
    cost: 5,
    upCost: 5,
    vals: [20, 9],
    upVals: [30, 13],
    keywords: ['pending'],
    art: 'quake',
    play: (c, v) => {
      c.hit(v[0], { kind: 'blunt' });
      c.applyStatus('enemy', 'stun', 1, v[1]);
    },
  },

  // Workplace additions
  {
    id: 'heavyLifting',
    face: '{dmg:0}|{block:1}',
    cls: 'warrior',
    type: 'attack',
    rarity: 'common',
    cost: 3,
    vals: [8, 5],
    upVals: [11, 8],
    art: 'crate',
    play: (c, v) => {
      c.hit(v[0], { kind: 'blunt' });
      c.gainBlock('hero', v[1]);
    },
  },
  {
    id: 'hazardPay',
    face: '{hp:0}|{str:1}',
    cls: 'warrior',
    type: 'skill',
    rarity: 'legendary',
    cost: 1,
    vals: [5, 2],
    upVals: [4, 3],
    keywords: ['exhaust'],
    art: 'hazardCoin',
    play: (c, v) => {
      c.loseHp(v[0]);
      c.applyStatus('hero', 'strength', v[1]);
    },
  },

  // Sleeve card: a bonus while it waits there (one slot: a real choice)
  {
    id: 'toolBelt',
    face: '{block:0}|{?sleeve}{str:1}',
    cls: 'warrior',
    type: 'skill',
    rarity: 'legendary',
    cost: 1,
    vals: [4, 1],
    upVals: [8, 2],
    art: 'toolBelt',
    inSleeve: { bonusDamage: (_c, v, def) => (def?.type === 'attack' ? v[1] : 0) },
    play: (c, v) => c.gainBlock('hero', v[0]),
  },
  // Filling the class out: cheap Strength payoff, thorns, Block turned into damage, a Block engine and an X defence
  {
    id: 'releaseTheHounds',
    face: '{dmg:0}×{1}',
    cls: 'warrior',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    vals: [1, 4],
    upVals: [2, 4],
    art: 'releaseTheHounds',
    // Strength counts on every rivet.
    play: (c, v) => void c.hit(v[0], { hits: v[1] }),
  },
  {
    id: 'barbedWire',
    face: '{block:0}|{thorns:1}',
    cls: 'warrior',
    type: 'skill',
    rarity: 'rare',
    cost: 3,
    vals: [8, 2],
    upVals: [12, 3],
    art: 'barbedWire',
    play: (c, v) => {
      c.gainBlock('hero', v[0]);
      c.applyStatus('hero', 'thorns', v[1]);
    },
  },
  {
    id: 'blowOffSteam',
    face: '{dmg}={block}×{0}|{block}=0',
    cls: 'warrior',
    type: 'attack',
    rarity: 'epic',
    cost: 3,
    vals: [2],
    upVals: [3],
    art: 'blowOffSteam',
    play: (c, v) => void c.hit(c.spendBlock() * v[0], { kind: 'blunt' }),
  },
  {
    id: 'steelToes',
    face: '{?dmg}{block:0}',
    cls: 'warrior',
    type: 'power',
    rarity: 'epic',
    cost: 3,
    vals: [2],
    upVals: [3],
    art: 'steelToes',
    play: (c, v) => c.applyStatus('hero', 'steelToes', v[0]),
  },
  {
    id: 'overstock',
    face: '{block:0}×X',
    cls: 'warrior',
    type: 'skill',
    rarity: 'rare',
    cost: -1,
    vals: [4],
    upVals: [6],
    art: 'overstock',
    // X cost: the engine appends the mana spent as the last value.
    play: (c, v) => c.gainBlock('hero', v[0] * v[v.length - 1]),
  },
  // Pop culture
  {
    id: 'hideThePain',
    face: '{block:0}|+{block}/{1}{hp}',
    cls: 'warrior',
    type: 'skill',
    rarity: 'common',
    cost: 2,
    vals: [5, 4],
    upVals: [7, 3],
    art: 'harold',
    // The more it hurts, the wider the smile: +1 Block per v[1] HP missing.
    play: (c, v) => c.gainBlock('hero', v[0] + Math.floor((c.hero.maxHp - c.hero.hp) / v[1])),
  },
];
