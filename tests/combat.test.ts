import { describe, expect, it } from 'vitest';
import { Combat, type CombatSetup } from '../src/game/combat';
import { CONFIG, EXPIRE_POS } from '../src/data/config';
import { ENEMIES, enemiesFor } from '../src/data/enemies';
import { HEROES } from '../src/data/heroes';
import { CARD_LIST, CARDS } from '../src/data/cards';
import { canCopy, canShred, COPY_HP_COST, fightPay, loadRun, newRun, photocopyCard, SHRED_MIN_DECK, shredCard } from '../src/game/run';
import type { CardInst } from '../src/game/types';

const deckOf = (ids: string[]): CardInst[] => ids.map((id, i) => ({ uid: i + 1, id, up: false }));

/** The default opponent: a Senior Boomer without his passives, so tests count only what they set up. */
const plainBoomer = { ...ENEMIES.seniorBoomer, start: [], onHalf: undefined };

function setup(over: Partial<CombatSetup> = {}): Combat {
  return new Combat({
    hero: HEROES.warrior,
    hp: 80,
    maxHp: 80,
    deck: deckOf(HEROES.warrior.startDeck),
    relics: [],
    relicFlags: {},
    enemy: plainBoomer,
    scale: { hp: 1, dmg: 1 },
    seed: 42,
    ...over,
  });
}

const run = (c: Combat, seconds: number): void => {
  for (let t = 0; t < seconds; t += 1 / 60) c.tick(1 / 60);
};

