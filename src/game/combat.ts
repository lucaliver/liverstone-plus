import { Emitter } from '../core/emitter';
import { Rng } from '../core/rng';
import { CONFIG, EXPIRE_POS } from '../data/config';
import { STATUSES } from '../data/statuses';
import { CARDS, cardCategory, cardCostOf, cardKeywordsOf, cardValsOf } from '../data/cards';
import { HEXES } from '../data/hexes';
import { RELICS } from '../data/relics';
import type { TKey } from '../core/i18n';
import type {
  BeltCard,
  CardDef,
  CardInst,
  CombatCard,
  CombatEvent,
  CombatResult,
  EnemyDef,
  HeroDef,
  MoveDef,
  RustSpot,
  Side,
  StatusDef,
  Keyword,
  Statuses,
} from './types';

const isCurse = (c: CardInst): boolean => CARDS[c.id].type === 'curse';

export interface Fighter {
  hp: number;
  maxHp: number;
  block: number;
  statuses: Statuses;
  blockTimer: number;
  dotTimer: number;
  /** Seconds per decay step of Block. */
  blockDecay: number;
}

export interface HeroState extends Fighter {
  mana: number;
  maxMana: number;
  /** Seconds per mana point. */
  regen: number;
  manaTimer: number;
}

export interface EnemyState extends Fighter {
  def: EnemyDef;
  move: MoveDef;
  /** Seconds accumulated towards the current move's wind-up. */
  timer: number;
  moveCount: number;
  /** Main attacks left before the next special move. */
  mainsLeft: number;
  /** Index of the next special move. */
  specialIdx: number;
  halfTriggered: boolean;
  dmgScale: number;
  /** Damage stored by an absorbing move, dealt back by the next releasing one. */
  stored: number;
  /** Free-form state for custom AIs. */
  mem: Record<string, number>;
}

export interface CombatSetup {
  hero: HeroDef;
  hp: number;
  maxHp: number;
  deck: CardInst[];
  relics: string[];
  /** Persistent per-run relic flags (e.g. a once-per-run revive). Mutated in place. */
  relicFlags: Record<string, number>;
  enemy: EnemyDef;
  scale: { hp: number; dmg: number };
  seed: number;
  /** Extra max mana from the run (e.g. Evocation is per-combat, events are permanent). */
  bonusMaxMana?: number;
  /** Belt rows (default `CONFIG.beltRows`). With two rows cards alternate between them and the belt runs a bit slower. */
  beltRows?: number;
  /** Run-wide belt speed multiplier (memos). */
  beltMul?: number;
}

interface DamageOpts {
  hits?: number;
  kind?: string;
  /** Skip attacker modifiers (thorns, DoTs, flat item damage). */
  raw?: boolean;
  ignoreBlock?: boolean;
}

export class Combat {
  readonly events = new Emitter<CombatEvent>();
  readonly rng: Rng;
  readonly heroDef: HeroDef;
  readonly relics: string[];
  readonly relicFlags: Record<string, number>;

  time = 0;
  intro: number = CONFIG.introTime;
  result: CombatResult | null = null;

  hero: HeroState;
  enemy: EnemyState;

  draw: CombatCard[] = [];
  discard: CombatCard[] = [];
  exhaust: CombatCard[] = [];
  belt: BeltCard[] = [];
  readonly beltRows: number;
  /** Belt rows cards can spawn on right now (an enemy may keep some shut for a while). */
  rowsOpen: number;
  sleeve: (CombatCard | null)[];

  /** Time accumulated towards the next regular draw onto the belt. */
  private spawnClock = 0;
  /** Seconds the belt still stands before it turns around, and how many turns it was asked for meanwhile (two cancel out). */
  private beltHalt = 0;
  private beltTurns = 0;
  private regenMul = 1;
  private runBeltMul = 1;
  /** Deck uids permanently removed (potions). */
  consumed: number[] = [];
  cardsPlayed = 0;
  /** The last card the hero played this fight (rules such as "not the same type twice"). */
  lastPlayed: CardDef | null = null;
  /** Fight time not yet counted as a whole second (see `costDrop`). */
  private second = 0;
  /** Seconds of mana overflow not yet turned into growth (see `onOverflow`). */
  private overflow = 0;
  /** The hero's recent HP losses (fight time, amount), for effects that undo them (Ctrl+Z). */
  private hurtLog: { t: number; n: number }[] = [];
  lastPlayedAt = -Infinity;
  /** Belt row the last card was played from (-1: the sleeve, or nothing yet). */
  lastRow = -1;
  /** The last card played and the values it resolved with, so it can be repeated (a repeat itself doesn't count). */
  private lastPlay: { card: CombatCard; def: CardDef; vals: number[] } | null = null;
  private replaying = false;
  /** Card currently resolving, so effect helpers know its type. */
  private current: { card: CombatCard; def: CardDef; row: number } | null = null;
  /** A target on the enemy's sprite (x, y: where, as a share of the drawing; t: seconds left). Tapped in time, it makes the hero's next attack critical. */
  weakSpot: { x: number; y: number; t: number } | null = null;
  /** Rust spots on the belt: each slows it down, enough stop it. The hero scrubs them off (`scrubRust`). */
  rustSpots: RustSpot[] = [];
  private rustClock = 0;
  private rustId = 0;
  /** Free-form per-combat state for relics and powers. */
  mem: Record<string, number> = {};
  private tempUid = 0;

  constructor(setup: CombatSetup) {
    this.rng = new Rng(setup.seed);
    this.heroDef = setup.hero;
    this.relics = setup.relics;
    this.relicFlags = setup.relicFlags;
    this.beltRows = setup.beltRows ?? CONFIG.beltRows;
    this.rowsOpen = Math.min(setup.enemy.startRows ?? this.beltRows, this.beltRows);
    const h = setup.hero;

    let maxMana = h.maxMana + (setup.bonusMaxMana ?? 0);
    let sleeve = h.sleeve;
    let regenMul = 1;
    for (const id of this.relics) {
      const m = RELICS[id]?.mods;
      if (!m) continue;
      maxMana += m.maxMana ?? 0;
      sleeve += m.sleeve ?? 0;
      regenMul *= m.regen ?? 1;
    }
    this.regenMul = regenMul;
    this.runBeltMul = setup.beltMul ?? 1;

    this.hero = {
      hp: setup.hp,
      maxHp: setup.maxHp,
      block: 0,
      statuses: {},
      blockTimer: 0,
      dotTimer: 0,
      blockDecay: h.blockDecay,
      mana: Math.min(CONFIG.startMana, maxMana),
      maxMana: Math.min(maxMana, CONFIG.maxManaCap),
      regen: h.regen,
      manaTimer: 0,
    };
    this.sleeve = new Array(sleeve).fill(null);

    const e = setup.enemy;
    // Round HP to 5s: scaled numbers stay easy to read.
    const maxHp = Math.max(5, Math.round((e.hp * setup.scale.hp) / 5) * 5);
    this.enemy = {
      def: e,
      hp: maxHp,
      maxHp,
      block: e.block ?? 0,
      statuses: {},
      blockTimer: 0,
      dotTimer: 0,
      blockDecay: CONFIG.enemyBlockDecay,
      move: e.main,
      timer: 0,
      moveCount: 0,
      mainsLeft: e.every,
      specialIdx: 0,
      halfTriggered: false,
      dmgScale: setup.scale.dmg,
      stored: 0,
      mem: {},
    };
    this.enemy.move = this.nextEnemyMove();
    for (const s of e.start ?? []) this.applyStatus('enemy', s.id, s.v ?? 1, s.t ?? 0, true);
    const box = e.fillSleeve;
    if (box) this.sleeve = this.sleeve.map(() => ({ uid: -++this.tempUid, id: box, up: false, bonus: 0, temp: true }));
    this.hero.maxMana = Math.min(this.hero.maxMana, this.manaCap());
    this.hero.mana = Math.min(this.hero.mana, this.hero.maxMana);

    this.draw = this.rng.shuffle(setup.deck.map((c) => ({ ...c, bonus: 0, temp: false })));
    // Innate cards go on top of the draw pile (the end of the array), so they reach the belt first.
    const innate = this.draw.filter((c) => this.keywords(c).includes('innate'));
    this.draw = [...this.draw.filter((c) => !innate.includes(c)), ...innate];

    for (const id of this.relics) RELICS[id]?.hooks?.onCombatStart?.(this);
    // Prewarm: run the belt on its own until the first card reaches `prewarm`, so the fight starts with
    // the right side filled at the normal spacing (and a second row alternating) without crowding it.
    this.spawnClock = Infinity;
    const step = 1 / 60;
    for (let t = 0; t < (CONFIG.prewarm * CONFIG.beltTime) / this.beltRate(); t += step) this.tickBelt(step);
    if (e.startHex) this.hexCards(e.startHex.id, e.startHex.share);
  }

