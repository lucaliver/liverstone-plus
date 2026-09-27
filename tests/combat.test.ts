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
  it('prewarms only the right half of the belt and waits for the intro', () => {
    const c = setup();
    const pos = c.belt.map((b) => b.pos);
    expect(pos.length).toBeGreaterThanOrEqual(2);
    expect(Math.max(...pos)).toBeCloseTo(CONFIG.prewarm, 1);
    expect(Math.max(...pos)).toBeLessThanOrEqual(CONFIG.prewarm + 0.01);
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
    expect(c.hero.mana).toBe(CONFIG.startMana - c.cardCost(card));
    expect(c.discard.map((x) => x.uid)).toContain(card.uid);
  });

  it('two-row belt: both rows fill up, each keeps its spacing, and the belt runs slower', () => {
    const c = setup({ beltRows: 2, deck: deckOf(Array(14).fill('strike')) });
    expect(c.belt.filter((b) => b.row === 1).length).toBeGreaterThan(0);
    run(c, CONFIG.introTime + 10);
    for (const row of [0, 1]) {
      const pos = c.belt
        .filter((b) => b.row === row)
        .map((b) => b.pos)
        .sort((a, b) => a - b);
      expect(pos.length).toBeGreaterThan(2);
      for (let i = 1; i < pos.length; i++) expect(pos[i] - pos[i - 1]).toBeGreaterThan(CONFIG.spacing * 0.9);
    }
    expect(c.beltRate()).toBeCloseTo(CONFIG.twoRowSpeed);
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
    run(c, CONFIG.introTime + ENEMIES.rat.main.windup + 0.05);
    expect(c.hero.hp).toBe(80 - ENEMIES.rat.main.dmg!);
  });

  it('warrior berserk doubles attack damage', () => {
    const c = setup({ deck: deckOf(['strike', 'strike']) });
    run(c, CONFIG.introTime + 0.01);
    c.hero.maxMana = 10;
    c.hero.mana = 10;
    expect(c.useAbility()).toBe(true);
    expect(c.hero.mana).toBe(10 - HEROES.warrior.ability.cost);
    const hp = c.enemy.hp;
    c.playCard(c.belt[0].card.uid);
    expect(hp - c.enemy.hp).toBe(12);
  });

  it('innate cards are on the belt from the start', () => {
    const c = setup({ deck: deckOf([...new Array(8).fill('strike'), 'manaShard', 'manaGeode']) });
    const ids = c.belt.map((b) => b.card.id);
    expect(ids).toContain('manaShard');
    expect(ids).toContain('manaGeode');
  });

  it('mana crystals raise the cap empty', () => {
    const c = setup({ deck: deckOf(['manaGeode', 'strike']) });
    run(c, CONFIG.introTime + 0.01);
    const max = c.hero.maxMana;
    const card = c.belt.find((b) => b.card.id === 'manaGeode')!.card;
    const mana = c.hero.mana;
    c.playCard(card.uid);
    expect(c.hero.maxMana).toBe(max + 2);
    expect(c.hero.mana).toBe(mana - 1);
  });

  it('mage spellweave adds damage to chained spells', () => {
    const c = setup({ hero: HEROES.mage, hp: 70, maxHp: 70, deck: deckOf(['arcaneBolt', 'arcaneBolt']), enemy: ENEMIES.slime });
    run(c, CONFIG.introTime + 0.01);
    c.hero.maxMana = c.hero.mana = 10;
    const hp = c.enemy.hp;
    c.playCard(c.belt[0].card.uid);
    c.playCard(c.belt[0].card.uid);
    expect(hp - c.enemy.hp).toBe(7 + 8);
  });

  it('played cards are never replaced in place: new cards always enter from the right', () => {
    const c = setup({ deck: deckOf(['strike', 'strike', 'strike', 'strike', 'strike', 'strike']) });
    c.hero.maxMana = 10;
    run(c, CONFIG.introTime + 3);
    const spawnPositions: number[] = [];
    c.events.on((e) => {
      if (e.type === 'cardSpawn') spawnPositions.push(c.belt.find((b) => b.card.uid === e.card.uid)!.pos);
    });
    for (let i = 0; i < 20; i++) {
      c.hero.mana = 10;
      if (c.belt[0]) c.playCard(c.belt[0].card.uid);
      run(c, 0.3);
    }
    expect(spawnPositions.length).toBeGreaterThan(1);
    expect(spawnPositions.every((p) => p === 0)).toBe(true);
    // Cards keep their spacing (no overlap from the entry boost).
    const sorted = c.belt.map((b) => b.pos).sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(CONFIG.minGap - 1e-9);
  });

  it('draw cadence is fixed: playing fast never draws extra cards', () => {
    const spawnsWith = (spam: boolean): number => {
      const c = setup({ deck: deckOf(new Array(12).fill('strike')), enemy: ENEMIES.skeleton });
      c.enemy.hp = 9999;
      c.hero.hp = 9999;
      let n = 0;
      c.events.on((e) => {
        if (e.type === 'cardSpawn') n++;
      });
      for (let t = 0; t < CONFIG.introTime + 20; t += 1 / 60) {
        c.tick(1 / 60);
        if (spam && c.belt.length) {
          c.hero.mana = 10;
          c.playCard(c.belt[c.belt.length - 1].card.uid);
        }
      }
      return n;
    };
    expect(spawnsWith(true)).toBe(spawnsWith(false));
  });

  it('necromancer poison ticks harder (Virulence)', () => {
    const c = setup({ hero: HEROES.necromancer, hp: 62, maxHp: 62, deck: deckOf(['rot', 'rot']), enemy: ENEMIES.skeleton });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    c.applyStatus('enemy', 'poison', 6);
    const hp = c.enemy.hp;
    run(c, CONFIG.dotInterval + 0.02);
    expect(hp - c.enemy.hp).toBe(6 + 1);
  });

  it('a bomb that reaches the end of the belt explodes on the hero', () => {
    const c = setup({ deck: deckOf(['strike']) });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    c.addTempCard('bomb', 'belt');
    run(c, CONFIG.beltTime * EXPIRE_POS + 0.5);
    expect(c.hero.hp).toBe(80 - 10);
  });

  it('the hero special starts in the sleeve, stays there, and is flagged once played', () => {
    const c = setup({ special: 'lastStand' });
    run(c, CONFIG.introTime + 0.01);
    expect(c.sleeve[0]?.id).toBe('lastStand');
    expect(c.stash(c.belt[0].card.uid, 0)).toBe(false);
    expect(c.playCard(c.sleeve[0]!.uid)).toBe(true);
    expect(c.specialUsed).toBe(true);
    expect(c.hero.block).toBe(20);
  });

  it('enemies use their main attack, then a special every N attacks', () => {
    const c = setup({ enemy: ENEMIES.skeleton, hp: 999, maxHp: 999 });
    const seen: string[] = [];
    c.events.on((e) => {
      if (e.type === 'enemyAct') seen.push(e.move.id);
    });
    const { main, specials } = ENEMIES.skeleton;
    run(c, CONFIG.introTime + 4 * main.windup + 2 * specials[0].windup + 1);
    expect(seen.slice(0, 6)).toEqual(['slash', 'slash', 'boneCrush', 'slash', 'slash', 'boneCrush']);
  });

  it('abilities cost mana and cannot be used without it', () => {
    const c = setup();
    run(c, CONFIG.introTime + 0.01);
    c.hero.mana = HEROES.warrior.ability.cost - 1;
    expect(c.useAbility()).toBe(false);
  });

  it('synergy cards: Fortified Block holds, Counterstrike reads Block, Contagion reads Poison', () => {
    const c = setup({ deck: deckOf(['bulwark', 'counterstrike']) });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    c.hero.maxMana = 10;
    c.hero.mana = 10;
    c.playCard(c.belt.find((b) => b.card.id === 'bulwark')!.card.uid);
    const block = c.hero.block;
    run(c, 3);
    expect(c.hero.block).toBe(block);
    const hp = c.enemy.hp;
    c.hero.mana = 10;
    c.playCard(c.belt.find((b) => b.card.id === 'counterstrike')!.card.uid);
    expect(hp - c.enemy.hp).toBe(11);

    const n = setup({ hero: HEROES.necromancer, hp: 62, maxHp: 62, deck: deckOf(['contagion', 'contagion']) });
    run(n, CONFIG.introTime + 0.01);
    n.hero.mana = 5;
    n.playCard(n.belt[0].card.uid);
    n.playCard(n.belt[0].card.uid);
    expect(n.stacks('enemy', 'poison')).toBe(3 + 7);
  });

  it('rushing the belt makes cards arrive faster', () => {
    const count = (rush: boolean): number => {
      const c = setup({ deck: deckOf(new Array(20).fill('strike')) });
      c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
      let n = 0;
      c.events.on((e) => {
        if (e.type === 'cardSpawn') n++;
      });
      run(c, CONFIG.introTime + 0.01);
      if (rush) c.rushBelt(6);
      run(c, 6);
      return n;
    };
    expect(count(true)).toBeGreaterThan(count(false));
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
