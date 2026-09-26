import type { CardDef } from '../../game/types';

export const neutralCards: CardDef[] = [
  // Mana growth: add empty crystals (they fill up over time). Once per fight.
  { id: 'manaShard', face: '{crystal:0}', cls: 'neutral', type: 'skill', rarity: 'common', cost: 0, vals: [1], upVals: [2], keywords: ['exhaust', 'innate'], art: 'crystal', play: (c, v) => c.addManaCrystals(v[0]) },
  {
    id: 'manaGeode', face: '{crystal:0}', cls: 'neutral', type: 'skill', rarity: 'common', cost: 1, vals: [2], upVals: [3], keywords: ['exhaust', 'innate'], art: 'evocation',
    play: (c, v) => c.addManaCrystals(v[0]),
  },
  { id: 'healingPotion', face: '{heal:0}', cls: 'neutral', type: 'potion', rarity: 'common', cost: 0, vals: [12], upVals: [18], keywords: ['consume'], art: 'potionRed', play: (c, v) => void c.heal('hero', v[0]) },
  { id: 'fireFlask', face: '{dmg:0}', cls: 'neutral', type: 'potion', rarity: 'common', cost: 0, vals: [15], upVals: [22], dmg: [0], keywords: ['consume'], art: 'potionOrange', play: (c, v) => void c.hit(v[0], { kind: 'fire' }) },
  { id: 'bandage', face: '{heal:0}', cls: 'neutral', type: 'skill', rarity: 'common', cost: 1, vals: [6], upVals: [9], keywords: ['exhaust'], art: 'bandage', play: (c, v) => void c.heal('hero', v[0]) },
  { id: 'daggerThrow', face: '{dmg:0}', cls: 'neutral', type: 'attack', rarity: 'common', cost: 0, vals: [4], upVals: [6], dmg: [0], keywords: ['fleeting'], art: 'dagger', play: (c, v) => void c.hit(v[0]) },
  { id: 'smokeBomb', face: '{stun:0}', cls: 'neutral', type: 'skill', rarity: 'rare', cost: 2, upCost: 1, vals: [2], upVals: [3], art: 'smoke', play: (c, v) => c.applyStatus('enemy', 'stun', 1, v[0]) },
  { id: 'manaPotion', face: '{mana:0}', cls: 'neutral', type: 'potion', rarity: 'rare', cost: 2, upCost: 1, vals: [4], upVals: [6], keywords: ['consume'], art: 'potionBlue', play: (c, v) => c.gainMana(v[0]) },
];

/** Cards enemies shuffle into your piles. They exist only for the current fight. */
export const curseCards: CardDef[] = [
  { id: 'slime', face: '{clog}', cls: 'curse', type: 'curse', rarity: 'special', cost: 1, vals: [], keywords: ['exhaust'], art: 'slime', play: () => {} },
  {
    id: 'hex', face: '{exit}{hp:0}', cls: 'curse', type: 'curse', rarity: 'special', cost: 1, vals: [4], keywords: ['exhaust', 'volatile'], art: 'hex',
    play: () => {},
    onExpire: (c, v) => c.loseHp(v[0]),
  },
  {
    id: 'bomb', face: '{exit}{boom:0}', cls: 'curse', type: 'curse', rarity: 'special', cost: 2, vals: [10], keywords: ['exhaust', 'volatile'], art: 'bomb',
    play: () => {},
    // Explodes at the end of the belt. Block absorbs it.
    onExpire: (c, v) => void c.damage('enemy', 'hero', v[0], { raw: true, kind: 'fire' }, 'dot'),
  },
  {
    id: 'leech', face: '{exit}{drain:0}', cls: 'curse', type: 'curse', rarity: 'special', cost: 1, vals: [2], keywords: ['exhaust', 'volatile'], art: 'fang',
    play: () => {},
    onExpire: (c, v) => c.drainMana(v[0]),
  },
  {
    id: 'toxin', face: '{exit}{poison:0}', cls: 'curse', type: 'curse', rarity: 'special', cost: 1, vals: [4], keywords: ['exhaust', 'volatile'], art: 'drop',
    play: () => {},
    onExpire: (c, v) => c.applyStatus('hero', 'poison', v[0]),
  },
];