  // ---------------------------------------------------------------- queries

  get isOver(): boolean {
    return this.result !== null;
  }

  fighter(side: Side): Fighter {
    return side === 'hero' ? this.hero : this.enemy;
  }

  has(side: Side, id: string): boolean {
    const s = this.fighter(side).statuses[id];
    return !!s && (STATUSES[id].kind === 'timed' ? s.t > 0 : s.v > 0);
  }

  /** The product of a speed or damage factor over the side's active statuses (1 when none has it). */
  private mul(side: Side, key: 'timeMul' | 'beltMul' | 'dealtMul' | 'takenMul' | 'regenMul'): number {
    let r = 1;
    for (const id of Object.keys(this.fighter(side).statuses)) {
      const m = STATUSES[id][key];
      if (m !== undefined && this.has(side, id)) r *= m;
    }
    return r;
  }

  /** How close the enemy is to something its statuses count down to, 0 to 1 (the belt reddens). */
  enemyWarning(): number {
    let w = 0;
    for (const [id, s] of Object.entries(this.enemy.statuses)) {
      const warn = STATUSES[id].warning;
      if (warn && this.has('enemy', id)) w = Math.max(w, warn(this, s));
    }
    return Math.min(1, w);
  }

  /** Whether the side takes no damage right now (Dodge). */
  isImmune(side: Side): boolean {
    return this.flag(side, 'immune');
  }

  /** Whether any active status of the side carries this rule flag. */
  private flag(side: Side, key: 'holdsBlock' | 'immune' | 'ignoresRules' | 'autoplay'): boolean {
    return Object.keys(this.fighter(side).statuses).some((id) => STATUSES[id][key] && this.has(side, id));
  }

  stacks(side: Side, id: string): number {
    return this.fighter(side).statuses[id]?.v ?? 0;
  }

  cardVals(card: CardInst & { bonus?: number; age?: number }): number[] {
    return cardValsOf(card);
  }

  cardCost(card: CardInst): number {
    return cardCostOf(card);
  }

  canAfford(card: CardInst): boolean {
    const cost = this.cardCost(card);
    return cost < 0 ? this.hero.mana > 0 : this.hero.mana >= cost;
  }

  isPlayable(card: CardInst): boolean {
    const def = CARDS[card.id];
    return !this.keywords(card).includes('unplayable') && !!def.play;
  }

  keywords(card: CardInst): Keyword[] {
    return cardKeywordsOf(card);
  }

  private beltIndex(uid: number): number {
    return this.belt.findIndex((b) => b.card.uid === uid);
  }

  private sleeveIndex(uid: number): number {
    return this.sleeve.findIndex((c) => c?.uid === uid);
  }

  /** Belt row of a card, or -1 when it's not on the belt (sleeve). */
  rowOf(uid: number): number {
    return this.belt[this.beltIndex(uid)]?.row ?? -1;
  }

  /** The highest max mana allowed right now (statuses such as a Spending Freeze lower it). */
  manaCap(): number {
    let cap: number = CONFIG.maxManaCap;
    for (const side of ['hero', 'enemy'] as const) {
      for (const id of Object.keys(this.fighter(side).statuses)) {
        const c = STATUSES[id].manaCap;
        if (c !== undefined && this.has(side, id)) cap = Math.min(cap, c);
      }
    }
    return cap;
  }

  /** A Pending card can't be played (or stashed) until it has ridden the whole belt once this fight. */
  isPending(card: CombatCard): boolean {
    return !card.passed && this.keywords(card).includes('pending');
  }

  /**
   * True when this belt card is out of reach: piled behind an anchor card (only playing that plays the pile), or barred
   * by a curse: a wide card (Gatekeeping) stretches left of its face over the cards ahead of it (on both rows if it's
   * tall), and a row lock (Priority Task) holds its whole row, until paid off.
   */
  isCovered(uid: number): boolean {
    const b = this.belt[this.beltIndex(uid)];
    if (!b) return false;
    if (b.stuck && !CARDS[b.card.id].anchor) return true;
    return this.belt.some((w) => {
      if (w === b) return false;
      const def = CARDS[w.card.id];
      if (def.lockRow && w.row === b.row) return true;
      const span = def.span ?? 1;
      const d = b.pos - w.pos;
      return span > 1 && (def.tall || w.row === b.row) && d > 0 && d < (span - 0.5) * CONFIG.cardWidth;
    });
  }

  /** The status whose rule forbids playing this card now (an enemy passive, a stun…) and why, or null. */
  ruleBlock(card: CardInst): { status: string; key: TKey } | null {
    // Root access (sudo): no rule applies.
    if (this.flag('hero', 'ignoresRules')) return null;
    const def = CARDS[card.id];
    for (const side of ['hero', 'enemy'] as const) {
      for (const id of Object.keys(this.fighter(side).statuses)) {
        const key = this.has(side, id) ? STATUSES[id].canPlay?.(this, side, def, card.uid) : null;
        if (key) return { status: id, key };
      }
    }
    return null;
  }

  /** Damage the hero would deal with `base` from `def` right now (for card previews). */
  previewHeroDamage(base: number, def: CardDef | null): number {
    return this.computeDamage('hero', 'enemy', base, def);
  }

  /** Damage per hit of the given enemy move after modifiers (a releasing move adds what was stored). */
  intentDamage(move: MoveDef): number {
    const stored = move.release ? this.enemy.stored : 0;
    if (!move.dmg && !stored) return 0;
    return this.computeDamage('enemy', 'hero', Math.round((move.dmg ?? 0) * this.enemy.dmgScale) + stored, null);
  }

