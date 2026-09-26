import type { CardDef } from '../../game/types';

export const warriorCards: CardDef[] = [
  // Starters
  { id: 'strike', face: '{dmg:0}', cls: 'warrior', type: 'attack', rarity: 'starter', cost: 1, vals: [6], upVals: [9], dmg: [0], art: 'sword', play: (c, v) => void c.hit(v[0]) },
  { id: 'defend', face: '{block:0}', cls: 'warrior', type: 'skill', rarity: 'starter', cost: 1, vals: [6], upVals: [9], art: 'shield', play: (c, v) => c.gainBlock('hero', v[0]) },
  {
    id: 'bash', face: '{dmg:0}|{stun:1}', cls: 'warrior', type: 'attack', rarity: 'starter', cost: 3, upCost: 2, vals: [11, 2], upVals: [14, 2.5], dmg: [0], art: 'hammer',
    play: (c, v) => {
      c.hit(v[0], { kind: 'blunt' });
      c.applyStatus('enemy', 'stun', 1, v[1]);
    },
  },

  // Commons
  { id: 'cleave', face: '{dmg:0}', cls: 'warrior', type: 'attack', rarity: 'common', cost: 1, vals: [9], upVals: [12], dmg: [0], art: 'axe', play: (c, v) => void c.hit(v[0]) },
  { id: 'ironWall', face: '{block:0}', cls: 'warrior', type: 'skill', rarity: 'common', cost: 3, vals: [18], upVals: [24], art: 'wall', play: (c, v) => c.gainBlock('hero', v[0]) },
  {
    id: 'shieldBash', face: '{dmg}={block}', cls: 'warrior', type: 'attack', rarity: 'common', cost: 1, upCost: 0, vals: [], art: 'shieldBash',
    play: (c) => void c.hit(c.hero.block, { kind: 'blunt' }),
  },
  {
    id: 'battleCry', face: '{mana:0}|{rage:1}', cls: 'warrior', type: 'skill', rarity: 'common', cost: 0, vals: [1, 3], upVals: [2, 3], art: 'horn',
    play: (c, v) => {
      c.gainMana(v[0]);
      c.addResource(v[1]);
    },
  },
  { id: 'heavyBlow', face: '{dmg:0}', cls: 'warrior', type: 'attack', rarity: 'common', cost: 3, vals: [20], upVals: [26], dmg: [0], art: 'maul', play: (c, v) => void c.hit(v[0], { kind: 'blunt' }) },
  {
    id: 'bloodletting', face: '{hp:0}|{mana:1}', cls: 'warrior', type: 'skill', rarity: 'common', cost: 0, vals: [3, 2], upVals: [3, 3], art: 'blood',
    play: (c, v) => {
      c.loseHp(v[0]);
      c.gainMana(v[1]);
    },
  },

  // Rares
  {
    id: 'parry', face: '{block:0}|{parry:1}', cls: 'warrior', type: 'skill', rarity: 'rare', cost: 2, upCost: 1, vals: [4, 10], upVals: [6, 15], art: 'crossed',
    play: (c, v) => {
      c.gainBlock('hero', v[0]);
      c.applyStatus('hero', 'parry', v[1], 2.5);
    },
  },
  { id: 'warDrums', face: '{str:0}', cls: 'warrior', type: 'power', rarity: 'rare', cost: 2, upCost: 1, vals: [2], upVals: [3], art: 'drum', play: (c, v) => c.applyStatus('hero', 'strength', v[0]) },
  {
    id: 'whirlwind', face: '{dmg:0}×X', cls: 'warrior', type: 'attack', rarity: 'rare', cost: -1, vals: [5], upVals: [7], dmg: [0], art: 'whirl',
    // X cost: the engine appends the mana spent as the last value.
    play: (c, v) => void c.hit(v[0], { hits: v[v.length - 1] }),
  },
  {
    id: 'secondWind', face: '{heal:0}|{block:1}', cls: 'warrior', type: 'skill', rarity: 'rare', cost: 2, vals: [8, 8], upVals: [11, 11], keywords: ['exhaust'], art: 'heart',
    play: (c, v) => {
      c.heal('hero', v[0]);
      c.gainBlock('hero', v[1]);
    },
  },
  {
    id: 'rampage', face: '{dmg:0}|{grow:1}', cls: 'warrior', type: 'attack', rarity: 'rare', cost: 1, vals: [7, 4], upVals: [8, 6], dmg: [0], art: 'rampage',
    play: (c, v, card) => {
      c.hit(v[0]);
      card.bonus += v[1];
    },
  },

  // Epics
  { id: 'unbreakable', face: '{block:0}', cls: 'warrior', type: 'skill', rarity: 'epic', cost: 4, upCost: 3, vals: [30], upVals: [40], keywords: ['exhaust'], art: 'fortress', play: (c, v) => c.gainBlock('hero', v[0]) },
  {
    id: 'execute', face: '{dmg:0}|{skull}{dmg:1}', cls: 'warrior', type: 'attack', rarity: 'epic', cost: 3, vals: [12, 32], upVals: [16, 42], dmg: [0, 1], art: 'execute',
    play: (c, v) => void c.hit(c.enemy.hp <= c.enemy.maxHp * 0.3 ? v[1] : v[0]),
  },
  {
    id: 'bloodthirst', face: '{dmg:0}|{heal}', cls: 'warrior', type: 'attack', rarity: 'epic', cost: 3, vals: [14], upVals: [18], dmg: [0], art: 'fang',
    play: (c, v) => {
      const dealt = c.hit(v[0]);
      c.heal('hero', dealt);
    },
  },

  // Unique (hero special, once per run)
  {
    id: 'lastStand', cat: 'defense', face: '{block:0}|{str:1}', cls: 'warrior', type: 'skill', rarity: 'unique', cost: 0, vals: [20, 3], keywords: ['unique'], art: 'fortress',
    play: (c, v) => {
      c.gainBlock('hero', v[0]);
      c.applyStatus('hero', 'strength', v[1]);
    },
  },

  // Legendary
  {
    id: 'earthshaker', face: '{dmg:0}|{stun:1}', cls: 'warrior', type: 'attack', rarity: 'legendary', cost: 5, upCost: 4, vals: [24, 3], upVals: [30, 4], dmg: [0], art: 'quake',
    play: (c, v) => {
      c.hit(v[0], { kind: 'blunt' });
      c.applyStatus('enemy', 'stun', 1, v[1]);
    },
  },
];
