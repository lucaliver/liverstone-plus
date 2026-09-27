import { describe, expect, it } from 'vitest';
import { Combat, type CombatSetup } from '../src/game/combat';
import { CONFIG, EXPIRE_POS } from '../src/data/config';
import { ENEMIES } from '../src/data/enemies';
import { HEROES } from '../src/data/heroes';
import { CARD_LIST, CARDS } from '../src/data/cards';
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

  it('two-row belt (default): both rows fill up, each keeps its spacing, and the belt runs slower', () => {
    const c = setup({ deck: deckOf(Array(14).fill('strike')) });
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

  it('cards never overlap on a row, even while queued curses hold the other one back', () => {
    const c = setup({ deck: deckOf(Array(14).fill('strike')) });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    c.addTempCard('slime', 'belt', false, -0.3);
    run(c, 6);
    for (const row of [0, 1]) {
      const pos = c.belt
        .filter((b) => b.row === row)
        .map((b) => b.pos)
        .sort((a, b) => a - b);
      for (let i = 1; i < pos.length; i++) expect(pos[i] - pos[i - 1]).toBeGreaterThan(CONFIG.cardWidth);
    }
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

  it('perks: innate puts a copy first on the belt, discount lowers its cost', () => {
    const deck = deckOf(new Array(10).fill('strike'));
    deck[9] = { ...deck[9], id: 'heavyBlow', perks: ['innate', 'discount'] };
    const c = setup({ deck });
    const card = c.belt.find((b) => b.card.id === 'heavyBlow')?.card;
    expect(card).toBeDefined();
    expect(c.cardCost(card!)).toBe(c.cardCost({ uid: 0, id: 'heavyBlow', up: false }) - 1);
  });

  it('a hexed card needs its taps, then thaws, then plays normally', () => {
    const c = setup({ deck: deckOf(new Array(8).fill('strike')) });
    run(c, CONFIG.introTime + 0.01);
    c.hexCards('petrify', 0.01);
    const card = c.belt.find((b) => b.card.hex)!.card;
    for (let i = 0; i < 5; i++) expect(c.playCard(card.uid)).toBe(false);
    expect(c.stash(card.uid)).toBe(false);
    expect(card.hex?.left).toBe(0);
    expect(c.playCard(card.uid)).toBe(false);
    run(c, 0.6);
    expect(card.hex).toBeUndefined();
    expect(c.playCard(card.uid)).toBe(true);
  });

  it('Gatekeeping covers the cards ahead of it until paid off', () => {
    const c = setup({ deck: deckOf(new Array(8).fill('strike')) });
    run(c, CONFIG.introTime + 1);
    c.hero.mana = 10;
    c.addTempCard('gatekeeping', 'belt');
    run(c, 1);
    const gate = c.belt.find((b) => b.card.id === 'gatekeeping')!;
    const under = c.belt.find((b) => b.card.id === 'strike' && b.pos > gate.pos && c.isCovered(b.card.uid));
    expect(under).toBeDefined();
    expect(c.playCard(under!.card.uid)).toBe(false);
    expect(c.playCard(gate.card.uid)).toBe(true);
    expect(c.playCard(under!.card.uid)).toBe(true);
  });

  it('HR policy: no two cards of the same type in a row', () => {
    const c = setup({ enemy: ENEMIES.hr, deck: deckOf(['strike', 'strike', 'strike', 'defend', 'defend', 'defend']) });
    run(c, CONFIG.introTime + 0.01);
    c.hero.mana = 10;
    const strikes = c.belt.filter((b) => b.card.id === 'strike');
    expect(c.playCard(strikes[0].card.uid)).toBe(true);
    if (strikes[1]) expect(c.playCard(strikes[1].card.uid)).toBe(false);
    const defend = c.belt.find((b) => b.card.id === 'defend');
    if (defend) expect(c.playCard(defend.card.uid)).toBe(true);
    // The policy only covers quick repeats: after a pause the same type is fine again.
    run(c, 3.1);
    const again = c.belt.find((b) => b.card.id === 'defend');
    if (again) expect(c.playCard(again.card.uid)).toBe(true);
  });

  it('Light Sleeper: every card played brings his hit 1s closer', () => {
    const c = setup({ enemy: ENEMIES.sleeper, deck: deckOf(new Array(8).fill('strike')) });
    run(c, CONFIG.introTime + 0.01);
    const before = c.enemy.timer;
    c.playCard(c.belt[0].card.uid);
    expect(c.enemy.timer).toBeCloseTo(before + 1, 5);
  });

  it("New Hire's stare petrifies half the belt and half the rest of the deck; a hex survives the piles until broken", () => {
    const c = setup({ enemy: ENEMIES.newHire, deck: deckOf(new Array(12).fill('strike')) });
    run(c, CONFIG.introTime + 0.01);
    const onBelt = c.belt.length;
    const rest = c.draw.length + c.discard.length;
    c.hexCards('petrify', 0.5);
    expect(c.belt.filter((b) => b.card.hex).length).toBe(Math.ceil(onBelt / 2));
    expect([...c.draw, ...c.discard].filter((x) => x.hex).length).toBe(Math.ceil(rest / 2));
    // Left alone, hexed cards fall off the belt still hexed.
    run(c, CONFIG.beltTime * 1.5);
    const hexed = [...c.discard, ...c.draw, ...c.belt.map((b) => b.card)].filter((x) => x.hex);
    expect(hexed.length).toBe(Math.ceil(onBelt / 2) + Math.ceil(rest / 2));
  });

  it('sleeve slots come from the hero', () => {
    expect(setup({ hero: HEROES.warrior }).sleeve.length).toBe(1);
    expect(setup({ hero: HEROES.necromancer }).sleeve.length).toBe(3);
  });

  it('mana crystals raise the cap empty', () => {
    const c = setup({ deck: deckOf(['manaGeode', 'strike']) });
    run(c, CONFIG.introTime + 0.01);
    const max = c.hero.maxMana;
    const card = c.belt.find((b) => b.card.id === 'manaGeode')!.card;
    const mana = c.hero.mana;
    c.playCard(card.uid);
    expect(c.hero.maxMana).toBe(max + 2);
    expect(c.hero.mana).toBe(mana - 2);
  });

  it('mage spellweave adds damage to chained spells', () => {
    const c = setup({ hero: HEROES.mage, hp: 70, maxHp: 70, deck: deckOf(['arcaneBolt', 'arcaneBolt']), enemy: ENEMIES.slime });
    run(c, CONFIG.introTime + 0.01);
    c.hero.maxMana = c.hero.mana = 10;
    const hp = c.enemy.hp;
    c.playCard(c.belt[0].card.uid);
    c.playCard(c.belt[0].card.uid);
    expect(hp - c.enemy.hp).toBe(3 + 4);
  });

  it('played cards are never replaced in place: new cards always enter from the right', () => {
    // One row, so the spacing check below reads a single line of cards.
    const c = setup({ beltRows: 1, deck: deckOf(['strike', 'strike', 'strike', 'strike', 'strike', 'strike']) });
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

  it('necromancer poison ticks harder at 7+ Poison (Virulence), plain below', () => {
    const c = setup({ hero: HEROES.necromancer, hp: 50, maxHp: 50, deck: deckOf(['rot', 'rot']), enemy: ENEMIES.skeleton });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    c.applyStatus('enemy', 'poison', 7);
    let hp = c.enemy.hp;
    run(c, CONFIG.dotInterval + 0.02);
    expect(hp - c.enemy.hp).toBe(7 + 1);
    hp = c.enemy.hp;
    run(c, CONFIG.dotInterval);
    expect(hp - c.enemy.hp).toBe(6);
  });

  it('a bomb that reaches the end of the belt explodes on the hero', () => {
    const c = setup({ deck: deckOf(['strike']) });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    c.addTempCard('bomb', 'belt');
    run(c, (CONFIG.beltTime * EXPIRE_POS) / c.beltRate() + 0.5);
    expect(c.hero.hp).toBe(80 - 10);
  });

  it('the hero special starts in the sleeve, stays there, and is flagged once played', () => {
    const c = setup({ special: 'lastStand' });
    run(c, CONFIG.introTime + 0.01);
    expect(c.sleeve[0]?.id).toBe('lastStand');
    expect(c.stash(c.belt[0].card.uid, 0)).toBe(false);
    expect(c.playCard(c.sleeve[0]!.uid)).toBe(true);
    expect(c.specialUsed).toBe(true);
    expect(c.hero.block).toBe(15);
    // Once per run: it never comes back on the belt.
    expect(c.exhaust.map((x) => x.id)).toContain('lastStand');
  });

  it('enemies use their main attack, then a special every N attacks', () => {
    const c = setup({ enemy: ENEMIES.skeleton, hp: 999, maxHp: 999 });
    const seen: string[] = [];
    c.events.on((e) => {
      if (e.type === 'enemyAct') seen.push(e.move.id);
    });
    const { main, specials } = ENEMIES.skeleton;
    run(c, CONFIG.introTime + 4 * main.windup + specials[0].windup + specials[1].windup + 1);
    // Specials rotate: Seniority, then Gatekeep.
    expect(seen.slice(0, 6)).toEqual(['slash', 'slash', 'boneCrush', 'slash', 'slash', 'gatekeep']);
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
      if (rush) {
        c.rushBelt(6);
        expect(c.has('hero', 'rush')).toBe(true);
      }
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

  it('every card has a play or expire effect (or is plain unplayable) and valid numbers', () => {
    for (const d of CARD_LIST) {
      expect(d.play || d.onExpire || d.keywords?.includes('unplayable'), d.id).toBeTruthy();
      if (d.upVals) expect(d.upVals.length, d.id).toBe(d.vals.length);
    }
  });

  it('a Pending card can only be played after its first full ride along the belt', () => {
    const c = setup({ beltRows: 1, deck: deckOf(['pyroblast']) });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    c.hero.maxMana = c.hero.mana = 10;
    const card = c.belt[0].card;
    expect(c.playCard(card.uid)).toBe(false);
    expect(c.stash(card.uid, 1)).toBe(false);
    // Off the edge, reshuffled, back on the belt: now it's approved.
    run(c, (CONFIG.beltTime * EXPIRE_POS) / c.beltRate() + 3);
    const back = c.belt.find((b) => b.card.uid === card.uid);
    expect(back).toBeTruthy();
    c.hero.mana = 10;
    expect(c.playCard(card.uid)).toBe(true);
  });

  it('the Snitch hurries the belt for the rest of the fight once under half HP', () => {
    const c = setup({ enemy: ENEMIES.rat });
    run(c, CONFIG.introTime + 0.01);
    const base = c.beltRate();
    c.damage('hero', 'enemy', Math.ceil(c.enemy.maxHp / 2), { raw: true }, 'hero');
    expect(c.beltRate()).toBeCloseTo(base * CONFIG.beltHurry);
    run(c, 30);
    expect(c.has('hero', 'hurry')).toBe(true);
  });

  describe('workplace cards', () => {
    /** A quiet fight: the enemy never acts, lots of mana, the belt as the test sets it. */
    const quiet = (deck: string[], over: Partial<CombatSetup> = {}): Combat => {
      const c = setup({ deck: deckOf(deck), ...over });
      c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
      c.enemy.hp = c.enemy.maxHp = 500;
      run(c, CONFIG.introTime + 0.01);
      c.hero.maxMana = c.hero.mana = 10;
      return c;
    };
    const play = (c: Combat, id: string): boolean => {
      c.addTempCard(id, 'belt');
      const b = c.belt.find((x) => x.card.id === id)!;
      b.card.passed = true;
      return c.playCard(b.card.uid);
    };

    it('a stunned hero cannot play cards or use the ability', () => {
      const c = quiet(['strike', 'strike']);
      expect(play(c, 'quickFavour')).toBe(true);
      expect(c.has('hero', 'stun')).toBe(true);
      expect(c.playCard(c.belt[0].card.uid)).toBe(false);
      expect(c.abilityReady()).toBe(false);
      run(c, 2.1);
      expect(c.playCard(c.belt[0].card.uid)).toBe(true);
    });

    it('Bare Minimum grows Block every second until another card is played', () => {
      const c = quiet(['strike', 'strike']);
      play(c, 'bareMinimum');
      run(c, 3.01);
      expect(c.hero.block).toBeGreaterThanOrEqual(1 + 2 + 3 - 1);
      c.playCard(c.belt[0].card.uid);
      expect(c.has('hero', 'bareMinimum')).toBe(false);
    });

    it('Grindset deals damage every second for its duration', () => {
      const c = quiet(['defend']);
      const hp = c.enemy.hp;
      play(c, 'grindset');
      run(c, 12.5);
      expect(hp - c.enemy.hp).toBe(3 * 12);
    });

    it('Priority Task holds its whole row; Lockout covers both rows ahead of it', () => {
      const c = quiet(new Array(10).fill('strike'));
      c.addTempCard('priorityTask', 'belt');
      const lock = c.belt.find((b) => b.card.id === 'priorityTask')!;
      const sameRow = c.belt.filter((b) => b !== lock && b.row === lock.row);
      const otherRow = c.belt.filter((b) => b.row !== lock.row);
      expect(sameRow.length).toBeGreaterThan(0);
      expect(sameRow.every((b) => c.isCovered(b.card.uid))).toBe(true);
      expect(otherRow.some((b) => c.isCovered(b.card.uid))).toBe(false);

      const d = quiet(new Array(10).fill('strike'));
      d.addTempCard('lockout', 'belt');
      run(d, 3);
      const gate = d.belt.find((b) => b.card.id === 'lockout')!;
      const ahead = d.belt.filter((b) => b.pos > gate.pos && b.pos - gate.pos < 2 * CONFIG.cardWidth);
      expect(new Set(ahead.map((b) => b.row)).size).toBe(2);
      expect(ahead.every((b) => d.isCovered(b.card.uid))).toBe(true);
    });

    it('Quiet Quitting discards the belt and hits once per card', () => {
      const c = quiet(new Array(10).fill('strike'));
      // The belt it discards doesn't include Quiet Quitting itself.
      const n = c.belt.length;
      const hp = c.enemy.hp;
      play(c, 'quietQuitting');
      expect(c.belt.length).toBe(0);
      expect(hp - c.enemy.hp).toBe(10 * n);
    });

    it('Previous Email repeats the last card, Copy Paste copies it over the belt', () => {
      const c = quiet(new Array(8).fill('defend'));
      play(c, 'strike');
      const hp = c.enemy.hp;
      play(c, 'previousEmail');
      expect(hp - c.enemy.hp).toBe(6);
      // A repeat doesn't count as the last card: a second one repeats the same Punch.
      play(c, 'previousEmail');
      expect(hp - c.enemy.hp).toBe(12);
      play(c, 'copyPaste');
      expect(c.belt.length).toBeGreaterThan(0);
      expect(c.belt.every((b) => b.card.id === 'strike' && b.card.temp)).toBe(true);
    });

    it('Not My Job skips the move being charged', () => {
      const c = setup({ enemy: ENEMIES.skeleton });
      run(c, CONFIG.introTime + 1);
      c.hero.maxMana = c.hero.mana = 10;
      const before = c.enemy.moveCount;
      c.enemy.timer = 3;
      play(c, 'notMyJob');
      expect(c.enemy.timer).toBe(0);
      expect(c.enemy.moveCount).toBe(before);
    });

    it('Follow Up and Q1 put generated cards into the draw pile', () => {
      const c = quiet(['defend', 'defend']);
      play(c, 'followUp');
      expect(c.draw.filter((x) => x.id === 'alreadyDone').length).toBe(3);
      play(c, 'q1');
      expect(c.draw.some((x) => x.id === 'q2')).toBe(true);
    });

    it('volatile office curses bite when they leave the belt', () => {
      const c = quiet(['defend']);
      c.addTempCard('officePlant', 'belt');
      c.addTempCard('machineDown', 'belt');
      c.hero.mana = 8;
      run(c, (CONFIG.beltTime * EXPIRE_POS) / c.beltRate() + 0.5);
      expect(c.has('hero', 'stun')).toBe(true);
      expect(c.hero.mana).toBeLessThan(8);
    });
  });

  describe('act 2 enemies', () => {
    const vs = (enemy: string, deck = new Array(12).fill('strike')): Combat => {
      const c = setup({ enemy: ENEMIES[enemy], deck: deckOf(deck), hp: 999, maxHp: 999 });
      run(c, CONFIG.introTime + 0.01);
      c.hero.maxMana = Math.min(c.hero.maxMana, c.manaCap());
      return c;
    };

    it('Meticulous Colleague: two cards in a row from the same lane are refused', () => {
      const c = vs('meticulous');
      c.hero.mana = c.hero.maxMana = 10;
      const first = c.belt.find((b) => b.row === 0)!;
      expect(c.playCard(first.card.uid)).toBe(true);
      const same = c.belt.find((b) => b.row === 0);
      const other = c.belt.find((b) => b.row === 1)!;
      if (same) expect(c.playCard(same.card.uid)).toBe(false);
      expect(c.playCard(other.card.uid)).toBe(true);
    });

    it('Wellness Coach: one card every 2 seconds', () => {
      const c = vs('wellness');
      c.hero.mana = c.hero.maxMana = 10;
      expect(c.playCard(c.belt[0].card.uid)).toBe(true);
      expect(c.playCard(c.belt[0].card.uid)).toBe(false);
      run(c, 2.05);
      c.hero.mana = 10;
      expect(c.playCard(c.belt[0].card.uid)).toBe(true);
    });

    it('Bean Counter: max mana is frozen at 3, crystals included', () => {
      const c = vs('beanCounter', ['manaGeode', 'manaGeode', 'strike']);
      expect(c.hero.maxMana).toBeLessThanOrEqual(3);
      c.hero.mana = 3;
      c.addManaCrystals(3);
      expect(c.hero.maxMana).toBe(3);
    });

    it('Micromanager: standing still for 2 seconds brings an instant hit', () => {
      const c = vs('micromanager');
      c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
      const hp = c.hero.hp;
      run(c, 2.1);
      expect(c.hero.hp).toBeLessThan(hp);
      // Playing cards keeps him off your back.
      const after = c.hero.hp;
      for (let i = 0; i < 4; i++) {
        c.hero.mana = 10;
        c.playCard(c.belt[0].card.uid);
        run(c, 1);
      }
      expect(c.hero.hp).toBe(after);
    });

    it('The Printer stores the damage it takes while scanning and prints it back', () => {
      const c = vs('printer');
      expect(c.enemy.move.absorb).toBe(true);
      c.hero.mana = c.hero.maxMana = 10;
      const hp = c.enemy.hp;
      c.playCard(c.belt[0].card.uid);
      expect(c.enemy.hp).toBe(hp);
      expect(c.enemy.stored).toBe(6);
      run(c, 5);
      expect(c.enemy.move.release).toBe(true);
      expect(c.intentDamage(c.enemy.move)).toBe(4 + 6);
      const heroHp = c.hero.hp;
      run(c, 5.1);
      expect(heroHp - c.hero.hp).toBe(10);
      expect(c.enemy.stored).toBe(0);
    });

    it('The Veteran inflates card costs until each card is played', () => {
      const c = vs('veteran');
      c.inflateCards(40);
      expect(c.belt.every((b) => c.cardCost(b.card) === 3)).toBe(true);
      c.hero.mana = c.hero.maxMana = 10;
      const card = c.belt[0].card;
      expect(c.playCard(card.uid)).toBe(true);
      expect(c.hero.mana).toBe(7);
      expect(c.cardCost(card)).toBe(2);
    });

    it('Dave idles four times, then hits hard and adds four different curses', () => {
      const c = vs('dave');
      const acts: string[] = [];
      c.events.on((e) => {
        if (e.type === 'enemyAct') acts.push(e.move.id);
      });
      const hp = c.hero.hp;
      run(c, 4 * 4 + 0.5);
      expect(acts).toEqual(['scrolling', 'scrolling', 'scrolling', 'scrolling']);
      expect(c.hero.hp).toBe(hp);
      run(c, 2);
      expect(acts[4]).toBe('lastMinute');
      expect(c.hero.hp).toBeLessThan(hp);
      const everywhere = [...c.draw, ...c.discard, ...c.belt.map((b) => b.card)];
      expect(new Set(everywhere.filter((x) => CARDS[x.id].type === 'curse').map((x) => x.id)).size).toBe(4);
    });
  });
});