  enemyTimeRate(): number {
    return this.mul('enemy', 'timeMul');
  }

  beltRate(): number {
    return (this.beltRows > 1 ? CONFIG.twoRowSpeed : 1) * this.runBeltMul * this.beltBoost();
  }

  /** How much statuses speed the belt up (Rush, Hurry, Crunch), slow it down (Slowdown, rust) or stop it (Stalled, full rust, or about to turn around): 1 when none does. */
  beltBoost(): number {
    let r = this.mul('hero', 'beltMul');
    r *= this.rustSpeed();
    if (this.beltHalt > 0) r = 0;
    return r;
  }

  // ------------------------------------------------------------------ loop

  tick(dt: number): void {
    if (this.result) return;
    if (this.intro > 0) {
      this.intro -= dt;
      return;
    }
    this.time += dt;
    this.second += dt;
    if (this.second >= 1) {
      this.second -= 1;
      for (const card of this.allCards()) {
        const drop = CARDS[card.id].costDrop;
        if (drop !== undefined) card.cut = (card.cut ?? 0) + this.cardVals(card)[drop];
      }
    }
    this.tickHero(dt);
    this.tickFighter('hero', dt);
    this.tickFighter('enemy', dt);
    this.tickRust(dt);
    if (this.weakSpot) {
      this.weakSpot.t -= dt;
      if (this.weakSpot.t <= 0) this.weakSpot = null;
    }
    if (this.result) return;
    this.tickEnemy(dt);
    if (this.result) return;
    this.tickBeltTurn(dt);
    this.tickBelt(dt);
    for (const id of this.relics) RELICS[id]?.hooks?.tick?.(this, dt);
    this.heroDef.hooks.tick?.(this, dt);
  }

  private tickHero(dt: number): void {
    const h = this.hero;
    if (h.mana < h.maxMana) {
      const rate = this.regenMul * this.mul('hero', 'regenMul');
      h.manaTimer += dt * rate;
      while (h.manaTimer >= h.regen && h.mana < h.maxMana) {
        h.manaTimer -= h.regen;
        h.mana++;
      }
      if (h.mana >= h.maxMana) h.manaTimer = 0;
    } else {
      h.manaTimer = 0;
      // Mana overflowing (full, the regen wasted): every whole second, cards that grow on it do, wherever they are.
      this.overflow += dt;
      if (this.overflow >= 1) {
        this.overflow -= 1;
        for (const card of this.allCards()) card.bonus += CARDS[card.id].onOverflow ?? 0;
      }
    }
  }

  /** A hex already cracked is gone once its card leaves the belt (an uncracked one stays on it through the piles). */
  private shedHex(card: CombatCard): void {
    if (card.hex && card.hex.left <= 0) delete card.hex;
  }

  /** `n` random cards that fit: the belt's first, then the rest of the deck (draw and discard piles). */
  private pickCards(fits: (c: CombatCard) => boolean, n: number): CombatCard[] {
    const onBelt = this.rng.shuffle(this.belt.map((b) => b.card).filter(fits));
    const rest = this.rng.shuffle([...this.draw, ...this.discard].filter(fits));
    return [...onBelt, ...rest].slice(0, n);
  }

  /** Every card of the fight, wherever it is: piles, belt and sleeve. */
  private allCards(): CombatCard[] {
    return [...this.draw, ...this.discard, ...this.exhaust, ...this.belt.map((b) => b.card), ...this.sleeve.filter((c) => c !== null)];
  }

  private tickFighter(side: Side, dt: number): void {
    const f = this.fighter(side);
    // Block decays in steps: a share of the current block (at least 1) per interval, unless a status holds it.
    if (f.block > 0 && !this.flag(side, 'holdsBlock')) {
      f.blockTimer += dt;
      while (f.blockTimer >= f.blockDecay && f.block > 0) {
        f.blockTimer -= f.blockDecay;
        f.block = Math.max(0, f.block - Math.max(1, Math.ceil(f.block * CONFIG.blockDecayShare)));
      }
    } else {
      f.blockTimer = 0;
    }

    let hasDot = false;
    for (const [id, s] of Object.entries(f.statuses)) {
      const def = STATUSES[id];
      if (def.tick && this.has(side, id)) {
        def.tick(this, side, s, dt);
        if (this.result) return;
        if (f.statuses[id] !== s) continue;
      }
      if (def.kind === 'timed' && s.t > 0) {
        s.t -= dt;
        if (s.t <= 0) delete f.statuses[id];
      } else if (def.kind === 'dot' && s.v > 0) {
        hasDot = true;
      }
    }
    if (!hasDot) {
      f.dotTimer = 0;
      return;
    }
    f.dotTimer += dt;
    if (f.dotTimer < CONFIG.dotInterval) return;
    f.dotTimer -= CONFIG.dotInterval;
    for (const [id, s] of Object.entries(f.statuses)) {
      if (f.statuses[id] !== s || STATUSES[id].kind !== 'dot' || s.v <= 0) continue;
      if (STATUSES[id].heals) this.heal(side, s.v);
      else {
        const bonus = side === 'enemy' ? (this.heroDef.hooks.enemyDotBonus?.(this, id) ?? 0) : 0;
        this.damage(side === 'hero' ? 'enemy' : 'hero', side, s.v + bonus, { raw: true, ignoreBlock: true, kind: id }, 'dot');
      }
      s.v--;
      if (s.v <= 0) delete f.statuses[id];
      if (this.result) return;
    }
  }

  private tickEnemy(dt: number): void {
    const e = this.enemy;
    e.timer += dt * this.enemyTimeRate();
    if (e.timer < e.move.windup) return;
    const move = e.move;
    e.timer = 0;
    e.moveCount++;
    this.resolveMove(move);
    if (this.result) return;
    e.move = this.nextEnemyMove();
    this.events.emit({ type: 'enemyIntent', move: e.move });
  }

  /** Main attack, main attack… then a special move every `every` mains (specials rotate). */
  private nextEnemyMove(): MoveDef {
    const e = this.enemy;
    const d = e.def;
    if (e.mainsLeft > 0 || !d.specials.length) {
      e.mainsLeft--;
      return d.main;
    }
    const m = d.specials[e.specialIdx % d.specials.length];
    e.specialIdx++;
    e.mainsLeft = d.every;
    return m;
  }

  /** Asks for the belt to be reversed: it stops for `beltTurnPause`, then turns around (see `turnBelt`). */
  reverseBelt(): void {
    this.beltTurns++;
    this.beltHalt = CONFIG.beltTurnPause;
  }

  private tickBeltTurn(dt: number): void {
    if (this.beltHalt <= 0) return;
    this.beltHalt -= dt;
    if (this.beltHalt > 0) return;
    if (this.beltTurns % 2) this.turnBelt();
    this.beltTurns = 0;
  }

  /**
   * The exit becomes the entry. Every card keeps its place on the belt and now heads the other way
   * (its position is mirrored, but never past the new exit, `reverseMaxPos`); a pile at the exit goes on.
   */
  private turnBelt(): void {
    for (const b of this.belt) {
      b.pos = Math.min(1 + CONFIG.cardWidth - b.pos, CONFIG.reverseMaxPos);
      b.stuck = false;
    }
    this.events.emit({ type: 'beltReversed' });
  }