describe('combat engine', () => {
  it('a restructuring shuts a belt row and discards the cards riding it', () => {
    const c = setup({ enemy: ENEMIES.changeManager });
    run(c, 6);
    const onRow1 = c.belt.filter((b) => b.row === 1).map((b) => b.card.uid);
    expect(onRow1.length).toBeGreaterThan(0);
    c.closeBeltRows(1);
    expect(c.rowsOpen).toBe(1);
    expect(c.belt.every((b) => b.row === 0)).toBe(true);
    expect(c.discard.map((x) => x.uid)).toEqual(expect.arrayContaining(onRow1));
    run(c, 6);
    expect(c.belt.every((b) => b.row === 0)).toBe(true);
  });

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
    const c = setup({ deck: deckOf(['punch', 'punch']) });
    run(c, CONFIG.introTime + 0.01);
    const card = c.belt[0].card;
    const hp = c.enemy.hp;
    expect(c.playCard(card.uid)).toBe(true);
    expect(c.enemy.hp).toBe(hp - 6);
    expect(c.hero.mana).toBe(CONFIG.startMana - c.cardCost(card));
    expect(c.discard.map((x) => x.uid)).toContain(card.uid);
  });

  it('two-row belt (default): both rows fill up, each keeps its spacing, and the belt runs slower', () => {
    const c = setup({ deck: deckOf(Array(14).fill('punch')) });
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
    const c = setup({ deck: deckOf(Array(14).fill('punch')) });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    c.addTempCard('drama', 'belt', false, -0.3);
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
    const c = setup({ deck: deckOf(['hydraulicPress', 'hydraulicPress']) });
    run(c, CONFIG.introTime + 0.01);
    expect(c.playCard(c.belt[0].card.uid)).toBe(false);
    expect(c.belt.length).toBe(2);
  });

  it('expires cards off the left edge and reshuffles the discard pile', () => {
    const c = setup({ deck: deckOf(['punch', 'hardHat', 'wrenchWhack']) });
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

  it('the Work Wife fills the sleeve with Moving Boxes: stuck there, cheaper every second, cleared by paying', () => {
    const c = setup({ hero: HEROES.necromancer, enemy: ENEMIES.workWife });
    expect(c.sleeve.every((x) => x?.id === 'movingBox')).toBe(true);
    const box = c.sleeve[0]!;
    expect(c.cardCost(box)).toBe(20);
    run(c, CONFIG.introTime + 0.01);
    expect(c.stash(c.belt[0].card.uid, 0)).toBe(false);
    run(c, 5);
    expect(c.cardCost(box)).toBe(15);
    run(c, 20);
    expect(c.cardCost(box)).toBe(0);
    expect(c.playCard(box.uid)).toBe(true);
    expect(c.sleeve[0]).toBe(null);
    // Unpacking it speeds the belt up.
    expect(c.has('hero', 'rush')).toBe(true);
    expect(c.hero.statuses.rush.t).toBeCloseTo(CARDS.movingBox.vals[1], 1);
  });

  it('Kamikaze blows up in your face if it slips off the belt, but is safe in the sleeve', () => {
    const c = setup({ hp: 200, maxHp: 200, deck: deckOf(Array(6).fill('punch')) });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    c.addTempCard('kamikaze', 'belt');
    const kept = c.belt[c.belt.length - 1].card;
    expect(c.playCard(kept.uid)).toBe(false);
    expect(c.stash(kept.uid, 0)).toBe(true);
    c.addTempCard('kamikaze', 'belt');
    run(c, (CONFIG.beltTime * EXPIRE_POS) / c.beltRate() + 0.5);
    expect(c.sleeve[0]?.uid).toBe(kept.uid);
    expect(c.hero.hp).toBe(200 - 99);
  });

  it('enemy resolves its telegraphed move after the wind-up', () => {
    const c = setup({ enemy: ENEMIES.snitch });
    run(c, CONFIG.introTime + ENEMIES.snitch.main.windup + 0.05);
    expect(c.hero.hp).toBe(80 - ENEMIES.snitch.main.dmg!);
  });

  it('warrior Overtime doubles attack damage', () => {
    const c = setup({ deck: deckOf(['punch', 'punch']) });
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
    const deck = deckOf(new Array(10).fill('punch'));
    deck[9] = { ...deck[9], id: 'sledgehammer', perks: ['fastTrack', 'budgetCut'] };
    const c = setup({ deck });
    const card = c.belt.find((b) => b.card.id === 'sledgehammer')?.card;
    expect(card).toBeDefined();
    expect(c.cardCost(card!)).toBe(c.cardCost({ uid: 0, id: 'sledgehammer', up: false }) - 1);
  });

  it('a hexed card needs its taps, then thaws, then plays normally', () => {
    const c = setup({ deck: deckOf(new Array(8).fill('punch')) });
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
    const c = setup({ deck: deckOf(new Array(8).fill('punch')) });
    run(c, CONFIG.introTime + 1);
    c.hero.mana = 10;
    c.addTempCard('gatekeeping', 'belt');
    run(c, 1);
    const gate = c.belt.find((b) => b.card.id === 'gatekeeping')!;
    const under = c.belt.find((b) => b.card.id === 'punch' && b.pos > gate.pos && c.isCovered(b.card.uid));
    expect(under).toBeDefined();
    expect(c.playCard(under!.card.uid)).toBe(false);
    expect(c.playCard(gate.card.uid)).toBe(true);
    expect(c.playCard(under!.card.uid)).toBe(true);
  });

  it("the Senior Boomer's paper cuts hurt for every card that slips off the belt, three times as much under half HP", () => {
    const c = setup({ enemy: ENEMIES.seniorBoomer, deck: deckOf(new Array(8).fill('punch')) });
    run(c, CONFIG.introTime + 0.01);
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    const lost = (): number => {
      const hp = c.hero.hp;
      c.belt[0].pos = EXPIRE_POS;
      run(c, 0.05);
      return hp - c.hero.hp;
    };
    expect(lost()).toBe(1);
    c.damage('hero', 'enemy', Math.ceil(c.enemy.maxHp / 2), { raw: true }, 'hero');
    expect(lost()).toBe(3);
  });

  it('the Goblin Consultant stops the belt for a moment, then reverses it, for every quarter of its HP you take, cards keeping their place', () => {
    const c = setup({ enemy: ENEMIES.goblinConsultant });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 6);
    const turns: string[] = [];
    const said: string[] = [];
    c.events.on((e) => {
      if (e.type === 'beltReversed') turns.push(e.type);
      if (e.type === 'speech') said.push(e.key);
    });
    const posOf = (): string => c.belt.map((b) => `${b.card.uid}:${b.pos.toFixed(3)}`).join();
    const before = c.belt.map((b) => `${b.card.uid}:${(b.pos - CONFIG.cardWidth / 2).toFixed(2)}`);
    c.damage('hero', 'enemy', Math.ceil(c.enemy.maxHp / 4), { raw: true }, 'hero');
    expect(said).toEqual(['status.paradigmShift.speech']);
    // The belt stands still first…
    const still = posOf();
    run(c, CONFIG.beltTurnPause / 2);
    expect(posOf()).toBe(still);
    expect(turns).toHaveLength(0);
    // …then turns around: a card's middle is mirrored about the belt's middle (unless it was still sliding in).
    while (!turns.length) run(c, 1 / 60);
    const mid = (x: number): number => 1 - x;
    for (const b of c.belt) {
      const was = before.find((s) => s.startsWith(`${b.card.uid}:`));
      if (was && b.pos < CONFIG.reverseMaxPos) expect(b.pos - CONFIG.cardWidth / 2).toBeCloseTo(mid(Number(was.split(':')[1])), 1);
    }
    c.damage('hero', 'enemy', 1, { raw: true }, 'hero');
    run(c, 1);
    expect(turns).toHaveLength(1);
    // Two quarters at once: the two turns cancel out.
    c.damage('hero', 'enemy', Math.ceil(c.enemy.maxHp / 2), { raw: true }, 'hero');
    run(c, 1);
    expect(turns).toHaveLength(1);
  });

  it('Burn hits only when the enemy attacks with damage, for its full stacks every time', () => {
    const c = setup({ enemy: ENEMIES.snitch });
    c.enemy.hp = c.enemy.maxHp = 500;
    c.enemy.block = 50;
    c.enemy.move = { id: 'poke', intent: 'attack', windup: 2, dmg: 1 };
    run(c, CONFIG.introTime);
    c.applyStatus('enemy', 'burn', 10);
    // Idle time costs it nothing, and Block doesn't stop it.
    c.enemy.timer = 0;
    run(c, 1.5);
    expect(c.enemy.hp).toBe(500);
    run(c, 1);
    expect(c.enemy.hp).toBe(490);
    expect(c.stacks('enemy', 'burn')).toBe(10);
    c.enemy.move = { id: 'poke', intent: 'attack', windup: 2, dmg: 1 };
    c.enemy.timer = 0;
    run(c, 2.1);
    expect(c.enemy.hp).toBe(480);
    // A move that deals no damage doesn't set it off.
    c.enemy.move = { id: 'chat', intent: 'defend', windup: 1 };
    c.enemy.timer = 0;
    run(c, 1.1);
    expect(c.enemy.hp).toBe(480);
  });

  describe('On a Roll', () => {
    /** A quiet fight with On a Roll on the belt and attacks behind it, run until they've piled up at the exit. */
    const piled = (): Combat => {
      const c = setup({ deck: deckOf(new Array(8).fill('punch')) });
      c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
      c.enemy.hp = c.enemy.maxHp = 500;
      c.hero.maxMana = c.hero.mana = 10;
      run(c, CONFIG.introTime + 0.01);
      c.belt.length = 0;
      c.addTempCard('onARoll', 'belt');
      run(c, 14);
      return c;
    };

    it('stops at the exit, and the attacks that reach it pile up behind it, out of reach', () => {
      const c = piled();
      const roll = c.belt.find((b) => b.card.id === 'onARoll')!;
      expect(roll.stuck).toBe(true);
      expect(roll.pos).toBeCloseTo(CONFIG.anchorPos);
      const pile = c.belt.filter((b) => b.stuck && b !== roll);
      expect(pile.length).toBeGreaterThan(1);
      expect(pile.every((b) => b.pos < roll.pos && c.isCovered(b.card.uid))).toBe(true);
      expect(c.playCard(pile[0].card.uid)).toBe(false);
    });

    it('playing it plays the whole pile for free', () => {
      const c = piled();
      const pile = c.belt.filter((b) => b.stuck && b.card.id === 'punch').length;
      const mana = c.hero.mana;
      expect(c.playCard(c.belt.find((b) => b.card.id === 'onARoll')!.card.uid)).toBe(true);
      expect(mana - c.hero.mana).toBe(CARDS.onARoll.cost);
      expect(500 - c.enemy.hp).toBe(pile * CARDS.punch.vals[0]);
      expect(c.belt.some((b) => b.stuck)).toBe(false);
    });

    it('any other card reaching the pile sends it all off the belt', () => {
      const c = piled();
      c.addTempCard('hardHat', 'belt');
      run(c, 10);
      expect(c.belt.some((b) => b.stuck || b.card.id === 'onARoll')).toBe(false);
      expect([...c.draw, ...c.discard].some((x) => x.id === 'onARoll')).toBe(true);
    });
  });

  it('HR policy goes by the card colour: two defense cards clash, defense then utility is fine', () => {
    const c = setup({ enemy: ENEMIES.hrBitch, deck: deckOf(['hardHat', 'hardHat', 'doubleEspresso', 'hardHat', 'doubleEspresso', 'hardHat']) });
    run(c, CONFIG.introTime + 0.01);
    c.hero.mana = c.hero.maxMana = 10;
    c.lastPlayed = CARDS.hardHat;
    c.lastPlayedAt = c.time;
    expect(c.ruleBlock({ uid: 0, id: 'hardHat', up: false })?.key).toBe('combat.policy');
    expect(c.ruleBlock({ uid: 0, id: 'doubleEspresso', up: false })).toBeNull();
  });

  it('HR policy covers curses too: paying off two curses back to back is refused', () => {
    const c = setup({ enemy: ENEMIES.hrBitch });
    run(c, CONFIG.introTime + 0.01);
    c.lastPlayed = CARDS.writeUp;
    c.lastPlayedAt = c.time;
    expect(c.ruleBlock({ uid: 0, id: 'writeUp', up: false })?.key).toBe('combat.policy');
  });

  it('HR policy: no two cards of the same type in a row', () => {
    const c = setup({ enemy: ENEMIES.hrBitch, deck: deckOf(['punch', 'punch', 'punch', 'hardHat', 'hardHat', 'hardHat']) });
    run(c, CONFIG.introTime + 0.01);
    c.hero.mana = 10;
    const strikes = c.belt.filter((b) => b.card.id === 'punch');
    expect(c.playCard(strikes[0].card.uid)).toBe(true);
    if (strikes[1]) expect(c.playCard(strikes[1].card.uid)).toBe(false);
    const defend = c.belt.find((b) => b.card.id === 'hardHat');
    if (defend) expect(c.playCard(defend.card.uid)).toBe(true);
    // The policy only covers quick repeats: after a pause the same type is fine again.
    run(c, 3.1);
    const again = c.belt.find((b) => b.card.id === 'hardHat');
    if (again) expect(c.playCard(again.card.uid)).toBe(true);
  });

  it('Light Sleeper: every card played brings his hit 1s closer', () => {
    const c = setup({ enemy: ENEMIES.guyAsleep, deck: deckOf(new Array(8).fill('punch')) });
    run(c, CONFIG.introTime + 0.01);
    const before = c.enemy.timer;
    c.playCard(c.belt[0].card.uid);
    expect(c.enemy.timer).toBeCloseTo(before + 1, 5);
  });

  it('New Hire petrifies half the belt and half the rest of the deck at the start; a hex survives the piles until broken', () => {
    const c = setup({ enemy: ENEMIES.newHire, deck: deckOf(new Array(12).fill('punch')) });
    const onBelt = c.belt.length;
    const rest = c.draw.length + c.discard.length;
    expect(c.belt.filter((b) => b.card.hex).length).toBe(Math.ceil(onBelt / 2));
    expect([...c.draw, ...c.discard].filter((x) => x.hex).length).toBe(Math.ceil(rest / 2));
    // Left alone, hexed cards fall off the belt still hexed.
    run(c, CONFIG.beltTime * 1.5);
    const hexed = [...c.discard, ...c.draw, ...c.belt.map((b) => b.card)].filter((x) => x.hex);
    expect(hexed.length).toBe(Math.ceil(onBelt / 2) + Math.ceil(rest / 2));
  });

  it("the Boss's Son shows a target now and then; tapping it in time makes the next attack hit twice as hard, once", () => {
    const c = setup({ enemy: ENEMIES.bossSon, hp: 500, maxHp: 500 });
    run(c, CONFIG.introTime + 0.01);
    const waitSpot = (): void => {
      for (let i = 0; i < 200 && !c.weakSpot; i++) run(c, 0.1);
      expect(c.weakSpot).not.toBeNull();
    };
    expect(c.hitWeakSpot()).toBe(false);
    waitSpot();
    run(c, 2.1);
    expect(c.weakSpot).toBeNull();
    expect(c.has('hero', 'crit')).toBe(false);

    const punch = (): number => {
      c.hero.mana = c.hero.maxMana = 10;
      c.enemy.block = 0;
      c.addTempCard('punch', 'belt');
      const before = c.enemy.hp;
      c.playCard(c.belt[c.belt.length - 1].card.uid);
      return before - c.enemy.hp;
    };
    const plain = punch();
    waitSpot();
    expect(c.hitWeakSpot()).toBe(true);
    expect(c.has('hero', 'crit')).toBe(true);
    expect(punch()).toBe(plain * CONFIG.critMult);
    expect(c.has('hero', 'crit')).toBe(false);
    expect(punch()).toBe(plain);
  });

  it('a virus costs 1 more, infects the card behind it after a second (once), and playing the card cures it', () => {
    const c = setup({ hp: 500, maxHp: 500, deck: deckOf(new Array(12).fill('punch')) });
    run(c, CONFIG.introTime + 0.01);
    const [front, behind] = [...c.belt].sort((a, b) => b.pos - a.pos);
    front.card.virus = { t: 0, spread: false };
    expect(c.cardCost(front.card)).toBe(CARDS.punch.cost + 1);
    run(c, CONFIG.virusDelay / 2);
    expect(behind.card.virus).toBeUndefined();
    run(c, CONFIG.virusDelay);
    expect(behind.card.virus).toBeDefined();
    expect(front.card.virus?.spread).toBe(true);
    c.hero.mana = c.hero.maxMana = 10;
    expect(c.playCard(front.card.uid)).toBe(true);
    expect(front.card.virus).toBeUndefined();
    expect(c.cardCost(front.card)).toBe(CARDS.punch.cost);
  });

  it('rust builds up on the belt, slows it down, stops it at full, and the mop scrubs it off', () => {
    const c = setup({ enemy: ENEMIES.facilitiesManager, hp: 500, maxHp: 500 });
    expect(c.rustsBelt).toBe(true);
    run(c, CONFIG.introTime + 0.01);
    const base = c.beltRate();
    run(c, 10);
    expect(c.rust).toBeGreaterThan(0);
    expect(c.beltRate()).toBeCloseTo(base * (1 - c.rust));
    c.rust = 1;
    expect(c.beltRate()).toBe(0);
    expect(c.wipeRust(0.3)).toBeCloseTo(0.3);
    expect(c.beltRate()).toBeCloseTo(base * 0.3);
    expect(c.wipeRust(5)).toBeCloseTo(0.7);
    expect(c.rust).toBe(0);
    expect(setup().rustsBelt).toBe(false);
  });

  it('sleeve slots come from the hero', () => {
    expect(setup({ hero: HEROES.warrior }).sleeve.length).toBe(1);
    expect(setup({ hero: HEROES.necromancer }).sleeve.length).toBe(3);
  });

  it('mana crystals raise the cap empty', () => {
    const c = setup({ deck: deckOf(['doubleEspresso', 'punch']) });
    run(c, CONFIG.introTime + 0.01);
    const max = c.hero.maxMana;
    const card = c.belt.find((b) => b.card.id === 'doubleEspresso')!.card;
    const mana = c.hero.mana;
    c.playCard(card.uid);
    expect(c.hero.maxMana).toBe(max + 2);
    expect(c.hero.mana).toBe(mana - 2);
  });

  it('mage Multitasking adds damage to chained spells', () => {
    const c = setup({ hero: HEROES.mage, hp: 70, maxHp: 70, deck: deckOf(['clippy', 'clippy']), enemy: ENEMIES.toxicCoworker });
    run(c, CONFIG.introTime + 0.01);
    c.hero.maxMana = c.hero.mana = 10;
    const hp = c.enemy.hp;
    c.playCard(c.belt[0].card.uid);
    c.playCard(c.belt[0].card.uid);
    expect(hp - c.enemy.hp).toBe(3 + 4);
  });

  it('played cards are never replaced in place: new cards always enter from the right', () => {
    // One row, so the spacing check below reads a single line of cards.
    const c = setup({ beltRows: 1, deck: deckOf(['punch', 'punch', 'punch', 'punch', 'punch', 'punch']) });
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
      const c = setup({ deck: deckOf(new Array(12).fill('punch')), enemy: ENEMIES.seniorBoomer });
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
    const c = setup({ hero: HEROES.necromancer, hp: 50, maxHp: 50, deck: deckOf(['rust', 'rust']), enemy: ENEMIES.seniorBoomer });
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

  it('sudo lifts every rule and rushes the belt for the time shown on the card', () => {
    const c = setup({ hero: HEROES.mage, deck: deckOf(['sudo', 'sudo']) });
    run(c, CONFIG.introTime + 0.01);
    c.hero.mana = 3;
    c.playCard(c.belt.find((b) => b.card.id === 'sudo')!.card.uid);
    expect(c.has('hero', 'rootAccess')).toBe(true);
    expect(c.has('hero', 'rush')).toBe(true);
    expect(c.hero.statuses.rush.t).toBeCloseTo(c.cardVals({ uid: 0, id: 'sudo', up: false })[1], 1);
  });

  it('a bomb that reaches the end of the belt explodes on the hero', () => {
    const c = setup({ deck: deckOf(['punch']) });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    c.addTempCard('deadline', 'belt');
    run(c, (CONFIG.beltTime * EXPIRE_POS) / c.beltRate() + 0.5);
    expect(c.hero.hp).toBe(80 - 10);
  });

  it('enemies use their main attack, then a special every N attacks', () => {
    const c = setup({ enemy: ENEMIES.seniorBoomer, hp: 999, maxHp: 999 });
    const seen: string[] = [];
    c.events.on((e) => {
      if (e.type === 'enemyAct') seen.push(e.move.id);
    });
    const { main, specials } = ENEMIES.seniorBoomer;
    run(c, CONFIG.introTime + 4 * main.windup + specials[0].windup + specials[1].windup + 1);
    // Specials rotate: Seniority, then Gatekeep.
    expect(seen.slice(0, 6)).toEqual(['boxCutter', 'boxCutter', 'seniority', 'boxCutter', 'boxCutter', 'gatekeep']);
  });

  it('abilities cost mana and cannot be used without it', () => {
    const c = setup();
    run(c, CONFIG.introTime + 0.01);
    c.hero.mana = HEROES.warrior.ability.cost - 1;
    expect(c.useAbility()).toBe(false);
  });

  it('synergy cards: Fortified Block holds, Counterstrike reads Block, Contagion reads Poison', () => {
    const c = setup({ deck: deckOf(['safetyRegs', 'grievance']) });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    c.hero.maxMana = 10;
    c.hero.mana = 10;
    c.playCard(c.belt.find((b) => b.card.id === 'safetyRegs')!.card.uid);
    const block = c.hero.block;
    run(c, 3);
    expect(c.hero.block).toBe(block);
    const hp = c.enemy.hp;
    c.hero.mana = 10;
    c.playCard(c.belt.find((b) => b.card.id === 'grievance')!.card.uid);
    expect(hp - c.enemy.hp).toBe(11);

    const n = setup({ hero: HEROES.necromancer, hp: 62, maxHp: 62, deck: deckOf(['wordOfMouth', 'wordOfMouth']) });
    run(n, CONFIG.introTime + 0.01);
    n.hero.mana = 6;
    n.playCard(n.belt[0].card.uid);
    n.playCard(n.belt[0].card.uid);
    expect(n.stacks('enemy', 'poison')).toBe(2 + 5);
  });

  it('rushing the belt makes cards arrive faster', () => {
    const count = (rush: boolean): number => {
      const c = setup({ deck: deckOf(new Array(20).fill('punch')) });
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
    const c = setup({ enemy: ENEMIES.toxicCoworker });
    c.addTempCard('drama', 'discard');
    expect(c.discard[0].uid).toBeLessThan(0);
  });

  it('every card has a play or expire effect (or is plain unplayable) and valid numbers', () => {
    for (const d of CARD_LIST) {
      expect(d.play || d.onExpire || d.keywords?.includes('unplayable'), d.id).toBeTruthy();
      if (d.upVals) expect(d.upVals.length, d.id).toBe(d.vals.length);
    }
  });

  it('a Pending card can only be played after its first full ride along the belt', () => {
    const c = setup({ beltRows: 1, deck: deckOf(['blastFurnace']) });
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

  it('the Security Monitor raises 30 Block the first time it falls under half HP', () => {
    const c = setup({ enemy: ENEMIES.securityMonitor });
    run(c, CONFIG.introTime + 0.01);
    c.enemy.block = 0;
    c.damage('hero', 'enemy', Math.ceil(c.enemy.maxHp / 2), { raw: true }, 'hero');
    expect(c.enemy.block).toBe(30);
  });

  it('the Snitch hurries the belt for the rest of the fight once under half HP', () => {
    const c = setup({ enemy: ENEMIES.snitch });
    run(c, CONFIG.introTime + 0.01);
    const base = c.beltRate();
    c.damage('hero', 'enemy', Math.ceil(c.enemy.maxHp / 2), { raw: true }, 'hero');
    expect(c.beltRate()).toBeCloseTo(base * CONFIG.beltHurry);
    run(c, 30);
    expect(c.has('hero', 'hurry')).toBe(true);
  });

  it("the CEO's emergency button stops the belt dead for 8s once he is under half HP", () => {
    const c = setup({ enemy: ENEMIES.slavesCeo });
    run(c, CONFIG.introTime + 0.01);
    c.enemy.block = 0;
    c.damage('hero', 'enemy', Math.ceil(c.enemy.maxHp / 2), { raw: true }, 'hero');
    expect(c.beltRate()).toBe(0);
    const pos = c.belt.map((b) => b.pos);
    run(c, 7);
    expect(c.belt.map((b) => b.pos)).toEqual(pos);
    run(c, 1.5);
    expect(c.beltRate()).toBeGreaterThan(0);
  });

  it('Crunch doubles the belt speed, then it wears off; the CEO casts it just before firing you', () => {
    const { specials } = ENEMIES.slavesCeo;
    expect(specials.at(-1)?.id).toBe('youreFired');
    expect(specials.at(-2)?.status?.[0]).toMatchObject({ id: 'crunch', t: 10 });
    const c = setup({ enemy: ENEMIES.slavesCeo });
    run(c, CONFIG.introTime + 0.01);
    const base = c.beltRate();
    c.applyStatus('hero', 'crunch', 1, 10);
    expect(c.beltRate()).toBeCloseTo(base * CONFIG.beltCrunch);
    run(c, 10.5);
    expect(c.beltRate()).toBeCloseTo(base);
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
      const c = quiet(['punch', 'punch']);
      expect(play(c, 'quickFavour')).toBe(true);
      expect(c.has('hero', 'stun')).toBe(true);
      expect(c.playCard(c.belt[0].card.uid)).toBe(false);
      expect(c.abilityReady()).toBe(false);
      run(c, 2.1);
      expect(c.playCard(c.belt[0].card.uid)).toBe(true);
    });

    it('Bare Minimum gains its Block every second, 1 more each second, until another card is played', () => {
      const c = quiet(['punch', 'punch']);
      play(c, 'bareMinimum');
      const start = CARDS.bareMinimum.vals[0];
      run(c, 3.01);
      // start + (start + 1) + (start + 2), less what the decay has taken meanwhile.
      expect(c.hero.block).toBeGreaterThanOrEqual(3 * start + 3 - 1);
      expect(c.hero.block).toBeLessThanOrEqual(3 * start + 3);
      c.playCard(c.belt[0].card.uid);
      expect(c.has('hero', 'bareMinimum')).toBe(false);
    });

    it('Grindset deals damage every second for its duration', () => {
      const c = quiet(['hardHat']);
      const hp = c.enemy.hp;
      play(c, 'grindset');
      run(c, 12.5);
      expect(hp - c.enemy.hp).toBe(3 * 12);
    });

    it('Priority Task holds its whole row; Lockout covers both rows ahead of it', () => {
      const c = quiet(new Array(10).fill('punch'));
      c.addTempCard('priorityTask', 'belt');
      const lock = c.belt.find((b) => b.card.id === 'priorityTask')!;
      const sameRow = c.belt.filter((b) => b !== lock && b.row === lock.row);
      const otherRow = c.belt.filter((b) => b.row !== lock.row);
      expect(sameRow.length).toBeGreaterThan(0);
      expect(sameRow.every((b) => c.isCovered(b.card.uid))).toBe(true);
      expect(otherRow.some((b) => c.isCovered(b.card.uid))).toBe(false);

      const d = quiet(new Array(10).fill('punch'));
      d.addTempCard('lockout', 'belt');
      run(d, 3);
      const gate = d.belt.find((b) => b.card.id === 'lockout')!;
      const ahead = d.belt.filter((b) => b.pos > gate.pos && b.pos - gate.pos < 2 * CONFIG.cardWidth);
      expect(new Set(ahead.map((b) => b.row)).size).toBe(2);
      expect(ahead.every((b) => d.isCovered(b.card.uid))).toBe(true);
    });

    it('Quiet Quitting exhausts the belt and hits once per card', () => {
      const c = quiet(new Array(10).fill('punch'));
      // The belt it exhausts doesn't include Quiet Quitting itself.
      const n = c.belt.length;
      const hp = c.enemy.hp;
      const discarded = c.discard.length;
      play(c, 'quietQuitting');
      expect(c.belt.length).toBe(0);
      expect(c.exhaust.length).toBeGreaterThanOrEqual(n);
      expect(c.discard.length).toBe(discarded);
      expect(hp - c.enemy.hp).toBe(CARDS.quietQuitting.vals[0] * n);
    });

    it('Previous Email repeats the last card, Copy Paste copies it over the belt', () => {
      const c = quiet(new Array(8).fill('hardHat'));
      play(c, 'punch');
      const hp = c.enemy.hp;
      play(c, 'previousEmail');
      expect(hp - c.enemy.hp).toBe(6);
      // A repeat doesn't count as the last card: a second one repeats the same Punch.
      play(c, 'previousEmail');
      expect(hp - c.enemy.hp).toBe(12);
      play(c, 'copyPaste');
      expect(c.belt.length).toBeGreaterThan(0);
      expect(c.belt.every((b) => b.card.id === 'punch' && b.card.temp)).toBe(true);
    });

    it('Not My Job skips the move being charged', () => {
      const c = setup({ enemy: ENEMIES.seniorBoomer });
      run(c, CONFIG.introTime + 1);
      c.hero.maxMana = c.hero.mana = 10;
      const before = c.enemy.moveCount;
      c.enemy.timer = 3;
      play(c, 'notMyJob');
      expect(c.enemy.timer).toBe(0);
      expect(c.enemy.moveCount).toBe(before);
    });

    it('Follow Up and Q1 put generated cards into the draw pile', () => {
      const c = quiet(['hardHat', 'hardHat']);
      play(c, 'followUp');
      expect(c.draw.filter((x) => x.id === 'alreadyDone').length).toBe(3);
      play(c, 'q1');
      expect(c.draw.some((x) => x.id === 'q2')).toBe(true);
    });

    it('a Drama that leaves the belt shuffles another one into the deck', () => {
      const c = quiet(['hardHat']);
      c.addTempCard('drama', 'belt');
      const dramas = (): number => [...c.draw, ...c.discard, ...c.belt.map((b) => b.card)].filter((x) => x.id === 'drama').length;
      expect(dramas()).toBe(1);
      run(c, (CONFIG.beltTime * EXPIRE_POS) / c.beltRate() + 0.5);
      expect(dramas()).toBe(2);
    });

    it('volatile office curses bite when they leave the belt', () => {
      const c = quiet(['hardHat']);
      c.addTempCard('officePlant', 'belt');
      c.addTempCard('pcLoadLetter', 'belt');
      c.hero.mana = 8;
      run(c, (CONFIG.beltTime * EXPIRE_POS) / c.beltRate() + 0.5);
      expect(c.has('hero', 'stun')).toBe(true);
      expect(c.hero.mana).toBeLessThan(8);
    });
  });

  describe('act 2 enemies', () => {
    const vs = (enemy: string, deck = new Array(12).fill('punch')): Combat => {
      const c = setup({ enemy: ENEMIES[enemy], deck: deckOf(deck), hp: 999, maxHp: 999 });
      run(c, CONFIG.introTime + 0.01);
      c.hero.maxMana = Math.min(c.hero.maxMana, c.manaCap());
      return c;
    };

    it('Meticulous Colleague: two cards in a row from the same lane are refused', () => {
      const c = vs('meticulousColleague');
      c.hero.mana = c.hero.maxMana = 10;
      const first = c.belt.find((b) => b.row === 0)!;
      expect(c.playCard(first.card.uid)).toBe(true);
      const same = c.belt.find((b) => b.row === 0);
      const other = c.belt.find((b) => b.row === 1)!;
      if (same) expect(c.playCard(same.card.uid)).toBe(false);
      expect(c.playCard(other.card.uid)).toBe(true);
    });

    it('Wellness Coach: one card every 2 seconds', () => {
      const c = vs('wellnessCoach');
      c.hero.mana = c.hero.maxMana = 10;
      expect(c.playCard(c.belt[0].card.uid)).toBe(true);
      expect(c.playCard(c.belt[0].card.uid)).toBe(false);
      run(c, 2.05);
      c.hero.mana = 10;
      expect(c.playCard(c.belt[0].card.uid)).toBe(true);
    });

    it('Bean Counter: max mana is frozen at 3, crystals included', () => {
      const c = vs('beanCounter', ['doubleEspresso', 'doubleEspresso', 'punch']);
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
      c.enemy.block = 0;
      expect(c.enemy.move.absorb).toBe(true);
      c.hero.mana = c.hero.maxMana = 10;
      const hp = c.enemy.hp;
      c.playCard(c.belt[0].card.uid);
      expect(c.enemy.hp).toBe(hp);
      expect(c.enemy.stored).toBe(6);
      // Numbers from the data, so rebalancing the Printer doesn't break the rule being tested.
      const { main, specials } = ENEMIES.printer;
      const printOut = specials[0].dmg ?? 0;
      run(c, main.windup);
      expect(c.enemy.move.release).toBe(true);
      expect(c.intentDamage(c.enemy.move)).toBe(printOut + 6);
      const heroHp = c.hero.hp;
      run(c, specials[0].windup + 0.1);
      expect(heroHp - c.hero.hp).toBe(printOut + 6);
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

describe('pop culture cards', () => {
  /** A fight past the intro with a quiet enemy and plenty of mana; `id` is put on the belt and returned. */
  const ready = (id: string): { c: Combat; uid: number } => {
    const c = setup({ deck: deckOf(Array(6).fill('punch')) });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    c.hero.mana = c.hero.maxMana = 10;
    c.addTempCard(id, 'belt');
    return { c, uid: c.belt[c.belt.length - 1].card.uid };
  };

  it("Take Credit: Block for you, and half the enemy's Block becomes yours", () => {
    const { c, uid } = ready('mrBurnsEmpire');
    c.enemy.block = 20;
    c.playCard(uid);
    expect(c.enemy.block).toBe(10);
    expect(c.hero.block).toBe(CARDS.mrBurnsEmpire.vals[0] + 10);
  });

  it('Team Change pins the cards on the belt where they are; new cards ride past them', () => {
    const { c, uid } = ready('teamChange');
    run(c, 4);
    const pinned = c.belt.filter((b) => b.card.uid !== uid).map((b) => ({ uid: b.card.uid, pos: b.pos }));
    expect(pinned.length).toBeGreaterThan(1);
    c.playCard(uid);
    run(c, 30);
    for (const p of pinned) expect(c.belt.find((b) => b.card.uid === p.uid)?.pos).toBe(p.pos);
    // Cards kept arriving meanwhile, and a pinned one can still be played.
    expect(c.belt.some((b) => !b.pinned)).toBe(true);
    expect(c.playCard(pinned[0].uid)).toBe(true);
  });

  it('Parkour!: dodge and a rushed belt, both wearing off', () => {
    const { c, uid } = ready('parkour');
    const base = c.beltRate();
    c.playCard(uid);
    expect(c.has('hero', 'dodge')).toBe(true);
    expect(c.beltRate()).toBeCloseTo(base * CONFIG.beltRush);
    run(c, CARDS.parkour.vals[1] + 0.5);
    expect(c.has('hero', 'dodge')).toBe(false);
    expect(c.beltRate()).toBeCloseTo(base);
  });

  it('Wind-Up Intern grows by a step for every swipe, up to its cap, and hits for what it has wound up to', () => {
    const { c, uid } = ready('windUpIntern');
    const { vals } = CARDS.windUpIntern;
    const [base, by, max] = vals;
    for (let i = 0; i < 20; i++) c.windCard(uid);
    expect(c.windCard(uid)).toBe(false);
    c.playCard(uid);
    expect(c.enemy.maxHp - c.enemy.hp).toBe(base + max);
    expect(by).toBeGreaterThan(0);
    expect(c.windCard(uid)).toBe(false);
  });

  it('Payday Loan hits hard and shuffles a Debt in; the Debt bites harder every time it slips off the belt', () => {
    const { c, uid } = ready('paydayLoan');
    c.belt.find((b) => b.card.uid === uid)!.card.passed = true;
    c.hero.hp = c.hero.maxHp = 500;
    c.playCard(uid);
    expect(c.enemy.maxHp - c.enemy.hp).toBe(CARDS.paydayLoan.vals[0]);
    const debt = c.draw.find((x) => x.id === 'debt')!;
    expect(debt).toBeDefined();
    const [bite, more] = CARDS.debt.vals;
    c.belt.length = 0;
    c.belt.push({ card: debt, pos: EXPIRE_POS, row: 0 });
    run(c, 0.05);
    expect(500 - c.hero.hp).toBe(bite);
    expect(c.cardVals(debt)[0]).toBe(bite + more);
    c.belt.push({ card: debt, pos: EXPIRE_POS, row: 0 });
    run(c, 0.05);
    expect(500 - c.hero.hp).toBe(bite + bite + more);
  });

  it('Workaholic: Strength that lasts only for a while', () => {
    const { c, uid } = ready('stakhanov');
    const dmg = (): number => c.previewHeroDamage(10, CARDS.punch);
    c.playCard(uid);
    expect(dmg()).toBe(10 + CARDS.stakhanov.vals[0]);
    run(c, CARDS.stakhanov.vals[1] + 0.5);
    expect(dmg()).toBe(10);
  });

  it('Brown Noser: mana refills twice as fast for a while', () => {
    const { c, uid } = ready('brownNoser');
    const gained = (seconds: number): number => {
      c.hero.mana = 0;
      c.hero.manaTimer = 0;
      run(c, seconds);
      return c.hero.mana;
    };
    const normal = gained(6);
    c.playCard(uid);
    c.hero.mana = 0;
    expect(gained(6)).toBeGreaterThan(normal * 1.8);
    run(c, CARDS.brownNoser.vals[0]);
    expect(gained(6)).toBe(normal);
  });

  it('Severance: Strength, then cards slipping off the belt play themselves for free', () => {
    const { c, uid } = ready('severance');
    c.playCard(uid);
    expect(c.stacks('hero', 'strength')).toBe(3);
    const hp = c.enemy.hp;
    const played = c.cardsPlayed;
    c.hero.mana = c.hero.maxMana = 0;
    run(c, 8.9);
    expect(c.cardsPlayed).toBeGreaterThan(played);
    expect(c.enemy.hp).toBeLessThan(hp);
  });

  it('Ctrl+Z heals back the HP lost in the last few seconds', () => {
    const { c, uid } = ready('ctrlZ');
    c.damage('enemy', 'hero', 10, { raw: true }, 'enemy');
    run(c, 6);
    c.damage('enemy', 'hero', 7, { raw: true }, 'enemy');
    const hp = c.hero.hp;
    c.playCard(uid);
    expect(c.hero.hp).toBe(hp + 7);
  });

  it('Unlimited PTO heals over time but stuns you meanwhile', () => {
    const { c, uid } = ready('unlimitedPto');
    c.hero.hp = 40;
    c.playCard(uid);
    expect(c.has('hero', 'stun')).toBe(true);
    expect(c.playCard(c.belt[0].card.uid)).toBe(false);
    run(c, 10);
    // Regeneration n heals n, n-1, … 1.
    const n = CARDS.unlimitedPto.vals[0];
    expect(c.hero.hp).toBe(40 + (n * (n + 1)) / 2);
  });

  it('Hide the Pain gains more Block the more HP you are missing', () => {
    const { c, uid } = ready('hideThePain');
    c.hero.hp = c.hero.maxHp - 20;
    c.playCard(uid);
    expect(c.hero.block).toBe(5 + 5);
  });

  it('Pushback reflects damage for 3s, 6s once upgraded', () => {
    const { c, uid } = ready('pushback');
    c.playCard(uid);
    expect(c.hero.statuses.parry.t).toBeCloseTo(3, 1);
    expect(c.cardVals({ uid: 0, id: 'pushback', up: true })[2]).toBe(6);
  });

  it('Turn It Off stuns you for 3s and shuffles Turn It On into the deck, which gives 4 mana', () => {
    const { c, uid } = ready('turnItOff');
    c.playCard(uid);
    expect(c.has('hero', 'stun')).toBe(true);
    expect(c.hero.statuses.stun.t).toBeCloseTo(3, 1);
    const on = c.draw.find((x) => x.id === 'turnItOn');
    expect(on).toBeTruthy();
    run(c, 3.1);
    c.hero.mana = 0;
    c.hero.maxMana = 10;
    c.addTempCard('turnItOn', 'belt');
    c.playCard(c.belt[c.belt.length - 1].card.uid);
    expect(c.hero.mana).toBe(4);
  });

  it('sudo lets cards through any rule, even a stun', () => {
    const { c, uid } = ready('sudo');
    c.playCard(uid);
    c.applyStatus('hero', 'stun', 1, 5);
    expect(c.ruleBlock(c.belt[0].card)).toBeNull();
    expect(c.playCard(c.belt[0].card.uid)).toBe(true);
  });
});

describe('run pay', () => {
  it('pays a base by tier plus a bonus for every second under par', () => {
    expect(fightPay('normal', CONFIG.pay.par + 20)).toBe(CONFIG.pay.normal);
    expect(fightPay('normal', CONFIG.pay.par - 10)).toBe(CONFIG.pay.normal + 10 * CONFIG.pay.perSecond);
    expect(fightPay('boss', 0)).toBe(CONFIG.pay.boss + CONFIG.pay.par * CONFIG.pay.perSecond);
  });
});

describe('cards that change on the belt', () => {
  const onBelt = (id: string): { c: Combat; uid: number } => {
    const c = setup({ deck: deckOf(Array(6).fill('punch')) });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    c.hero.mana = c.hero.maxMana = 10;
    c.addTempCard(id, 'belt');
    return { c, uid: c.belt[c.belt.length - 1].card.uid };
  };
  const card = (c: Combat, uid: number) => [...c.belt.map((b) => b.card), ...c.sleeve].find((x) => x?.uid === uid)!;

  it('Unpaid Overtime hits harder for every second it rides the belt, up to its cap', () => {
    const { c, uid } = onBelt('unpaidOvertime');
    const [start, step] = CARDS.unpaidOvertime.vals;
    expect(c.cardVals(card(c, uid))[0]).toBe(start);
    run(c, 3.05);
    expect(c.cardVals(card(c, uid))[0]).toBe(start + 3 * step);
    const hp = c.enemy.hp;
    c.playCard(uid);
    expect(hp - c.enemy.hp).toBe(start + 3 * step);
  });

  it('Patience gives less Block the longer it rides, never below its floor, and the sleeve freezes it', () => {
    const { c, uid } = onBelt('patience');
    const [start, step, floor] = CARDS.patience.vals;
    run(c, 2.05);
    expect(c.cardVals(card(c, uid))[0]).toBe(start - 2 * step);
    c.stash(uid, 0);
    run(c, 5);
    expect(c.cardVals(card(c, uid))[0]).toBe(start - 2 * step);
    c.playCard(uid);
    expect(c.hero.block).toBe(start - 2 * step);
    const late = { uid: 999, id: 'patience', up: false, age: 60 };
    expect(c.cardVals(late)[0]).toBe(floor);
  });
});

describe('sleeve cards', () => {
  const held = (id: string): Combat => {
    const c = setup({ deck: deckOf(Array(6).fill('punch')) });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    c.hero.mana = c.hero.maxMana = 10;
    c.addTempCard(id, 'belt');
    c.stash(c.belt[c.belt.length - 1].card.uid, 0);
    expect(c.sleeve[0]?.id).toBe(id);
    return c;
  };

  it('Tool Belt: attacks deal more while it waits in the sleeve', () => {
    const c = held('toolBelt');
    const hp = c.enemy.hp;
    c.playCard(c.belt[0].card.uid);
    expect(hp - c.enemy.hp).toBe(6 + 1);
    c.playCard(c.sleeve[0]!.uid);
    expect(c.hero.block).toBe(4);
  });

  it('Cache: every spell played while it waits is cached into its damage, spent when played', () => {
    const c = held('cache');
    c.addTempCard('clippy', 'belt');
    c.playCard(c.belt[c.belt.length - 1].card.uid);
    const [base, grow] = CARDS.cache.vals;
    expect(c.cardVals(c.sleeve[0]!)[0]).toBe(base + grow);
    const cache = c.sleeve[0]!;
    const hp = c.enemy.hp;
    c.playCard(cache.uid);
    expect(hp - c.enemy.hp).toBeGreaterThanOrEqual(base + grow);
    expect(cache.bonus).toBe(0);
  });

  it('Burn Book: every hit you take while it waits adds Poison to the card, spent when played', () => {
    const c = held('burnBook');
    const [base, grow] = CARDS.burnBook.vals;
    c.damage('enemy', 'hero', 5, {}, 'enemy');
    c.damage('enemy', 'hero', 5, {}, 'enemy');
    expect(c.cardVals(c.sleeve[0]!)[0]).toBe(base + 2 * grow);
    const book = c.sleeve[0]!;
    c.playCard(book.uid);
    expect(c.stacks('enemy', 'poison')).toBe(base + 2 * grow);
    expect(book.bonus).toBe(0);
  });
});

describe('the Overthinker', () => {
  it('loses its train of thought (and its big hit) after taking enough damage while it charges', () => {
    const c = setup({ enemy: ENEMIES.overthinker, deck: deckOf(Array(6).fill('punch')) });
    run(c, CONFIG.introTime + 1);
    expect(c.enemy.move.id).toBe('bigIdea');
    c.damage('hero', 'enemy', 14, { raw: true }, 'hero');
    expect(c.enemy.move.id).toBe('bigIdea');
    c.damage('hero', 'enemy', 12, { raw: true }, 'hero');
    expect(c.enemy.move.id).toBe('whereWasI');
    const hp = c.hero.hp;
    run(c, 4.1);
    expect(c.hero.hp).toBe(hp);
    expect(c.enemy.move.id).toBe('bigIdea');
  });
});

describe('Work-Life Balance', () => {
  it('hits again with every card played until two of the same colour come in a row', () => {
    const c = setup({ deck: deckOf(Array(6).fill('punch')) });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    c.hero.mana = c.hero.maxMana = 10;
    const play = (id: string): void => {
      c.addTempCard(id, 'belt');
      c.playCard(c.belt[c.belt.length - 1].card.uid);
    };
    play('workLifeBalance');
    let hp = c.enemy.hp;
    play('hardHat');
    expect(hp - c.enemy.hp).toBe(3);
    hp = c.enemy.hp;
    play('hardHat');
    expect(hp - c.enemy.hp).toBe(0);
    expect(c.has('hero', 'workLifeBalance')).toBe(false);
  });
});

describe('Complaint Box', () => {
  it('grows by 1 for every second of overflowing mana, even in the draw pile', () => {
    const c = setup({ deck: deckOf(['punch', 'punch', 'complaintBox']) });
    run(c, CONFIG.introTime + 0.01);
    c.hero.mana = c.hero.maxMana;
    run(c, 3.05);
    const box = [...c.draw, ...c.discard, ...c.belt.map((b) => b.card)].find((x) => x.id === 'complaintBox')!;
    expect(c.cardVals(box)[0]).toBeGreaterThanOrEqual(1 + 3);
  });
});

describe('the very first run', () => {
  it('has one enemy per floor, whichever lane it takes, and the rests are split between the lanes', () => {
    const run = newRun('warrior', 1, true);
    const fights = run.nodes.filter((n) => n.type === 'fight');
    const floors = [...new Set(fights.map((n) => n.floor))];
    for (const f of floors) expect(new Set(fights.filter((n) => n.floor === f).map((n) => n.enemy)).size).toBe(1);
    const pool = ['hrOrientationVideo', ...enemiesFor(1, 'normal').map((e) => e.id)];
    expect(fights.every((n) => pool.includes(n.enemy!))).toBe(true);
    for (const lane of [0, 1]) {
      const types = run.nodes.filter((n) => n.lane === lane).map((n) => n.type);
      expect(types).toContain('rest');
      expect(types.some((t, i) => t === 'rest' && types[i + 1] === 'rest')).toBe(false);
    }
  });
});

describe('saves from before the ids followed the English names', () => {
  it('load with their cards, perks and enemies renamed', () => {
    const store = new Map<string, string>();
    const stub = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    Object.defineProperty(globalThis, 'localStorage', { value: stub, configurable: true });
    const run = newRun('warrior', 7);
    const old = {
      ...run,
      version: 2,
      deck: [
        { uid: 1, id: 'strike', up: false },
        { uid: 2, id: 'manaGeode', up: true, perks: ['innate', 'discount'] },
      ],
      nodes: run.nodes.map((n) => (n.enemy ? { ...n, enemy: 'rat' } : n)),
    };
    store.set('cardstone+:run', JSON.stringify(old));
    const loaded = loadRun();
    expect(loaded?.version).toBe(3);
    expect(loaded?.deck).toEqual([
      { uid: 1, id: 'punch', up: false },
      { uid: 2, id: 'doubleEspresso', up: true, perks: ['fastTrack', 'budgetCut'] },
    ]);
    expect(loaded?.nodes.filter((n) => n.enemy).every((n) => n.enemy === 'snitch')).toBe(true);
    Reflect.deleteProperty(globalThis, 'localStorage');
  });
});

describe('cards that fill the classes out', () => {
  /** A fight where nothing happens by itself, the hero rich in mana. */
  const quiet = (over: Partial<CombatSetup> = {}): Combat => {
    const c = setup({ deck: deckOf(Array(6).fill('punch')), ...over });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    c.hero.mana = c.hero.maxMana = 10;
    return c;
  };
  /** Puts a card on the belt and plays it, free. */
  const cast = (c: Combat, id: string, up = false): void => {
    c.addTempCard(id, 'belt', up);
    expect(c.playCard(c.belt[c.belt.length - 1].card.uid, true)).toBe(true);
  };

  it('Rivet Gun: Strength counts on every rivet', () => {
    const c = quiet();
    c.applyStatus('hero', 'strength', 2);
    const hp = c.enemy.hp;
    cast(c, 'releaseTheHounds');
    const [dmg, hits] = CARDS.releaseTheHounds.vals;
    expect(hp - c.enemy.hp).toBe((dmg + 2) * hits);
  });

  it('Barbed Wire: gives Block and Thorns, which hit back every enemy hit', () => {
    const c = quiet();
    cast(c, 'barbedWire');
    const [block, thorns] = CARDS.barbedWire.vals;
    expect(c.hero.block).toBe(block);
    expect(c.stacks('hero', 'thorns')).toBe(thorns);
    const hp = c.enemy.hp;
    c.damage('enemy', 'hero', 3, {}, 'enemy');
    c.damage('enemy', 'hero', 3, {}, 'enemy');
    expect(hp - c.enemy.hp).toBe(2 * thorns);
  });

  it('Blow Off Steam: all the Block goes, for damage times its value', () => {
    const c = quiet();
    c.gainBlock('hero', 10);
    const hp = c.enemy.hp;
    cast(c, 'blowOffSteam');
    expect(c.hero.block).toBe(0);
    expect(hp - c.enemy.hp).toBe(10 * CARDS.blowOffSteam.vals[0]);
  });

  it('Steel Toes: attacks give Block, other cards do not', () => {
    const c = quiet();
    cast(c, 'steelToes');
    const per = CARDS.steelToes.vals[0];
    expect(c.hero.block).toBe(0);
    cast(c, 'punch');
    expect(c.hero.block).toBe(per);
    cast(c, 'hardHat');
    expect(c.hero.block).toBe(per + CARDS.hardHat.vals[0]);
  });

  it('Overstock: Block for every mana spent', () => {
    const c = quiet();
    c.hero.mana = 4;
    cast(c, 'overstock');
    expect(c.hero.block).toBe(CARDS.overstock.vals[0] * 4);
  });

  it('Continuing Education: spells hit harder for good', () => {
    const c = quiet({ hero: HEROES.mage });
    cast(c, 'continuingEducation');
    const hp = c.enemy.hp;
    cast(c, 'staticShock');
    expect(hp - c.enemy.hp).toBe(CARDS.staticShock.vals[0] + CARDS.continuingEducation.vals[0]);
  });

  it('Thermal Shock: only a Chilled and Burning enemy takes the big hit, and the Chill is spent', () => {
    const c = quiet({ hero: HEROES.mage });
    const [small, big] = CARDS.thermalShock.vals;
    c.applyStatus('enemy', 'chill', 1, 20);
    let hp = c.enemy.hp;
    cast(c, 'thermalShock');
    expect(hp - c.enemy.hp).toBeLessThan(big);
    expect(c.has('enemy', 'chill')).toBe(true);
    c.applyStatus('enemy', 'burn', 1);
    hp = c.enemy.hp;
    cast(c, 'thermalShock');
    expect(hp - c.enemy.hp).toBeGreaterThanOrEqual(big);
    expect(hp - c.enemy.hp).toBeGreaterThan(small + 10);
    expect(c.has('enemy', 'chill')).toBe(false);
  });

  it('Cheap Shot hits harder on a Weak enemy, Hazmat Suit turns Poison into Block, Healthcare Plan regenerates', () => {
    const c = quiet({ hero: HEROES.necromancer });
    let hp = c.enemy.hp;
    cast(c, 'cheapShot');
    expect(hp - c.enemy.hp).toBe(CARDS.cheapShot.vals[0]);
    c.applyStatus('enemy', 'weak', 1, 20);
    hp = c.enemy.hp;
    cast(c, 'cheapShot');
    expect(hp - c.enemy.hp).toBe(CARDS.cheapShot.vals[1]);
    c.applyStatus('enemy', 'poison', 9);
    cast(c, 'hazmatSuit');
    expect(c.hero.block).toBe(9);
    cast(c, 'healthcarePlan');
    expect(c.stacks('hero', 'regen')).toBe(CARDS.healthcarePlan.vals[0]);
  });

  it('Petri Dish: every card played while it waits in the sleeve grows its Poison, spent when played', () => {
    const c = quiet({ hero: HEROES.necromancer });
    c.addTempCard('petriDish', 'belt');
    c.stash(c.belt[c.belt.length - 1].card.uid, 0);
    const [base, grow] = CARDS.petriDish.vals;
    cast(c, 'skeletonCrew');
    cast(c, 'skeletonCrew');
    const dish = c.sleeve[0]!;
    expect(c.cardVals(dish)[0]).toBe(base + 2 * grow);
    c.playCard(dish.uid);
    expect(c.stacks('enemy', 'poison')).toBe(base + 2 * grow);
    expect(dish.bonus).toBe(0);
  });

  it('Rehire: brings exhausted cards back to the draw pile, never consumed ones', () => {
    const c = quiet({ hero: HEROES.necromancer });
    const exhausted = (id: string, uid: number): void => void c.exhaust.push({ uid, id, up: false, bonus: 0, temp: false });
    exhausted('coffee', 901);
    exhausted('walkout', 902);
    exhausted('firstAidKit', 903);
    c.consumed.push(903);
    cast(c, 'sisyphus');
    // What stays exhausted: the consumed potion and Rehire itself.
    expect(c.exhaust.map((x) => x.uid).sort()).toEqual([-1, 903]);
    expect(c.draw.map((x) => x.uid)).toEqual(expect.arrayContaining([901, 902]));
  });
});

describe('Fine Print and the Golden Parachute', () => {
  const vs = (enemy: string): Combat => {
    const c = setup({ enemy: ENEMIES[enemy], deck: deckOf(Array(6).fill('punch')), hp: 999, maxHp: 999 });
    c.enemy.move = { id: 'wait', intent: 'defend', windup: 999 };
    run(c, CONFIG.introTime + 0.01);
    return c;
  };

  it('Contract Lawyer: every hit of a card loses the Fine Print, Poison and Burn go through whole', () => {
    const c = vs('contractLawyer');
    const cut = c.stacks('enemy', 'finePrint');
    expect(cut).toBeGreaterThan(0);
    expect(c.previewHeroDamage(6, CARDS.punch)).toBe(6 - cut);
    const hp = c.enemy.hp;
    c.hit(6, { hits: 3 });
    expect(hp - c.enemy.hp).toBe(3 * (6 - cut));
    c.applyStatus('enemy', 'poison', 4);
    const before = c.enemy.hp;
    run(c, CONFIG.dotInterval + 0.05);
    expect(before - c.enemy.hp).toBe(4);
    // A hit smaller than the cut deals nothing, never heals.
    const now = c.enemy.hp;
    c.hit(1);
    expect(c.enemy.hp).toBe(now);
  });

  it('Outgoing VP: the first lethal hit only retires him, the second one wins', () => {
    const c = vs('outgoingVp');
    expect(c.has('enemy', 'goldenParachute')).toBe(true);
    c.enemy.block = 0;
    c.damage('hero', 'enemy', 999, { raw: true }, 'hero');
    expect(c.result).toBeNull();
    expect(c.has('enemy', 'goldenParachute')).toBe(false);
    expect(c.enemy.hp).toBe(Math.round(c.enemy.maxHp * 0.4));
    expect(c.enemy.block).toBeGreaterThan(0);
    expect(c.stacks('enemy', 'strength')).toBeGreaterThan(0);
    c.enemy.block = 0;
    c.damage('hero', 'enemy', 999, { raw: true }, 'hero');
    expect(c.result).toBe('win');
  });
});

describe('the Copy Room', () => {
  it('shreds a card for good, but never below the smallest deck', () => {
    const r = newRun('warrior', 5);
    expect(canShred(r)).toBe(true);
    const gone = r.deck[0];
    shredCard(r, gone.uid);
    expect(r.deck.some((c) => c.uid === gone.uid)).toBe(false);
    while (r.deck.length > SHRED_MIN_DECK) shredCard(r, r.deck[0].uid);
    expect(canShred(r)).toBe(false);
  });

  it('photocopies a card with its upgrade and perks, for HP', () => {
    const r = newRun('warrior', 5);
    Object.assign(r.deck[0], { up: true, perks: ['fastTrack'] });
    const before = r.deck.length;
    const hp = r.hp;
    photocopyCard(r, r.deck[0].uid);
    const copy = r.deck[r.deck.length - 1];
    expect(r.deck).toHaveLength(before + 1);
    expect(copy).toMatchObject({ id: r.deck[0].id, up: true, perks: ['fastTrack'] });
    expect(copy.uid).not.toBe(r.deck[0].uid);
    expect(r.hp).toBe(hp - COPY_HP_COST);
    r.hp = COPY_HP_COST;
    expect(canCopy(r)).toBe(false);
  });

  it('shows up once per act on a random map, never in the very first run', () => {
    const r = newRun('warrior', 5);
    for (const act of [1, 2]) expect(r.nodes.filter((n) => n.act === act && n.type === 'copy')).toHaveLength(1);
    expect(newRun('warrior', 1, true).nodes.some((n) => n.type === 'copy')).toBe(false);
  });
});
