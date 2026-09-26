import { Emitter } from '../core/emitter';
import { Rng } from '../core/rng';
import { CONFIG, EXPIRE_POS } from '../data/config';
import { STATUSES } from '../data/statuses';
import { CARDS } from '../data/cards';
import { RELICS } from '../data/relics';
import { MINIONS } from '../data/minions';
import type {
  BeltCard,
  CardDef,
  CardInst,
  CombatCard,
  CombatEvent,
  CombatResult,
  EnemyDef,
  HeroDef,
  Minion,
  MoveDef,
  Side,
  Statuses,
} from './types';

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
  resource: number;
  resourceMax: number;
  weave: number;
  weaveMax: number;
  weaveTimer: number;
}

export interface EnemyState extends Fighter {
  def: EnemyDef;
  move: MoveDef;
  /** Seconds accumulated towards the current move's wind-up. */
  timer: number;
  moveCount: number;
  patternIdx: number;
  halfTriggered: boolean;
  dmgScale: number;
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
  sleeve: (CombatCard | null)[];
  /** Hero's summoned allies, oldest first. The oldest one takes enemy hits. */
  minions: Minion[] = [];
  private minionUid = 0;

  /** Time accumulated towards the next regular draw onto the belt. */
  private spawnClock = 0;
  beltSpeed = 1;
  beltSlowT = 0;
  beltHasteT = 0;
  regenMul = 1;
  /** Deck uids permanently removed (potions). */
  consumed: number[] = [];
  cardsPlayed = 0;
  /** Card currently resolving, so effect helpers know its type. */
  private current: { card: CombatCard; def: CardDef } | null = null;
  /** Free-form per-combat state for relics and powers. */
  mem: Record<string, number> = {};
  private tempUid = 0;

  constructor(setup: CombatSetup) {
    this.rng = new Rng(setup.seed);
    this.heroDef = setup.hero;
    this.relics = setup.relics;
    this.relicFlags = setup.relicFlags;
    const h = setup.hero;

    let maxMana = h.maxMana + (setup.bonusMaxMana ?? 0);
    let sleeve: number = CONFIG.sleeveSlots;
    let regenMul = 1;
    for (const id of this.relics) {
      const m = RELICS[id]?.mods;
      if (!m) continue;
      maxMana += m.maxMana ?? 0;
      sleeve += m.sleeve ?? 0;
      this.beltSpeed *= m.beltSpeed ?? 1;
      regenMul *= m.regen ?? 1;
    }
    this.regenMul = regenMul;

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
      resource: 0,
      resourceMax: h.resourceMax,
      weave: 0,
      weaveMax: CONFIG.weaveMax,
      weaveTimer: 0,
    };
    this.sleeve = new Array(sleeve).fill(null);

    const e = setup.enemy;
    const maxHp = Math.round(e.hp * setup.scale.hp);
    this.enemy = {
      def: e,
      hp: maxHp,
      maxHp,
      block: 0,
      statuses: {},
      blockTimer: 0,
      dotTimer: 0,
      blockDecay: 0.6,
      move: e.pattern[0],
      timer: 0,
      moveCount: 0,
      patternIdx: 0,
      halfTriggered: false,
      dmgScale: setup.scale.dmg,
      mem: {},
    };
    this.enemy.move = this.nextEnemyMove();
    for (const s of e.start ?? []) this.applyStatus('enemy', s.id, s.v ?? 1, s.t ?? 0, true);

    this.draw = this.rng.shuffle(setup.deck.map((c) => ({ ...c, bonus: 0, temp: false })));
    // Innate cards go on top of the draw pile (the end of the array), so they reach the belt first.
    const innate = this.draw.filter((c) => this.keywords(c).includes('innate'));
    this.draw = [...this.draw.filter((c) => !innate.includes(c)), ...innate];

    for (const id of this.relics) RELICS[id]?.hooks?.onCombatStart?.(this);
    // Prewarm the belt so the fight starts with something to look at.
    this.spawnCard(CONFIG.spacing * 2.1);
    this.spawnCard(CONFIG.spacing * 1.05);
    this.spawnCard(0.02);
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

  stacks(side: Side, id: string): number {
    return this.fighter(side).statuses[id]?.v ?? 0;
  }

  cardVals(card: CardInst & { bonus?: number }): number[] {
    const def = CARDS[card.id];
    const vals = [...(card.up ? (def.upVals ?? def.vals) : def.vals)];
    if (card.bonus && def.dmg?.length) vals[def.dmg[0]] += card.bonus;
    return vals;
  }