  /** The enemy says something (a speech bubble over its sprite). */
  say(key: TKey): void {
    this.events.emit({ type: 'speech', key });
  }

  /** Pins every card on the belt where it is (Team Change): they stay until played, while new cards ride past them. */
  pinBelt(): void {
    for (const b of this.belt) {
      b.pinned = true;
      b.stuck = false;
    }
    this.events.emit({ type: 'beltPinned' });
  }

  /** Takes a `share` (0–1) of the enemy's Block and adds it to the hero's. */
  stealBlock(share: number): void {
    const n = Math.floor(this.enemy.block * share);
    if (n <= 0) return;
    this.enemy.block -= n;
    this.gainBlock('hero', n);
  }

  /** Opens every belt row (the ones an enemy kept shut). */
  openBeltRows(): void {
    if (this.rowsOpen === this.beltRows) return;
    this.rowsOpen = this.beltRows;
    this.events.emit({ type: 'rowsOpen' });
  }

  /** Shuts the belt down to `rows` open rows (a restructuring): the cards on the rows shut go straight to the discard pile. */
  closeBeltRows(rows = 1): void {
    if (this.rowsOpen <= rows) return;
    this.rowsOpen = rows;
    for (const b of this.belt.filter((x) => x.row >= rows)) {
      this.shedHex(b.card);
      this.discard.push(b.card);
      this.events.emit({ type: 'cardDiscarded', card: b.card });
    }
    this.belt = this.belt.filter((x) => x.row < rows);
    this.events.emit({ type: 'rowsClose' });
  }

  /** The enemy drops the move it is charging for `move` (e.g. it lost its train of thought); its pattern goes on after. */
  distractEnemy(move: MoveDef): void {
    const e = this.enemy;
    e.timer = 0;
    e.move = move;
    this.events.emit({ type: 'text', target: 'enemy', key: `move.${move.id}`, tone: 'good' });
    this.events.emit({ type: 'enemyIntent', move });
  }

  /** The enemy lands its main attack right now, outside its pattern (a Micromanager cutting in). */
  enemyStrike(): void {
    if (this.enemyTimeRate() === 0) return;
    this.events.emit({ type: 'text', target: 'enemy', key: 'combat.micromanaged', tone: 'bad' });
    this.resolveMove(this.enemy.def.main);
  }

  /** The special move the enemy will use next (for the UI countdown). */
  nextSpecial(): MoveDef | null {
    const d = this.enemy.def;
    return d.specials.length ? d.specials[this.enemy.specialIdx % d.specials.length] : null;
  }

  private resolveMove(m: MoveDef): void {
    this.events.emit({ type: 'enemyAct', move: m });
    const scale = this.enemy.dmgScale;
    const stored = m.release ? this.enemy.stored : 0;
    if (m.release) this.enemy.stored = 0;
    if (m.dmg || stored) {
      const hits = m.hits ?? 1;
      for (let i = 0; i < hits && !this.result; i++) {
        this.damage('enemy', 'hero', Math.round((m.dmg ?? 0) * scale) + stored, { kind: 'claw' }, 'enemy', i);
      }
      if (this.result) return;
      for (const [id, s] of Object.entries(this.enemy.statuses)) if (this.has('enemy', id)) STATUSES[id].onAttack?.(this, 'enemy', s);
      if (this.result) return;
    }
    if (m.block) this.gainBlock('enemy', Math.round(m.block * scale));
    if (m.heal) this.heal('enemy', Math.round(m.heal * scale));
    for (const s of m.status ?? []) this.applyStatus(s.target, s.id, s.v ?? 1, s.t ?? 0);
    let queued = 0;
    for (const cu of m.curse ?? []) {
      // Curses arriving on the belt together come in one after the other.
      const gap = CONFIG.spacing * (CARDS[cu.id].span ?? 1);
      for (let i = 0; i < cu.n; i++) this.addTempCard(cu.id, cu.to, false, cu.to === 'belt' ? -queued++ * gap : 0);
    }
    if (m.steal) for (let i = 0; i < m.steal; i++) this.stealCard();
    if (m.drainMana) this.drainMana(m.drainMana);
    if (m.hex) this.hexCards(m.hex.id, m.hex.share);
    if (m.inflate) this.inflateCards(m.inflate);
    if (m.infect) this.infectCards(m.infect);
    m.fx?.(this);
  }

  private tickBelt(dt: number): void {
    const rate = this.beltRate();
    const move = (dt / CONFIG.beltTime) * rate;
    for (let row = 0; row < this.beltRows; row++) this.moveRow(row, move);
    for (const b of this.belt) {
      b.card.age = (b.card.age ?? 0) + dt;
      this.spreadVirus(b, dt);
      const hex = b.card.hex;
      if (!hex || hex.left > 0) continue;
      hex.t -= dt;
      if (hex.t <= 0) {
        delete b.card.hex;
        this.events.emit({ type: 'hexBroken', card: b.card });
      }
    }
    // Expire cards that fell off the left edge.
    for (let i = this.belt.length - 1; i >= 0; i--) {
      const b = this.belt[i];
      if (b.pos < EXPIRE_POS) continue;
      // On autopilot, a card slipping off plays itself for free if it can (rules…); otherwise it's lost as usual.
      if (this.flag('hero', 'autoplay') && this.playCard(b.card.uid, true)) continue;
      this.belt.splice(i, 1);
      this.expire(b.card);
      if (this.result) return;
    }
    // Draw cadence is a fixed clock (scaled with belt speed so spacing stays constant):
    // playing cards quickly never makes new ones arrive sooner. Each row keeps the one-row spacing, so a
    // two-row belt shows twice the cards (more to choose from, mana decides) and each stays in view longer.
    const every = (CONFIG.spacing * CONFIG.beltTime) / this.rowsOpen;
    this.spawnClock = Math.min(every, this.spawnClock + dt * rate);
    const row = this.freeRow();
    if (row < 0 || this.spawnClock < every || this.rowGap(row) < CONFIG.minGap) return;
    this.spawnClock -= every;
    this.spawnCard(0, undefined, row);
  }

  /**
   * Moves a row's cards forward, the one nearest the exit first. An `anchor` card stops at the exit and attack cards
   * pile up behind it; any other card reaching the pile sends it off the belt (they all start moving again).
   */
  private moveRow(row: number, move: number): void {
    const cards = this.belt.filter((b) => b.row === row && !b.pinned).sort((a, b) => b.pos - a.pos);
    /** The last card of the pile stopped at the exit, if any. */
    let tail: BeltCard | null = null;
    for (const b of cards) {
      const def = CARDS[b.card.id];
      if (b.stuck) {
        // A pile needs its anchor: without one (played, stolen, stashed) the cards go on.
        if (tail || def.anchor) {
          tail = b;
          continue;
        }
        b.stuck = false;
      }
      const next = b.pos + move;
      const attack = cardCategory(b.card.id) === 'attack';
      if (tail && !attack && next >= tail.pos - CONFIG.cardWidth) {
        for (const c of cards) c.stuck = false;
        tail = null;
      }
      const stop = tail ? (attack ? tail.pos - CONFIG.pileStep : Infinity) : def.anchor ? CONFIG.anchorPos : Infinity;
      // (An anchor sent off the belt is already past its stop: it leaves.)
      if (next < stop || (def.anchor && b.pos >= stop)) {
        b.pos = next;
        continue;
      }
      b.pos = stop;
      b.stuck = true;
      // Having reached the end, it has ridden the whole belt.
      b.card.passed = true;
      tail = b;
    }
  }

