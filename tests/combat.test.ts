import { describe, expect, it } from 'vitest';
import { Combat, type CombatSetup } from '../src/game/combat';
import { CONFIG, EXPIRE_POS } from '../src/data/config';
import { ENEMIES } from '../src/data/enemies';
import { HEROES } from '../src/data/heroes';
import { CARD_LIST } from '../src/data/cards';
import type { CardInst } from '../src/game/types';

const deckOf = (ids: string[]): CardInst[] => ids.map((id, i) => ({ uid: i + 1, id, up: false }));

function setup(over: Partial<CombatSetup> = {}): Combat {
  return new Combat({
    hero: HEROES.warrior,
    hp: 80,
    maxHp: 80,
    deck: deckOf(HEROES.warrior.startDeck),
    relics: [],
    relicFlags: {},
    enemy: ENEMIES.skeleton,
    scale: { hp: 1, dmg: 1 },
    seed: 42,
    ...over,
  });
}

const run = (c: Combat, seconds: number): void => {
  for (let t = 0; t < seconds; t += 1 / 60) c.tick(1 / 60);
};

describe('combat engine', () => {
  it('prewarms the belt and waits for the intro', () => {
    const c = setup();
    expect(c.belt.length).toBe(2);
    c.tick(CONFIG.introTime / 2);
    expect(c.time).toBe(0);
  });

  it('regenerates mana up to the cap', () => {
    const c = setup();
    run(c, CONFIG.introTime + 30);
    expect(c.hero.mana).toBe(c.hero.maxMana);
  });

  it('plays a card: spends mana, deals damage, discards it', () => {
    const c = setup({ deck: deckOf(['strike', 'strike']) });
    run(c, CONFIG.introTime + 0.01);
    const card = c.belt[0].card;
    const hp = c.enemy.hp;
    expect(c.playCard(card.uid)).toBe(true);
    expect(c.enemy.hp).toBe(hp - 6);
    expect(c.hero.mana).toBe(CONFIG.startMana - 1);
    expect(c.discard.map((x) => x.uid)).toContain(card.uid);
  });

  it('refuses unaffordable cards', () => {
    const c = setup({ deck: deckOf(['earthshaker', 'earthshaker']) });
    run(c, CONFIG.introTime + 0.01);
    expect(c.playCard(c.belt[0].card.uid)).toBe(false);
    expect(c.belt.length).toBe(2);
  });

  it('expires cards off the left edge and reshuffles the discard pile', () => {
    const c = setup({ deck: deckOf(['strike', 'defend', 'bash']) });
    let reshuffled = false;
    c.events.on((e) => {
      if (e.type === 'reshuffle') reshuffled = true;
    });
    run(c, CONFIG.introTime + CONFIG.beltTime * EXPIRE_POS + 3);
    expect(reshuffled).toBe(true);
  });

  it('block absorbs damage and decays over time', () => {
    const c = setup();
    run(c, CONFIG.introTime + 0.01);
    c.gainBlock('hero', 10);
    c.damage('enemy', 'hero', 6, {}, 'enemy');
    expect(c.hero.block).toBe(4);
    expect(c.hero.hp).toBe(80);
    run(c, 10);
    expect(c.hero.block).toBe(0);
  });

  it('stun pauses the enemy timer, chill halves it', () => {
    const c = setup();
    run(c, CONFIG.introTime + 0.01);
    c.applyStatus('enemy', 'stun', 1, 2);
    const t0 = c.enemy.timer;
    run(c, 1);
    expect(c.enemy.timer).toBeCloseTo(t0, 5);
    run(c, 1.1);
    c.applyStatus('enemy', 'chill', 1, 5);
    const t1 = c.enemy.timer;
    run(c, 1);
    expect(c.enemy.timer - t1).toBeCloseTo(0.5, 1);
  });

  it('stashes cards in the sleeve and swaps when the slot is taken', () => {
    const c = setup();
    run(c, CONFIG.introTime + 0.01);
    const [a, b] = c.belt.map((x) => x.card);
    expect(c.stash(a.uid, 0)).toBe(true);
    expect(c.sleeve[0]?.uid).toBe(a.uid);
    expect(c.stash(b.uid, 0)).toBe(true);
    expect(c.sleeve[0]?.uid).toBe(b.uid);
    expect(c.belt.some((x) => x.card.uid === a.uid)).toBe(true);
  });

  it('enemy resolves its telegraphed move after the wind-up', () => {
    const c = setup({ enemy: ENEMIES.rat });
    run(c, CONFIG.introTime + ENEMIES.rat.pattern[0].windup + 0.05);
    expect(c.hero.hp).toBe(80 - 4);
  });

  it('goblin flees', () => {
    const c = setup({ enemy: ENEMIES.goblin, hp: 999, maxHp: 999 });
    run(c, 30);
    expect(c.result).toBe('fled');
  });

  it('warrior berserk doubles attack damage', () => {
    const c = setup({ deck: deckOf(['strike', 'strike']) });
    run(c, CONFIG.introTime + 0.01);
    c.hero.resource = c.hero.resourceMax;
    expect(c.useAbility()).toBe(true);
    const hp = c.enemy.hp;
    c.playCard(c.belt[0].card.uid);
    expect(hp - c.enemy.hp).toBe(12);
  });

  it('mage spellweave adds damage to chained spells', () => {
    const c = setup({ hero: HEROES.mage, hp: 66, maxHp: 66, deck: deckOf(['arcaneBolt', 'arcaneBolt']), enemy: ENEMIES.slime });
    run(c, CONFIG.introTime + 0.01);
    const hp = c.enemy.hp;
    c.playCard(c.belt[0].card.uid);
    c.playCard(c.belt[0].card.uid);
    expect(hp - c.enemy.hp).toBe(5 + 6);
  });

  it('temp curses never collide with deck uids', () => {
    const c = setup({ enemy: ENEMIES.slime });
    c.addTempCard('slime', 'discard');
    expect(c.discard[0].uid).toBeLessThan(0);
  });

  it('every card has a play or expire effect and valid numbers', () => {
    for (const d of CARD_LIST) {
      expect(d.play || d.onExpire, d.id).toBeTruthy();
      if (d.upVals) expect(d.upVals.length, d.id).toBe(d.vals.length);
    }
  });
});
