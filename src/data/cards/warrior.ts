import type { CardDef } from '../../game/types';

/** Just Cause hits harder once the enemy is at or under this share of its max HP. */
export const JUST_CAUSE_HP = 0.3;

/** Hardship Case gives its bigger Block at or under this share of the hero's max HP. */
export const HARDSHIP_HP = 0.5;

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
    id: 'bobTheBuilder',
    face: '{block:0}',
    cls: 'warrior',
    type: 'defense',
    rarity: 'starter',
    cost: 2,
    vals: [6],
    upVals: [9],
    art: 'bobTheBuilder',
    play: (c, v) => c.gainBlock('hero', v[0]),
  },
  {
    id: 'wrenchWhack',
    face: '{dmg:0}|{stun:1}',
    cls: 'warrior',
    type: 'attack',
    rarity: 'rare',
    cost: 4,
    vals: [12, 5],
    upVals: [16, 8],
    art: 'wrenchWhack',
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
    id: 'wallStreet',
    face: '{block:0}',
    cls: 'warrior',
    type: 'defense',
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
    id: 'bellaCiao',
    face: '{mana:0}|{block:1}',
    cls: 'warrior',
    type: 'defense',
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
    rarity: 'rare',
    cost: 4,
    vals: [18],
    upVals: [28],
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
    id: 'youShallNotPass',
    face: '{block:0}|{parry:1}',
    cls: 'warrior',
    type: 'defense',
    rarity: 'rare',
    cost: 3,
    vals: [8, 15, 5],
    upVals: [12, 25, 8],
    art: 'youShallNotPass',
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
    id: 'secondBreakfast',
    face: '{heal:0}|{block:1}',
    cls: 'warrior',
    type: 'defense',
    rarity: 'epic',
    cost: 3,
    vals: [9, 8],
    upVals: [12, 11],
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
    upVals: [5, 3],
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
    type: 'defense',
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
    art: 'picketSign',
    play: (c, v) => void c.hit(c.enemy.hp <= c.enemy.maxHp * JUST_CAUSE_HP ? v[1] : v[0]),
  },
  {
    id: 'backPay',
    face: '{dmg:0}|{heal}',
    cls: 'warrior',
    type: 'attack',
    rarity: 'legendary',
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
    type: 'defense',
    rarity: 'rare',
    cost: 3,
    vals: [8, 10],
    upVals: [12, 14],
    art: 'safetySign',
    play: (c, v) => {
      c.gainBlock('hero', v[0]);
      c.applyStatus('hero', 'fortified', 1, v[1]);
    },
  },
  {
    id: 'forklift',
    face: '{*block}{dmg:0}',
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
    vals: [20, 6],
    upVals: [25, 9],
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
    art: 'liftingWorker',
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
    type: 'defense',
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
    type: 'defense',
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
    face: '{*dmg}{block:0}',
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
    type: 'defense',
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
    type: 'defense',
    rarity: 'common',
    cost: 2,
    vals: [5, 4],
    upVals: [7, 3],
    art: 'harold',
    // The more it hurts, the wider the smile: +1 Block per v[1] HP missing.
    play: (c, v) => c.gainBlock('hero', v[0] + Math.floor((c.hero.maxHp - c.hero.hp) / v[1])),
  },
  {
    id: 'masochist',
    face: '{thorns:0}|{tickUp:1}',
    cls: 'warrior',
    type: 'skill',
    rarity: 'rare',
    cost: 1,
    vals: [4, 3],
    upVals: [6, 3],
    art: 'masochist',
    // Pain makes you hard to hit: it also brings the enemy's next attack closer.
    play: (c, v) => {
      c.applyStatus('hero', 'thorns', v[0]);
      c.hurryEnemy(v[1]);
    },
  },
  {
    id: 'stopTheLine',
    face: '{block:0}|{stop:1}',
    cls: 'warrior',
    type: 'defense',
    rarity: 'rare',
    cost: 2,
    vals: [18, 3],
    upVals: [24, 3],
    art: 'stopTheLine',
    play: (c, v) => {
      c.gainBlock('hero', v[0]);
      c.applyStatus('hero', 'stalled', 1, v[1]);
    },
  },
  {
    id: 'hardshipCase',
    face: '{block:0}|{?hp}{block:1}',
    cls: 'warrior',
    type: 'defense',
    rarity: 'epic',
    cost: 2,
    vals: [8, 24],
    upVals: [10, 32],
    art: 'hardshipCase',
    play: (c, v) => c.gainBlock('hero', c.hero.hp <= c.hero.maxHp * HARDSHIP_HP ? v[1] : v[0]),
  },
  {
    id: 'indexFund',
    face: '{block:0}|{grow:1}',
    cls: 'warrior',
    type: 'defense',
    rarity: 'epic',
    cost: 3,
    vals: [5, 2],
    upVals: [6, 3],
    bonusIdx: 0,
    art: 'indexFund',
    play: (c, v, card) => {
      c.gainBlock('hero', v[0]);
      card.bonus += v[1];
    },
  },
  {
    id: 'braceForImpact',
    face: '{dmg:0}|{?bare}{dmg:1}',
    cls: 'warrior',
    type: 'attack',
    rarity: 'common',
    cost: 2,
    vals: [6, 16],
    upVals: [8, 22],
    art: 'braceForImpact',
    play: (c, v) => void c.hit(c.hero.block > 0 ? v[0] : v[1]),
  },
  {
    id: 'step1',
    face: '{addCard}Step 2',
    cls: 'warrior',
    type: 'skill',
    rarity: 'legendary',
    cost: 1,
    upCost: 0,
    vals: [],
    keywords: ['exhaust'],
    art: 'step1',
    play: (c, _v, card) => c.addTempCard('step2', 'draw', card.up),
  },
  // Generated during a fight (never offered as rewards).
  {
    id: 'step2',
    face: '{addCard}Step 3',
    cls: 'warrior',
    type: 'skill',
    rarity: 'special',
    cost: 2,
    upCost: 1,
    vals: [],
    keywords: ['exhaust'],
    art: 'step2',
    play: (c, _v, card) => c.addTempCard('step3', 'draw', card.up),
  },
  {
    id: 'step3',
    face: '{addCard}Step 4',
    cls: 'warrior',
    type: 'skill',
    rarity: 'special',
    cost: 3,
    upCost: 2,
    vals: [],
    keywords: ['exhaust'],
    art: 'step3',
    play: (c, _v, card) => c.addTempCard('step4', 'draw', card.up),
  },
  {
    id: 'step4',
    face: '{regen:0}|{thorns:1}|{block:2}',
    cls: 'warrior',
    type: 'skill',
    rarity: 'special',
    cost: 4,
    upCost: 3,
    vals: [8, 5, 20],
    upVals: [12, 7, 30],
    keywords: ['exhaust'],
    art: 'step4',
    play: (c, v) => {
      c.applyStatus('hero', 'regen', v[0]);
      c.applyStatus('hero', 'thorns', v[1]);
      c.gainBlock('hero', v[2]);
    },
  },
];