  /** Distance from the entry to the newest card of a row (Infinity if the row is empty). */
  private rowGap(row: number): number {
    let gap = Infinity;
    for (const b of this.belt) if (b.row === row && !b.pinned && b.pos < gap) gap = b.pos;
    return gap;
  }

  /** The row with the most room at the entry, or -1 if every row is full. */
  private freeRow(): number {
    let best = -1;
    for (let r = 0; r < this.rowsOpen; r++) {
      if (this.belt.filter((b) => b.row === r).length >= CONFIG.maxHandBelt) continue;
      if (best < 0 || this.rowGap(r) > this.rowGap(best)) best = r;
    }
    return best;
  }

  private spawnCard(pos: number, card?: CombatCard, row = this.freeRow()): boolean {
    if (row < 0) return false;
    // A tall card rides the top row and hangs over the one below.
    if (card && CARDS[card.id].tall) row = 0;
    let c = card;
    if (!c) {
      if (!this.draw.length) {
        if (!this.discard.length) return false;
        this.draw = this.rng.shuffle(this.discard);
        this.discard = [];
        this.events.emit({ type: 'reshuffle' });
      }
      c = this.draw.pop()!;
      // A fresh draw starts its ride from zero (a card back from the sleeve keeps its age).
      c.age = 0;
    }
    this.belt.push({ card: c, pos, row });
    this.events.emit({ type: 'cardSpawn', card: c });
    return true;
  }

  private expire(card: CombatCard): void {
    const def = CARDS[card.id];
    // A hex stays on the card through the piles until it's broken; one already cracked is gone.
    this.shedHex(card);
    card.passed = true;
    this.events.emit({ type: 'cardExpired', card });
    this.withCard(card, def, () => def.onExpire?.(this, this.cardVals(card), card));
    this.heroDef.hooks.onCardExpired?.(this, card);
    for (const side of ['hero', 'enemy'] as const) {
      for (const [id, s] of Object.entries(this.fighter(side).statuses)) if (this.has(side, id)) STATUSES[id].onExpire?.(this, side, s);
    }
    if (this.keywords(card).includes('fleeting')) this.exhaust.push(card);
    else this.discard.push(card);
  }

  // --------------------------------------------------------- player actions

  /** Plays a card from the belt or sleeve. Returns false if it couldn't be played. */
  playCard(uid: number, free = false): boolean {
    if (this.result || this.intro > 0) return false;
    const beltIdx = this.beltIndex(uid);
    const sleeveIdx = this.sleeveIndex(uid);
    const card = beltIdx >= 0 ? this.belt[beltIdx].card : sleeveIdx >= 0 ? this.sleeve[sleeveIdx] : null;
    if (!card) return false;
    if (beltIdx >= 0 && this.isCovered(uid)) {
      this.events.emit({ type: 'text', target: 'hero', key: 'combat.covered', tone: 'neutral' });
      return false;
    }
    if (card.hex) {
      this.tapHex(card);
      return false;
    }
    if (!this.isPlayable(card)) {
      this.events.emit({ type: 'text', target: 'hero', key: 'combat.unplayable', tone: 'neutral' });
      return false;
    }
    if (this.isPending(card)) {
      this.events.emit({ type: 'text', target: 'hero', key: 'combat.pending', tone: 'neutral' });
      return false;
    }
    const rule = this.ruleBlock(card);
    if (rule) {
      this.events.emit({ type: 'text', target: 'hero', key: rule.key, tone: 'bad' });
      return false;
    }
    if (!free && !this.canAfford(card)) {
      this.events.emit({ type: 'cantAfford', card });
      return false;
    }
    this.resolvePlay(card, free);
    return true;
  }

  /** Pays for a card and plays it from wherever it is (belt or sleeve): the checks are already done. */
  private resolvePlay(card: CombatCard, free: boolean): void {
    const def = CARDS[card.id];
    const beltIdx = this.beltIndex(card.uid);
    const sleeveIdx = this.sleeveIndex(card.uid);
    const cost = this.cardCost(card);
    // X is all the mana there is; a free card still counts it, without spending it.
    const spent = cost < 0 ? this.hero.mana : cost;
    if (!free) this.hero.mana -= spent;
    const row = beltIdx >= 0 ? this.belt[beltIdx].row : -1;
    if (beltIdx >= 0) this.belt.splice(beltIdx, 1);
    else this.sleeve[sleeveIdx] = null;

    this.cardsPlayed++;
    this.events.emit({ type: 'cardPlayed', card, from: beltIdx >= 0 ? 'belt' : 'sleeve' });
    const vals = this.cardVals(card);
    if (cost < 0) vals.push(spent);
    // Statuses react to cards played after them: one this card applies doesn't see the card itself.
    const watching = (['hero', 'enemy'] as const).flatMap((side) =>
      Object.keys(this.fighter(side).statuses)
        .filter((id) => this.has(side, id) && STATUSES[id].onCardPlayed)
        .map((id) => [side, id] as const),
    );
    this.replaying = false;
    this.withCard(card, def, () => def.play!(this, vals, card), row);
    if (def.type === 'attack') this.removeStatus('hero', 'crit');
    if (this.result === 'lose') return;

    this.lastPlayed = def;
    this.lastPlayedAt = this.time;
    this.lastRow = beltIdx >= 0 ? row : -1;
    if (!this.replaying) this.lastPlay = { card, def, vals };
    this.heroDef.hooks.onCardPlayed?.(this, card, def, spent);
    for (const [held, hd] of this.held()) hd.inSleeve?.onCardPlayed?.(this, this.cardVals(held), held, def);
    for (const id of this.relics) RELICS[id]?.hooks?.onCardPlayed?.(this, card, def);
    for (const [side, id] of watching) if (this.has(side, id)) STATUSES[id].onCardPlayed?.(this, side, def);

    // Inflation lasts until the card is paid for once.
    delete card.tax;
    delete card.virus;
    const kw = this.keywords(card);
    if (kw.includes('consume')) {
      if (!card.temp) this.consumed.push(card.uid);
      this.exhaust.push(card);
    } else if (kw.includes('exhaust') || def.type === 'power') {
      this.exhaust.push(card);
    } else {
      this.discard.push(card);
    }
  }

  /** Plays, for free, every card piled behind the `anchor` card being played (skipping any that can't be played). The rest move on. */
  playPile(): void {
    const row = this.current?.row ?? -1;
    const pile = this.belt.filter((b) => b.row === row && b.stuck).sort((a, b) => b.pos - a.pos);
    for (const b of pile) b.stuck = false;
    for (const b of pile) {
      if (this.result) return;
      if (!b.card.hex && this.isPlayable(b.card)) this.resolvePlay(b.card, true);
    }
  }