  cardCost(card: CardInst): number {
    const def = CARDS[card.id];
    return card.up && def.upCost !== undefined ? def.upCost : def.cost;
  }

  canAfford(card: CardInst): boolean {
    const cost = this.cardCost(card);
    return cost < 0 ? this.hero.mana > 0 : this.hero.mana >= cost;
  }

  isPlayable(card: CardInst): boolean {
    const def = CARDS[card.id];
    return !this.keywords(card).includes('unplayable') && !!def.play;
  }

  keywords(card: CardInst): string[] {
    const def = CARDS[card.id];
    return (card.up ? (def.upKeywords ?? def.keywords) : def.keywords) ?? [];
  }

  /** Damage the hero would deal with `base` from `def` right now (for card previews). */
  previewHeroDamage(base: number, def: CardDef | null): number {
    return this.computeDamage('hero', 'enemy', base, def);
  }

  /** Damage per hit of the given enemy move after modifiers. */
  intentDamage(move: MoveDef): number {
    if (!move.dmg) return 0;
    return this.computeDamage('enemy', 'hero', Math.round(move.dmg * this.enemy.dmgScale), null);
  }

  enemyTimeRate(): number {
    if (this.has('enemy', 'stun') || this.has('enemy', 'frozen')) return 0;
    let r = 1;
    if (this.has('enemy', 'chill')) r *= 0.5;
    if (this.has('enemy', 'haste')) r *= 1.5;
    return r;
  }

  beltRate(): number {
    let r = this.beltSpeed;
    if (this.beltSlowT > 0) r *= 0.5;
    if (this.beltHasteT > 0) r *= 1.6;
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
    this.tickHero(dt);
    this.tickFighter('hero', dt);
    this.tickFighter('enemy', dt);
    if (this.result) return;
    this.tickEnemy(dt);
    if (this.result) return;
    this.tickMinions(dt);
    if (this.result) return;
    this.tickBelt(dt);
    for (const id of this.relics) RELICS[id]?.hooks?.tick?.(this, dt);
    this.heroDef.hooks.tick?.(this, dt);
    this.beltSlowT = Math.max(0, this.beltSlowT - dt);
    this.beltHasteT = Math.max(0, this.beltHasteT - dt);
  }

  private tickHero(dt: number): void {
    const h = this.hero;
    if (h.mana < h.maxMana) {
      const rate = this.regenMul * (this.has('hero', 'chill') ? 0.5 : 1);
      h.manaTimer += dt * rate;
      while (h.manaTimer >= h.regen && h.mana < h.maxMana) {
        h.manaTimer -= h.regen;
        h.mana++;
      }
      if (h.mana >= h.maxMana) h.manaTimer = 0;
    } else {
      h.manaTimer = 0;
    }
    if (h.weave > 0) {
      h.weaveTimer -= dt;
      if (h.weaveTimer <= 0) {
        h.weave = 0;
        this.events.emit({ type: 'weave', n: 0 });
      }
    }
  }

