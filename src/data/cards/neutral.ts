import type { CardDef } from '../../game/types';

export const neutralCards: CardDef[] = [
  { id: 'healingPotion', face: '{heal:0}', cls: 'neutral', type: 'potion', rarity: 'common', cost: 0, vals: [12], upVals: [18], keywords: ['consume'], art: 'potionRed', play: (c, v) => void c.heal('hero', v[0]) },
  { id: 'fireFlask', face: '{dmg:0}', cls: 'neutral', type: 'potion', rarity: 'common', cost: 0, vals: [15], upVals: [22], dmg: [0], keywords: ['consume'], art: 'potionOrange', play: (c, v) => void c.hit(v[0], { kind: 'fire' }) },
  { id: 'bandage', face: '{heal:0}', cls: 'neutral', type: 'skill', rarity: 'common', cost: 1, vals: [6], upVals: [9], keywords: ['exhaust'], art: 'bandage', play: (c, v) => void c.heal('hero', v[0]) },
  { id: 'daggerThrow', face: '{dmg:0}', cls: 'neutral', type: 'attack', rarity: 'common', cost: 0, vals: [4], upVals: [6], dmg: [0], keywords: ['fleeting'], art: 'dagger', play: (c, v) => void c.hit(v[0]) },
  {
    id: 'adrenaline', face: '{draw:0}|{mana:1}', cls: 'neutral', type: 'skill', rarity: 'rare', cost: 1, upCost: 0, vals: [2, 1], upVals: [3, 1], keywords: ['exhaust'], art: 'adrenaline',
    play: (c, v) => {
      c.drawCards(v[0]);
      c.gainMana(v[1]);
    },
  },
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
];