  /** Moves a belt card into the sleeve. If the slot is taken, the two cards swap places. */
  stash(uid: number, slot?: number): boolean {
    if (this.result || this.intro > 0) return false;
    const beltIdx = this.beltIndex(uid);
    if (beltIdx < 0) return false;
    const target = slot ?? this.sleeve.indexOf(null);
    if (target < 0 || target >= this.sleeve.length) return false;
    const b = this.belt[beltIdx];
    // A hexed card is stuck to the belt until freed; a covered one can't be reached; a pending one waits its turn.
    if (b.card.hex || this.isCovered(uid) || this.isPending(b.card)) return false;
    const old = this.sleeve[target];
    // A bulky card can't be swapped out of the sleeve: it has to be played.
    if (old && this.keywords(old).includes('bulky')) return false;
    this.sleeve[target] = b.card;
    if (old) this.belt[beltIdx] = { card: old, pos: b.pos, row: b.row };
    else this.belt.splice(beltIdx, 1);
    this.events.emit({ type: 'cardStashed', card: b.card, slot: target });
    return true;
  }

  abilityCost(): number {
    return this.heroDef.ability.cost;
  }

  abilityReady(): boolean {
    return !this.result && this.intro <= 0 && !this.has('hero', 'stun') && this.hero.mana >= this.abilityCost();
  }

  useAbility(): boolean {
    if (!this.abilityReady()) return false;
    this.hero.mana -= this.abilityCost();
    this.events.emit({ type: 'ability', id: this.heroDef.ability.id });
    this.heroDef.ability.use(this);
    return true;
  }

  // ----------------------------------------------------- effect helpers API

  private withCard(card: CombatCard, def: CardDef, fn: () => void, row = -1): void {
    const prev = this.current;
    this.current = { card, def, row };
    try {
      fn();
    } finally {
      this.current = prev;
    }
  }

  /** Hero deals card damage to the enemy. Returns total unblocked damage. */
  hit(base: number, opts: DamageOpts = {}): number {
    const def = this.current?.def ?? null;
    const kind = opts.kind ?? (def?.type === 'spell' ? 'arcane' : def?.type === 'attack' ? 'slash' : 'blunt');
    let total = 0;
    for (let i = 0; i < (opts.hits ?? 1) && !this.result; i++) {
      total += this.damage('hero', 'enemy', base, { ...opts, kind }, 'hero', i);
    }
    return total;
  }

  /** Cards waiting in the sleeve, with their definitions (their `inSleeve` bonuses are active). */
  private held(): [CombatCard, CardDef][] {
    return this.sleeve.filter((c) => c !== null).map((c) => [c, CARDS[c.id]]);
  }

  /** Strength of a side: the stacks of every status that counts as Strength while active. */
  private strengthOf(side: Side): number {
    let n = 0;
    for (const [id, s] of Object.entries(this.fighter(side).statuses)) if (STATUSES[id].strength && this.has(side, id)) n += s.v;
    return n;
  }

  private computeDamage(from: Side, to: Side, base: number, def: CardDef | null): number {
    let dmg = base;
    if (from === 'hero') {
      if (def?.type === 'attack') dmg += this.strengthOf('hero');
      if (def?.type === 'spell') dmg += this.stacks('hero', 'spellPower');
      dmg += this.heroDef.hooks.bonusDamage?.(this, def) ?? 0;
      for (const [held, hd] of this.held()) dmg += hd.inSleeve?.bonusDamage?.(this, this.cardVals(held), def) ?? 0;
      dmg *= this.heroDef.hooks.damageMult?.(this, def) ?? 1;
      if (def?.type === 'attack' && this.has('hero', 'crit')) dmg *= CONFIG.critMult;
    } else {
      dmg += this.strengthOf('enemy');
    }
    dmg *= this.mul(from, 'dealtMul') * this.mul(to, 'takenMul');
    if (from === 'hero') dmg = Math.min(dmg - this.hitCut(), this.hitCap());
    return Math.max(0, Math.floor(dmg));
  }

  /** Damage every hit of the hero's cards loses to the enemy's plating (Fine Print). */
  private hitCut(): number {
    let n = 0;
    for (const [id, s] of Object.entries(this.enemy.statuses)) if (STATUSES[id].cutsHits && this.has('enemy', id)) n += s.v;
    return n;
  }

  /** The most one hit of the hero's cards can deal now (Rate Limit), if anything caps it. */
  private hitCap(): number {
    let cap = Infinity;
    for (const [id, s] of Object.entries(this.enemy.statuses)) if (STATUSES[id].capsHits && this.has('enemy', id)) cap = Math.min(cap, s.v);
    return cap;
  }

  /** Core damage routine. Returns HP actually lost. */
  damage(from: Side, to: Side, base: number, opts: DamageOpts, source: Side | 'dot', hitIndex = 0): number {
    if (this.result) return 0;
    const target = this.fighter(to);
    const dmg = opts.raw ? base : this.computeDamage(from, to, base, this.current?.def ?? null);

    // Dodge: immune to every kind of damage while it lasts.
    if (this.flag(to, 'immune')) {
      if (to === 'hero' && source === 'enemy') this.events.emit({ type: 'text', target: 'hero', key: 'combat.dodged', tone: 'good' });
      return 0;
    }

    const blocked = opts.ignoreBlock ? 0 : Math.min(target.block, dmg);
    target.block -= blocked;
    // An absorbing enemy stores what the hero's cards deal (damage over time still gets through).
    if (to === 'enemy' && source === 'hero' && this.enemy.move.absorb && dmg - blocked > 0) {
      this.enemy.stored += dmg - blocked;
      this.events.emit({ type: 'absorbed', amount: dmg - blocked });
      return 0;
    }
    const lost = Math.min(target.hp, dmg - blocked);
    target.hp -= lost;
    this.events.emit({ type: 'damage', target: to, amount: dmg - blocked, blocked, source, hitIndex, kind: opts.kind ?? 'hit' });
    if (lost > 0) for (const [id, s] of Object.entries(target.statuses)) if (this.has(to, id)) STATUSES[id].onHurt?.(this, to, s, lost);
    if (lost > 0 && to === 'hero') this.hurtLog.push({ t: this.time, n: lost });

    if (source === 'enemy' && to === 'hero') {
      this.heroDef.hooks.onHeroHit?.(this, lost);
      for (const [held, hd] of this.held()) hd.inSleeve?.onHeroHit?.(this, this.cardVals(held), held, lost);
      const thorns = this.stacks('hero', 'thorns');
      if (thorns > 0) this.damage('hero', 'enemy', thorns, { raw: true, kind: 'thorns' }, 'hero');
      const parry = this.fighter('hero').statuses.parry;
      if (parry && parry.t > 0) {
        delete this.hero.statuses.parry;
        this.events.emit({ type: 'text', target: 'hero', key: 'combat.parried', tone: 'good' });
        this.damage('hero', 'enemy', parry.v, { raw: true, kind: 'slash' }, 'hero');
      }
    }
    if (source === 'hero' && to === 'enemy' && !opts.raw && this.current?.def.type === 'attack') {
      const thorns = this.stacks('enemy', 'thorns');
      if (thorns > 0) this.damage('enemy', 'hero', thorns, { raw: true, kind: 'thorns' }, 'dot');
    }

    this.checkDeaths();
    return lost;
  }