  private tickFighter(side: Side, dt: number): void {
    const f = this.fighter(side);
    // Block decays in steps: 10% of current block (at least 1) per interval.
    if (f.block > 0) {
      f.blockTimer += dt;
      while (f.blockTimer >= f.blockDecay && f.block > 0) {
        f.blockTimer -= f.blockDecay;
        f.block = Math.max(0, f.block - Math.max(1, Math.ceil(f.block * 0.1)));
      }
    } else {
      f.blockTimer = 0;
    }

    let hasDot = false;
    for (const [id, s] of Object.entries(f.statuses)) {
      const def = STATUSES[id];
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
    for (const id of ['burn', 'poison', 'regen']) {
      const s = f.statuses[id];
      if (!s || s.v <= 0) continue;
      if (id === 'regen') this.heal(side, s.v);
      else this.damage(side === 'hero' ? 'enemy' : 'hero', side, s.v, { raw: true, ignoreBlock: true, kind: id }, 'dot');
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

  private nextEnemyMove(): MoveDef {
    const e = this.enemy;
    if (e.def.ai) return e.def.ai(this);
    const m = e.def.pattern[e.patternIdx % e.def.pattern.length];
    e.patternIdx++;
    return m;
  }

  private resolveMove(m: MoveDef): void {
    this.events.emit({ type: 'enemyAct', move: m });
    const scale = this.enemy.dmgScale;
    if (m.dmg) {
      const hits = m.hits ?? 1;
      for (let i = 0; i < hits && !this.result; i++) {
        const base = Math.round(m.dmg * scale);
        // Minions stand in front of the hero and take the hits first.
        if (this.minions.length) this.hitMinion(this.minions[0], base);
        else this.damage('enemy', 'hero', base, { kind: 'claw' }, 'enemy', i);
      }
      if (this.result) return;
    }
    if (m.block) this.gainBlock('enemy', Math.round(m.block * scale));
    if (m.heal) this.heal('enemy', Math.round(m.heal * scale));
    for (const s of m.status ?? []) this.applyStatus(s.target, s.id, s.v ?? 1, s.t ?? 0);
    if (m.curse) for (let i = 0; i < m.curse.n; i++) this.addTempCard(m.curse.id, m.curse.to);
    if (m.steal) for (let i = 0; i < m.steal; i++) this.stealCard();
    if (m.drainMana) this.drainMana(m.drainMana);
    if (m.beltHaste) this.beltHasteT = Math.max(this.beltHasteT, m.beltHaste);
    m.fx?.(this);
  }

  private tickBelt(dt: number): void {
    const rate = this.beltRate();
    const move = (dt / CONFIG.beltTime) * rate;
    for (const b of this.belt) b.pos += move;
    // Expire cards that fell off the left edge.
    for (let i = this.belt.length - 1; i >= 0; i--) {
      const b = this.belt[i];
      if (b.pos < EXPIRE_POS) continue;
      this.belt.splice(i, 1);
      this.expire(b.card);
      if (this.result) return;
    }
    // Draw cadence is a fixed clock (scaled with belt speed so spacing stays constant):
    // playing cards quickly never makes new ones arrive sooner.
    const every = CONFIG.spacing * CONFIG.beltTime;
    this.spawnClock = Math.min(every, this.spawnClock + dt * rate);
    const gap = this.belt.length ? Math.min(...this.belt.map((b) => b.pos)) : Infinity;
    if (this.belt.length >= CONFIG.maxHandBelt) return;
    if (this.spawnClock >= every && gap >= CONFIG.minGap) {
      this.spawnClock -= every;
      this.spawnCard(0);
    }
  }

  private spawnCard(pos: number, card?: CombatCard): boolean {
    let c = card;
    if (!c) {
      if (!this.draw.length) {
        if (!this.discard.length) return false;
        this.draw = this.rng.shuffle(this.discard);
        this.discard = [];
        this.events.emit({ type: 'reshuffle' });
      }
      c = this.draw.pop()!;
    }
    this.belt.push({ card: c, pos });
    this.events.emit({ type: 'cardSpawn', card: c });
    return true;
  }

  private expire(card: CombatCard): void {
    const def = CARDS[card.id];
    this.events.emit({ type: 'cardExpired', card });
    this.withCard(card, def, () => def.onExpire?.(this, this.cardVals(card), card));
    this.heroDef.hooks.onCardExpired?.(this, card);
    if (this.keywords(card).includes('fleeting')) this.exhaust.push(card);
    else this.discard.push(card);
  }

  // --------------------------------------------------------- player actions

  /** Plays a card from the belt or sleeve. Returns false if it couldn't be played. */
  playCard(uid: number): boolean {
    if (this.result || this.intro > 0) return false;
    const beltIdx = this.belt.findIndex((b) => b.card.uid === uid);
    const sleeveIdx = this.sleeve.findIndex((c) => c?.uid === uid);
    const card = beltIdx >= 0 ? this.belt[beltIdx].card : sleeveIdx >= 0 ? this.sleeve[sleeveIdx] : null;
    if (!card) return false;
    const def = CARDS[card.id];
    if (!this.isPlayable(card)) {
      this.events.emit({ type: 'text', target: 'hero', key: 'combat.unplayable', tone: 'neutral' });
      return false;
    }
    if (!this.canAfford(card)) {
      this.events.emit({ type: 'cantAfford', card });
      return false;
    }
    const cost = this.cardCost(card);
    const spent = cost < 0 ? this.hero.mana : cost;
    this.hero.mana -= spent;
    if (beltIdx >= 0) this.belt.splice(beltIdx, 1);
    else this.sleeve[sleeveIdx] = null;

    this.cardsPlayed++;
    this.events.emit({ type: 'cardPlayed', card, from: beltIdx >= 0 ? 'belt' : 'sleeve' });
    const vals = this.cardVals(card);
    if (cost < 0) vals.push(spent);
    const times = this.mem.echo === 1 ? 2 : 1;
    if (this.mem.echo === 1) this.mem.echo = 2;
    for (let i = 0; i < times && !this.result; i++) this.withCard(card, def, () => def.play!(this, vals, card));
    if (this.result === 'lose') return true;

    this.heroDef.hooks.onCardPlayed?.(this, card, def, spent);
    for (const id of this.relics) RELICS[id]?.hooks?.onCardPlayed?.(this, card, def);

    const kw = this.keywords(card);
    if (kw.includes('consume')) {
      if (!card.temp) this.consumed.push(card.uid);
      this.exhaust.push(card);
    } else if (kw.includes('exhaust') || def.type === 'power') {
      this.exhaust.push(card);
    } else {
      this.discard.push(card);
    }
    return true;
  }

  /** Moves a belt card into the sleeve. If the slot is taken, the two cards swap places. */
  stash(uid: number, slot?: number): boolean {
    if (this.result || this.intro > 0) return false;
    const beltIdx = this.belt.findIndex((b) => b.card.uid === uid);
    if (beltIdx < 0) return false;
    const target = slot ?? this.sleeve.findIndex((c) => c === null);
    if (target < 0 || target >= this.sleeve.length) return false;
    const b = this.belt[beltIdx];
    const old = this.sleeve[target];
    this.sleeve[target] = b.card;
    if (old) this.belt[beltIdx] = { card: old, pos: b.pos };
    else this.belt.splice(beltIdx, 1);
    this.events.emit({ type: 'cardStashed', card: b.card, slot: target });
    return true;
  }

  abilityReady(): boolean {
    return !this.result && this.intro <= 0 && this.hero.resource >= this.hero.resourceMax;
  }

  useAbility(): boolean {
    if (!this.abilityReady()) return false;
    this.hero.resource = 0;
    this.events.emit({ type: 'ability', id: this.heroDef.ability.id });
    this.heroDef.ability.use(this);
    return true;
  }

  // ----------------------------------------------------- effect helpers API

  private withCard(card: CombatCard, def: CardDef, fn: () => void): void {
    const prev = this.current;
    this.current = { card, def };
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

  private computeDamage(from: Side, to: Side, base: number, def: CardDef | null): number {
    let dmg = base;
    if (from === 'hero') {
      if (def?.type === 'attack') dmg += this.stacks('hero', 'strength');
      if (def?.type === 'spell') dmg += this.stacks('hero', 'spellpower');
      dmg += this.heroDef.hooks.bonusDamage?.(this, def) ?? 0;
      dmg *= this.heroDef.hooks.damageMult?.(this, def) ?? 1;
    } else {
      dmg += this.stacks('enemy', 'strength');
    }
    if (this.has(from, 'weak')) dmg *= 0.75;
    if (this.has(to, 'vulnerable')) dmg *= 1.5;
    return Math.max(0, Math.floor(dmg));
  }

  /** Core damage routine. Returns HP actually lost. */
  damage(from: Side, to: Side, base: number, opts: DamageOpts, source: Side | 'dot', hitIndex = 0): number {
    if (this.result) return 0;
    const target = this.fighter(to);
    const dmg = opts.raw ? base : this.computeDamage(from, to, base, this.current?.def ?? null);

    if (source === 'enemy' && to === 'hero' && this.stacks('hero', 'dodge') > 0) {
      this.addStacks('hero', 'dodge', -1);
      this.events.emit({ type: 'text', target: 'hero', key: 'combat.dodged', tone: 'good' });
      return 0;
    }

    const blocked = opts.ignoreBlock ? 0 : Math.min(target.block, dmg);
    target.block -= blocked;
    const lost = Math.min(target.hp, dmg - blocked);
    target.hp -= lost;
    this.events.emit({ type: 'damage', target: to, amount: dmg - blocked, blocked, source, hitIndex, kind: opts.kind ?? 'hit' });

    if (source === 'enemy' && to === 'hero') {
      this.heroDef.hooks.onHeroHit?.(this, lost);
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
    if (e.hp <= 0) {
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
    this.events.emit({ type: 'damage', target: 'hero', amount: lost, blocked: 0, source: 'dot', hitIndex: 0, kind: 'blood' });
    this.checkDeaths();
  }

  gainMana(n: number): void {
    const h = this.hero;
    const before = h.mana;
    h.mana = Math.min(h.maxMana, h.mana + n);
    if (h.mana > before) this.events.emit({ type: 'mana', amount: h.mana - before });
  }

  gainMaxMana(n: number): void {
    const h = this.hero;
    h.maxMana = Math.min(CONFIG.maxManaCap, h.maxMana + n);
    this.gainMana(n);
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
    h.maxMana = Math.min(CONFIG.maxManaCap, h.maxMana + n);
    if (h.maxMana > before) this.events.emit({ type: 'manaCrystal', amount: h.maxMana - before });
  }

  addResource(n: number): void {
    const h = this.hero;
    h.resource = Math.min(h.resourceMax, h.resource + n);
  }

  applyStatus(side: Side, id: string, v: number, t = 0, silent = false): void {
    if (this.result) return;
    const def = STATUSES[id];
    const f = this.fighter(side);
    const s = f.statuses[id] ?? (f.statuses[id] = { v: 0, t: 0 });
    if (def.kind === 'timed') {
      s.t += t || v;
      s.v = Math.max(s.v, t ? v : 1);
    } else {
      s.v += v;
      if (s.v <= 0) delete f.statuses[id];
    }
    if (!silent) this.events.emit({ type: 'status', target: side, id, amount: def.kind === 'timed' ? t || v : v });
  }

  private addStacks(side: Side, id: string, v: number): void {
    const f = this.fighter(side);
    const s = f.statuses[id];
    if (!s) return;
    s.v += v;
    if (s.v <= 0) delete f.statuses[id];
  }

  removeStatus(side: Side, id: string): void {
    delete this.fighter(side).statuses[id];
  }

  slowBelt(t: number): void {
    this.beltSlowT = Math.max(this.beltSlowT, t);
  }

  // ------------------------------------------------------------ minions

  private tickMinions(dt: number): void {
    for (const m of [...this.minions]) {
      m.timer += dt;
      const def = MINIONS[m.id];
      if (m.timer >= def.interval) {
        m.timer -= def.interval;
        this.minionAttack(m);
        if (this.result) return;
      }
    }
  }

  /** Summons a minion. With a full board, the oldest one crumbles to make room. */
  summon(id: string): void {
    if (this.result) return;
    if (this.minions.length >= CONFIG.maxMinions) this.killMinion(this.minions[0]);
    const def = MINIONS[id];
    const m: Minion = { uid: ++this.minionUid, id, hp: def.hp, maxHp: def.hp, timer: 0 };
    this.minions.push(m);
    this.events.emit({ type: 'minionSummon', uid: m.uid, id });
  }

  minionAttack(m: Minion): void {
    const def = MINIONS[m.id];
    this.events.emit({ type: 'minionAttack', uid: m.uid });
    this.damage('hero', 'enemy', def.dmg + this.stacks('hero', 'undeadMight'), { kind: 'claw' }, 'hero');
    const plague = this.stacks('hero', 'plague');
    if (plague > 0) this.applyStatus('enemy', 'poison', plague, 0, true);
  }

  /** Every minion attacks right away (their timers restart). */
  minionsStrike(): void {
    for (const m of [...this.minions]) {
      m.timer = 0;
      this.minionAttack(m);
      if (this.result) return;
    }
  }

  private hitMinion(m: Minion, base: number): void {
    let dmg = base + this.stacks('enemy', 'strength');
    if (this.has('enemy', 'weak')) dmg *= 0.75;
    dmg = Math.floor(dmg);
    m.hp -= dmg;
    this.events.emit({ type: 'minionHit', uid: m.uid, amount: dmg });
    if (m.hp <= 0) this.killMinion(m);
  }

  killMinion(m: Minion): void {
    const i = this.minions.indexOf(m);
    if (i < 0) return;
    this.minions.splice(i, 1);
    this.events.emit({ type: 'minionDied', uid: m.uid });
    this.heroDef.hooks.onMinionDeath?.(this);
    const armor = this.stacks('hero', 'boneArmor');
    if (armor > 0) this.gainBlock('hero', armor);
  }

  /** Sacrifices the oldest minion. Returns false if there was none. */
  sacrifice(): boolean {
    const m = this.minions[0];
    if (!m) return false;
    this.killMinion(m);
    return true;
  }

  /** Adds a temporary card (curses, generated cards) to a pile or straight onto the belt. */
  addTempCard(id: string, to: 'belt' | 'draw' | 'discard', up = false): void {
    // Temporary cards get negative uids so they never collide with deck cards.
    const card: CombatCard = { uid: -++this.tempUid, id, up, bonus: 0, temp: true };
    if (to === 'belt') {
      if (this.belt.length >= CONFIG.maxHandBelt) this.discard.push(card);
      else this.spawnCard(0, card);
    } else if (to === 'draw') {
      this.draw.splice(this.rng.int(0, this.draw.length), 0, card);
    } else {
      this.discard.push(card);
    }
    this.events.emit({ type: 'curseAdded', card, to });
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