  private checkDeaths(): void {
    if (this.result) return;
    const e = this.enemy;
    if (e.hp <= 0 && !this.reprieve()) {
      this.end('win');
      return;
    }
    if (!e.halfTriggered && e.hp <= e.maxHp / 2) {
      e.halfTriggered = true;
      if (e.def.onHalf) {
        e.def.onHalf(this);
        this.events.emit({ type: 'enrage' });
      }
    }
    if (this.hero.hp <= 0) {
      for (const id of this.relics) {
        if (RELICS[id]?.hooks?.onDeath?.(this)) {
          this.events.emit({ type: 'relic', id });
          return;
        }
      }
      this.end('lose');
    }
  }

  /** True when a status on the enemy lets it survive a lethal hit (Golden Parachute). */
  private reprieve(): boolean {
    for (const [id, s] of Object.entries(this.enemy.statuses)) if (this.has('enemy', id) && STATUSES[id].onDeath?.(this, 'enemy', s)) return true;
    return false;
  }

  private end(result: CombatResult): void {
    if (this.result) return;
    this.result = result;
    if (result === 'win') for (const id of this.relics) RELICS[id]?.hooks?.onCombatEnd?.(this);
    this.events.emit({ type: 'end', result });
  }

  gainBlock(side: Side, n: number): void {
    if (n <= 0 || this.result) return;
    const f = this.fighter(side);
    f.block += n;
    f.blockTimer = 0;
    this.events.emit({ type: 'block', target: side, amount: n });
    if (side === 'hero') {
      const jug = this.stacks('hero', 'juggernaut');
      if (jug > 0) this.damage('hero', 'enemy', jug, { raw: true, kind: 'blunt' }, 'hero');
    }
  }

  /** The hero gives up all its Block (Blow Off Steam) and gets back how much it was. */
  spendBlock(): number {
    const n = this.hero.block;
    this.hero.block = 0;
    return n;
  }

  heal(side: Side, n: number): number {
    const f = this.fighter(side);
    const amount = Math.min(n, f.maxHp - f.hp);
    if (amount <= 0) return 0;
    f.hp += amount;
    this.events.emit({ type: 'heal', target: side, amount });
    return amount;
  }

  loseHp(n: number): void {
    const lost = Math.min(this.hero.hp, n);
    this.hero.hp -= lost;
    if (lost > 0) this.hurtLog.push({ t: this.time, n: lost });
    this.events.emit({ type: 'damage', target: 'hero', amount: lost, blocked: 0, source: 'dot', hitIndex: 0, kind: 'blood' });
    this.checkDeaths();
  }

  gainMana(n: number): void {
    const h = this.hero;
    const before = h.mana;
    h.mana = Math.min(h.maxMana, h.mana + n);
    if (h.mana > before) this.events.emit({ type: 'mana', amount: h.mana - before });
  }

  drainMana(n: number): void {
    const lost = Math.min(this.hero.mana, n);
    this.hero.mana -= lost;
    this.events.emit({ type: 'manaDrain', amount: lost });
  }

  /** Adds empty mana crystals: the cap grows, the new crystals fill up over time. */
  addManaCrystals(n: number): void {
    const h = this.hero;
    const before = h.maxMana;
    h.maxMana = Math.min(this.manaCap(), h.maxMana + n);
    if (h.maxMana > before) this.events.emit({ type: 'manaCrystal', amount: h.maxMana - before });
  }

  applyStatus(side: Side, id: string, v: number, t = 0, silent = false): void {
    if (this.result) return;
    const def = STATUSES[id];
    const f = this.fighter(side);
    f.statuses[id] ??= { v: 0, t: 0 };
    const s = f.statuses[id];
    if (def.kind === 'timed') {
      s.t += t || v;
      s.v = Math.max(s.v, t ? v : 1);
    } else {
      s.v += v;
      if (s.v <= 0) delete f.statuses[id];
    }
    if (!silent) this.events.emit({ type: 'status', target: side, id, amount: def.kind === 'timed' ? t || v : v });
    if (side === 'enemy' && v > 0) this.heroDef.hooks.onEnemyStatus?.(this, id, v);
  }

  removeStatus(side: Side, id: string): void {
    delete this.fighter(side).statuses[id];
  }

  /** Speeds the belt up for `t` seconds: cards (and new draws) come faster. A hero status, so it shows with a timer. */
  rushBelt(t: number): void {
    this.applyStatus('hero', 'rush', 1, t);
  }

  /**
   * Adds a temporary card (curses, generated cards) to a pile or straight onto the belt. `at` < 0 queues a belt card
   * just before the entry, so several arriving together come in one after the other.
   */
  addTempCard(id: string, to: 'belt' | 'draw' | 'discard', up = false, at = 0): void {
    // Temporary cards get negative uids so they never collide with deck cards.
    const card: CombatCard = { uid: -++this.tempUid, id, up, bonus: 0, temp: true };
    if (to === 'belt') {
      if (!this.spawnCard(at, card)) this.discard.push(card);
    } else if (to === 'draw') {
      this.draw.splice(this.rng.int(0, this.draw.length), 0, card);
    } else {
      this.discard.push(card);
    }
    this.events.emit({ type: 'cardAdded', card, to });
  }

  /** Exhausts the whole belt (no leave-the-belt effects). Returns how many cards it held. */
  exhaustBelt(): number {
    const cards = this.belt.splice(0).map((b) => b.card);
    for (const card of cards) {
      this.shedHex(card);
      this.exhaust.push(card);
      this.events.emit({ type: 'cardDiscarded', card });
    }
    return cards.length;
  }

  /** Shuffles up to `n` random cards exhausted this fight back into the draw pile (never consumed or temporary ones). Returns how many. */
  recycleExhausted(n: number): number {
    const back = this.rng.shuffle(this.exhaust.filter((c) => !c.temp && !this.consumed.includes(c.uid))).slice(0, n);
    for (const card of back) {
      this.exhaust.splice(this.exhaust.indexOf(card), 1);
      this.draw.splice(this.rng.int(0, this.draw.length), 0, card);
    }
    if (back.length) this.events.emit({ type: 'reshuffle' });
    return back.length;
  }

  /** HP the hero lost in the last `seconds` of the fight. */
  hpLostWithin(seconds: number): number {
    return this.hurtLog.filter((x) => x.t >= this.time - seconds).reduce((sum, x) => sum + x.n, 0);
  }

  /** The enemy drops the move it is charging and starts on the next one of its pattern. */
  skipEnemyMove(): void {
    const e = this.enemy;
    e.timer = 0;
    e.move = this.nextEnemyMove();
    this.events.emit({ type: 'enemyIntent', move: e.move });
  }

  /** Resolves the last card played again, with the same values. */
  replayLast(): void {
    const last = this.lastPlay;
    if (!last?.def.play) return;
    const play = last.def.play;
    this.replaying = true;
    this.withCard(last.card, last.def, () => play(this, [...last.vals], last.card));
  }

  /** Every belt card becomes a temporary copy of the last card played; the originals go to the discard pile. */
  copyLastOntoBelt(): void {
    const last = this.lastPlay;
    if (!last) return;
    for (const b of this.belt) {
      this.shedHex(b.card);
      this.discard.push(b.card);
      this.events.emit({ type: 'cardDiscarded', card: b.card });
      b.card = { uid: -++this.tempUid, id: last.card.id, up: last.card.up, bonus: 0, temp: true };
      this.events.emit({ type: 'cardSpawn', card: b.card });
    }
  }

  /** The rust the enemy's status brings, if any. */
  private rustDef(): NonNullable<StatusDef['rust']> | undefined {
    for (const id of Object.keys(this.enemy.statuses)) if (this.has('enemy', id) && STATUSES[id].rust) return STATUSES[id].rust;
    return undefined;
  }

  /** Whether the enemy rusts the belt (the mop shows up beside it). */
  get rustsBelt(): boolean {
    return !!this.rustDef();
  }

  /** Whether the rust has piled up enough that the belt is about to stop (the mop warns). */
  get rustAlarm(): boolean {
    const rust = this.rustDef();
    return !!rust && this.rustSpots.length >= rust.max * rust.warn;
  }

  /** Share of the belt's speed the rust leaves: it eases out along a sine (ease-in-out) of the spots' share of `max`, so a few are nothing and many stop the belt. */
  private rustSpeed(): number {
    const max = this.rustDef()?.max;
    if (!max) return 1;
    const share = Math.min(1, this.rustSpots.length / max);
    return (1 + Math.cos(Math.PI * share)) / 2;
  }

  private tickRust(dt: number): void {
    const rust = this.rustDef();
    if (!rust) return;
    this.rustClock += dt;
    if (this.rustClock < rust.every) return;
    this.rustClock -= rust.every;
    // Past the point where the belt is already stopped, more rust changes nothing.
    if (this.rustSpots.length >= rust.max) return;
    if (this.rustSpots.length === 0) this.events.emit({ type: 'rust' });
    this.rustSpots.push({ id: ++this.rustId, x: 0.06 + this.rng.next() * 0.8, y: 0.12 + this.rng.next() * 0.7, grime: 1 });
    this.syncRustStatus();
    // The belt has just stopped dead: he hands the job over.
    if (this.rustSpots.length === rust.max) this.say('status.deferredMaintenance.speech');
  }

  /** The hero scrubs a rust spot with the mop: `amount` of its grime comes off, and it's gone at 0. */
  scrubRust(id: number, amount: number): void {
    const spot = this.rustSpots.find((x) => x.id === id);
    if (!spot) return;
    spot.grime -= amount;
    if (spot.grime <= 0) {
      this.rustSpots = this.rustSpots.filter((x) => x !== spot);
      this.syncRustStatus();
    }
  }

  /** The hero's Rusty Belt chip counts the spots (set silently: it changes all the time). */
  private syncRustStatus(): void {
    if (this.rustSpots.length) this.hero.statuses.rustedBelt = { v: this.rustSpots.length, t: 0 };
    else delete this.hero.statuses.rustedBelt;
  }

  /** The hero dragged a card one more swipe around the screen: a card with `wind` grows. False when there's nothing (more) to wind. */
  windCard(uid: number): boolean {
    const card = this.belt[this.beltIndex(uid)]?.card ?? this.sleeve[this.sleeveIndex(uid)];
    const wind = card && CARDS[card.id].wind;
    if (!card || !wind || this.result) return false;
    const vals = this.cardVals(card);
    if (card.bonus >= vals[wind.max]) return false;
    card.bonus = Math.min(vals[wind.max], card.bonus + vals[wind.by]);
    return true;
  }

  /** Shows a target somewhere on the enemy's sprite for `time` seconds. */
  openWeakSpot(time: number): void {
    const m = CONFIG.weakSpotMargin;
    this.weakSpot = { x: m + this.rng.next() * (1 - 2 * m), y: m + this.rng.next() * (1 - 2 * m), t: time };
    this.events.emit({ type: 'weakSpot', x: this.weakSpot.x, y: this.weakSpot.y });
  }

  /** The hero taps the target in time: the next attack is critical. False when there's no target to hit. */
  hitWeakSpot(): boolean {
    if (!this.weakSpot || this.result) return false;
    this.weakSpot = null;
    if (!this.has('hero', 'crit')) this.applyStatus('hero', 'crit', 1);
    return true;
  }

  /** Hexes a random `share` (0–1, rounded up) of the belt cards and of the rest of the deck (draw and discard piles), never curses. */
  hexCards(id: string, share: number): void {
    const hex = HEXES[id];
    const fits = (c: CombatCard): boolean => !c.hex && !isCurse(c);
    const some = (cards: CombatCard[]): CombatCard[] => {
      const ok = cards.filter(fits);
      return this.rng.shuffle(ok).slice(0, Math.ceil(ok.length * share));
    };
    for (const card of [...some(this.belt.map((b) => b.card)), ...some([...this.draw, ...this.discard])]) {
      card.hex = { id, left: hex.taps, t: hex.thaw };
      this.events.emit({ type: 'hexed', card });
    }
  }

  /** Inflation: `n` random cards (belt first, then the rest of the deck) cost 1 more mana until they're next played. */
  inflateCards(n: number): void {
    for (const card of this.pickCards((c) => !isCurse(c) && this.cardCost(c) >= 0, n)) {
      card.tax = (card.tax ?? 0) + 1;
      this.events.emit({ type: 'inflated', card });
    }
  }

  /** Virus: `n` random cards (belt first, then the rest of the deck) are infected until they're next played. */
  infectCards(n: number): void {
    for (const card of this.pickCards((c) => !isCurse(c) && !c.virus && this.cardCost(c) >= 0, n)) this.infect(card);
  }

  private infect(card: CombatCard): void {
    card.virus = { t: 0, spread: false };
    this.events.emit({ type: 'infected', card });
  }

  /** An infected card on the belt, after its delay, infects the card right behind it (the nearest one that isn't already sick); a curse never counts. */
  private spreadVirus(b: BeltCard, dt: number): void {
    const virus = b.card.virus;
    if (!virus || virus.spread) return;
    virus.t += dt;
    if (virus.t < CONFIG.virusDelay) return;
    const behind = this.belt.filter((x) => x.pos < b.pos && !x.card.virus && !isCurse(x.card)).sort((p, q) => q.pos - p.pos)[0];
    if (!behind) return;
    virus.spread = true;
    this.infect(behind.card);
  }

  /** A tap on a hexed card chips at the hex instead of playing it; the last tap starts the thaw. */
  private tapHex(card: CombatCard): void {
    const hex = card.hex!;
    if (hex.left <= 0) return;
    hex.left--;
    this.events.emit({ type: 'hexTap', card });
  }

  /** Brings the enemy's current move closer by `s` seconds. */
  hurryEnemy(s: number): void {
    const e = this.enemy;
    e.timer = Math.min(e.move.windup, e.timer + s);
  }

  /** The enemy steals the belt card closest to the exit; it's gone for this fight. */
  private stealCard(): void {
    if (!this.belt.length) return;
    let idx = 0;
    for (let i = 1; i < this.belt.length; i++) if (this.belt[i].pos > this.belt[idx].pos) idx = i;
    const [b] = this.belt.splice(idx, 1);
    this.exhaust.push(b.card);
    this.events.emit({ type: 'cardStolen', card: b.card });
  }
}
