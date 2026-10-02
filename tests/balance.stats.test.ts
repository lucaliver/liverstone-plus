import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CARD_LIST } from '../src/data/cards';
import { CONFIG } from '../src/data/config';
import { ENEMY_LIST, enemyMoves } from '../src/data/enemies';
import { HERO_LIST } from '../src/data/heroes';
import type { CardDef, EnemyDef, HeroDef, MoveDef } from '../src/game/types';

/**
 * Static balance numbers, straight from the data (no bot): what each card gives per mana, what each enemy deals and
 * how much it takes to kill. `npm run stats` rewrites BALANCE.md; a plain `npm test` only checks the numbers compute.
 * The weights are rough on purpose (see the notes in the report): use it to spot outliers, not to prove balance.
 */

const OUT = 'BALANCE.md';
/** Seconds of a fight the enemy tables look at, and the share of a hero's mana we assume goes into attacks. */
const HORIZONS = [30, 60];
const ATTACK_SHARE = 0.5;

const GLYPH = /\{(\?)?([\w+]+)(?::(\d))?\}/g;

interface CardRead {
  cost: number;
  /** Total of each glyph kind (multi-hit lines multiplied out), conditional ones apart. */
  v: Record<string, number>;
  cond: Record<string, number>;
  /** The numbers change with the fight (`{dmg}={block}`, `×{cards}`, per-second values): not comparable. */
  dynamic: boolean;
  x: boolean;
}

function read(def: CardDef, up: boolean): CardRead {
  const vals = up ? (def.upVals?.length ? def.upVals : def.vals) : def.vals;
  const cost = up ? (def.upCost ?? def.cost) : def.cost;
  const r: CardRead = { cost, v: {}, cond: {}, dynamic: false, x: cost < 0 };
  for (const line of def.face.split('|')) {
    let hits = 1;
    const mult = line.match(/×(?:\{(\w+)\}|(X)|(\d+))/);
    if (mult?.[3]) hits = Number(mult[3]);
    else if (mult?.[1] && /^\d$/.test(mult[1])) hits = vals[Number(mult[1])];
    else if (mult?.[1]) r.dynamic = true;
    if (line.includes('=') || line.includes('/s')) r.dynamic = true;
    let cond = false;
    for (const m of line.matchAll(GLYPH)) {
      const [, q, kind, idx] = m;
      if (/^\d$/.test(kind)) continue;
      if (q) {
        cond = true;
        continue;
      }
      if (kind === 'timer') r.dynamic = true;
      if (idx === undefined) continue;
      const into = cond ? r.cond : r.v;
      into[kind] = (into[kind] ?? 0) + vals[Number(idx)] * hits;
      cond = false;
    }
  }
  return r;
}

/** Poison v deals v + (v-1) + … 1 over its life; Burn and the rest are not converted. */
const poisonTotal = (v: number): number => (v * (v + 1)) / 2;
/** Output per mana (an X card spends all the mana it gets, so its value is already per mana). */
const per = (value: number, r: CardRead): number | null => (r.x ? value : r.cost > 0 ? value / r.cost : null);

type Role = 'Damage' | 'Block' | 'Poison' | 'Other';
const role = (def: CardDef, r: CardRead): Role => {
  if (r.dynamic || def.type === 'power' || def.type === 'curse') return 'Other';
  if (r.v.dmg) return 'Damage';
  if (r.v.poison && !r.v.block) return 'Poison';
  if (r.v.block) return 'Block';
  return 'Other';
};
const mainValue = (role: Role, r: CardRead): number =>
  role === 'Damage' ? r.v.dmg : role === 'Block' ? r.v.block : role === 'Poison' ? poisonTotal(r.v.poison) : 0;

const median = (a: number[]): number => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2 : 0;
};
const n1 = (n: number | null | undefined, d = 1): string =>
  n === null || n === undefined || Number.isNaN(n) ? '–' : Number.isInteger(n) ? String(n) : n.toFixed(d);
const pct = (n: number): string => `${n >= 0 ? '+' : ''}${Math.round(n * 100)}%`;
const table = (head: string[], rows: string[][]): string =>
  [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');

const RARITY = ['starter', 'common', 'rare', 'epic', 'legendary', 'special'];
const extrasOf = (r: CardRead, skip: string): string =>
  [
    ...Object.entries(r.v)
      .filter(([k]) => k !== skip)
      .map(([k, v]) => `${k} ${v}`),
    ...Object.entries(r.cond).map(([k, v]) => `if: ${k} ${v}`),
  ].join(', ');

// ---------------------------------------------------------------------------------------------------- cards

interface CardRow {
  def: CardDef;
  role: Role;
  base: CardRead;
  up: CardRead;
  perBase: number | null;
  perUp: number | null;
}

function cardRows(): CardRow[] {
  return CARD_LIST.filter((d) => d.type !== 'curse').map((def) => {
    const base = read(def, false);
    const up = read(def, true);
    const ro = role(def, base);
    return { def, role: ro, base, up, perBase: per(mainValue(ro, base), base), perUp: per(mainValue(ro, up), up) };
  });
}

function cardSection(rows: CardRow[]): string {
  const out: string[] = [];
  const ranked = (ro: Role) => rows.filter((r) => r.role === ro && r.def.rarity !== 'special');

  // Median per rarity: does a rarer card give more per mana?
  const roles: Role[] = ['Damage', 'Block', 'Poison'];
  out.push('### Median output per mana, by rarity (base cards)\n');
  out.push(
    table(
      ['Rarity', ...roles.map((r) => `${r} (n)`)],
      RARITY.filter((ra) => ra !== 'special').map((ra) => [
        ra,
        ...roles.map((ro) => {
          const v = ranked(ro)
            .filter((r) => r.def.rarity === ra && r.perBase !== null)
            .map((r) => r.perBase as number);
          return v.length ? `${n1(median(v), 2)} (${v.length})` : '–';
        }),
      ]),
    ),
  );
  out.push(
    '\nIf a rarer row is not above the one before it, that rarity is not paying for itself (extras like stun or block are not counted here).\n',
  );

  for (const ro of roles) {
    const list = ranked(ro).sort((a, b) => (b.perBase ?? Infinity) - (a.perBase ?? Infinity));
    const med = median(list.filter((r) => r.perBase !== null).map((r) => r.perBase as number));
    const unit = ro === 'Poison' ? 'poison total (v·(v+1)/2)' : ro.toLowerCase();
    out.push(`### ${ro} cards, by ${unit} per mana\n`);
    out.push(`Median of the group: ${n1(med, 2)} per mana. "vs med" is the card against that median. Free cards (cost 0) have no per-mana value.\n`);
    out.push(
      table(
        ['Card', 'Class', 'Rarity', 'Cost', 'Output', 'Per mana', 'vs med', 'Upg: cost', 'Upg: output', 'Upg: per mana', 'Upg gain', 'Extras'],
        list.map((r) => {
          const key = ro === 'Damage' ? 'dmg' : ro === 'Block' ? 'block' : 'poison';
          const x = r.base.x ? ' (X)' : '';
          const gain = r.perBase && r.perUp ? pct(r.perUp / r.perBase - 1) : '–';
          return [
            r.def.id,
            r.def.cls,
            r.def.rarity,
            r.base.x ? 'X' : String(r.base.cost),
            `${n1(mainValue(ro, r.base))}${x}`,
            n1(r.perBase, 2),
            r.perBase ? pct(r.perBase / med - 1) : '–',
            r.up.x ? 'X' : String(r.up.cost),
            n1(mainValue(ro, r.up)),
            n1(r.perUp, 2),
            gain,
            [extrasOf(r.base, key), (r.def.keywords ?? []).join('+')].filter(Boolean).join('; ') || '–',
          ];
        }),
      ),
    );
    out.push('');
  }

  const other = rows.filter((r) => r.role === 'Other');
  out.push('### Other cards (utility, powers, dynamic numbers): raw values only\n');
  out.push(
    table(
      ['Card', 'Class', 'Type', 'Rarity', 'Cost', 'Upg cost', 'Values', 'Upg values', 'Keywords'],
      other
        .sort((a, b) => RARITY.indexOf(a.def.rarity) - RARITY.indexOf(b.def.rarity) || a.def.cls.localeCompare(b.def.cls))
        .map((r) => [
          r.def.id,
          r.def.cls,
          r.def.type,
          r.def.rarity,
          r.base.x ? 'X' : String(r.base.cost),
          r.up.x ? 'X' : String(r.up.cost),
          `\`${r.def.face}\` ${JSON.stringify(r.def.vals)}`,
          r.def.upVals?.length ? JSON.stringify(r.def.upVals) : '–',
          (r.def.keywords ?? []).join('+') || '–',
        ]),
    ),
  );
  return out.join('\n');
}

// ---------------------------------------------------------------------------------------------------- heroes

interface HeroRef {
  hero: HeroDef;
  manaPerSec: number;
  dmgPerMana: number;
  blockPerMana: number;
  /** Damage per second if `ATTACK_SHARE` of the mana goes into starter attacks. */
  refDps: number;
}

function heroRef(hero: HeroDef, rows: CardRow[]): HeroRef {
  const byId = new Map(rows.map((r) => [r.def.id, r]));
  const pending = new Set(hero.startUpgraded);
  let dmg = 0;
  let dmgMana = 0;
  let block = 0;
  let blockMana = 0;
  for (const id of hero.startDeck) {
    const r = byId.get(id);
    if (!r) continue;
    const up = pending.delete(id);
    const c = up ? r.up : r.base;
    if (c.v.dmg && c.cost > 0) {
      dmg += c.v.dmg;
      dmgMana += c.cost;
    } else if (c.v.block && c.cost > 0) {
      block += c.v.block;
      blockMana += c.cost;
    }
  }
  const manaPerSec = 1 / hero.regen;
  const dmgPerMana = dmg / (dmgMana || 1);
  return { hero, manaPerSec, dmgPerMana, blockPerMana: block / (blockMana || 1), refDps: manaPerSec * ATTACK_SHARE * dmgPerMana };
}

function heroSection(refs: HeroRef[], rows: CardRow[]): string {
  const byId = new Map(rows.map((r) => [r.def.id, r]));
  const head = [
    'Hero',
    'HP',
    'Max mana',
    'Regen (s/mana)',
    'Mana/s',
    'Sleeve',
    'Deck',
    'Attack/mana',
    'Block/mana',
    `Ref. DPS (${ATTACK_SHARE * 100}% mana on attacks)`,
    'Deck mana',
    'Secs of mana for the deck',
  ];
  return table(
    head,
    refs.map((h) => {
      const mana = h.hero.startDeck.reduce((s, id) => s + Math.max(0, byId.get(id)?.base.cost ?? 0), 0);
      return [
        h.hero.id,
        String(h.hero.hp),
        String(h.hero.maxMana),
        String(h.hero.regen),
        n1(h.manaPerSec, 2),
        String(h.hero.sleeve),
        String(h.hero.startDeck.length),
        n1(h.dmgPerMana, 2),
        n1(h.blockPerMana, 2),
        n1(h.refDps, 2),
        String(mana),
        n1(mana / h.manaPerSec, 0),
      ];
    }),
  );
}

// ---------------------------------------------------------------------------------------------------- enemies

const hitsOf = (m: MoveDef): number => (m.dmg ? (m.hits ?? 1) : 0);

/** Pieces of a move that are not plain damage, in words. */
function effectsOf(m: MoveDef): string {
  const e: string[] = [];
  if (m.block) e.push(`block ${m.block}`);
  if (m.heal) e.push(`heal ${m.heal}`);
  for (const s of m.status ?? []) e.push(`${s.target === 'hero' ? 'you' : 'self'}: ${s.id}${s.v ? ` ${s.v}` : ''}${s.t ? ` ${s.t}s` : ''}`);
  for (const c of m.curse ?? []) e.push(`curse ${c.id}×${c.n} → ${c.to}`);
  if (m.steal) e.push(`steal ${m.steal}`);
  if (m.drainMana) e.push(`drain mana ${m.drainMana}`);
  if (m.hex) e.push(`hex ${m.hex.id} ${Math.round(m.hex.share * 100)}%`);
  if (m.inflate) e.push(`inflate ${m.inflate}`);
  if (m.infect) e.push(`infect ${m.infect}`);
  if (m.absorb) e.push('absorbs damage');
  if (m.release) e.push('releases it');
  if (m.fx) e.push('custom effect');
  return e.join(', ');
}

/** Damage the hero takes from the enemy's moves in `seconds`, no block, no stun: its Strength ramp is followed. Floor 1. */
function damageIn(e: EnemyDef, seconds: number): number {
  let t = 0;
  let total = 0;
  let strength = e.start?.find((s) => s.id === 'strength')?.v ?? 0;
  let mains = e.every;
  let special = 0;
  let move: MoveDef = e.main;
  for (;;) {
    t += move.windup;
    if (t > seconds) return total;
    total += hitsOf(move) * ((move.dmg ?? 0) + (move.dmg ? strength : 0));
    for (const s of move.status ?? []) if (s.id === 'strength' && s.target === 'enemy') strength += s.v ?? 1;
    if (mains > 0 || !e.specials.length) {
      mains--;
      move = e.main;
    } else {
      move = e.specials[special++ % e.specials.length];
      mains = e.every;
    }
  }
}

/** Steady damage per second over one full main…main + special cycle (specials averaged), before any ramp. */
function cycleDps(e: EnemyDef): number {
  const mains = e.every;
  const sp = e.specials;
  if (!sp.length) return (hitsOf(e.main) * (e.main.dmg ?? 0)) / e.main.windup;
  const dmg = mains * hitsOf(e.main) * (e.main.dmg ?? 0) + sp.reduce((s, m) => s + hitsOf(m) * (m.dmg ?? 0), 0) / sp.length;
  const time = mains * e.main.windup + sp.reduce((s, m) => s + m.windup, 0) / sp.length;
  return dmg / time;
}

const moveText = (m: MoveDef): string =>
  `${m.id} (${m.intent}) ${m.dmg ? `${m.dmg}${m.hits && m.hits > 1 ? `×${m.hits}` : ''}` : '–'} @${m.windup}s${effectsOf(m) ? ` — ${effectsOf(m)}` : ''}`;

function traitsOf(e: EnemyDef): string {
  const t: string[] = [];
  for (const s of e.start ?? []) t.push(`starts ${s.id}${s.v ? ` ${s.v}` : ''}`);
  if (e.fillSleeve) t.push(`fills sleeve: ${e.fillSleeve}`);
  if (e.startHex) t.push(`hex ${e.startHex.id} ${Math.round(e.startHex.share * 100)}%`);
  if (e.onHalf) t.push('half-HP trait');
  if (e.ruleBreaker) t.push('rule-breaker');
  if (e.deepBelt !== undefined) t.push(`deep belt @${e.deepBelt}s`);
  if (e.beltOff !== undefined) t.push(`belt off @${e.beltOff}s`);
  if (e.startRows) t.push(`${e.startRows} belt row at start`);
  return t.join(', ');
}

function enemySection(refs: HeroRef[]): string {
  const out: string[] = [];
  const list = ENEMY_LIST.filter((e) => !e.firstRunOnly);
  const eff = (e: EnemyDef) => (e.hp + (e.block ?? 0)) * CONFIG.enemyHp;

  out.push(
    `Hero columns: unmitigated damage taken (no Block, no stun) while the hero kills the enemy at the reference DPS, as a share of hero HP. Over 100% means the hero needs Block, stuns or a better deck than the starter one to live.\n`,
  );
  const head = [
    'Enemy',
    'Act',
    'Tier',
    'HP',
    'Block',
    'DPS cycle',
    `Dmg in ${HORIZONS[0]}s`,
    `Dmg in ${HORIZONS[1]}s`,
    'Threat',
    'vs tier+act',
    ...refs.map((r) => `${r.hero.id} loses`),
    'Other effects',
  ];
  const threat = (e: EnemyDef) => cycleDps(e) * eff(e);
  const groupMed = new Map<string, number>();
  for (const e of list) {
    const k = `${e.act}-${e.tier}`;
    if (!groupMed.has(k)) groupMed.set(k, median(list.filter((o) => o.act === e.act && o.tier === e.tier).map(threat)));
  }
  const sorted = [...list].sort(
    (a, b) => a.act - b.act || ['normal', 'elite', 'boss'].indexOf(a.tier) - ['normal', 'elite', 'boss'].indexOf(b.tier) || threat(a) - threat(b),
  );
  out.push(
    table(
      head,
      sorted.map((e) => {
        const th = threat(e);
        const extras = [...enemyMoves(e).map((m) => effectsOf(m)), traitsOf(e)].filter(Boolean);
        return [
          e.id,
          String(e.act),
          e.tier,
          String(e.hp),
          String(e.block ?? 0),
          n1(cycleDps(e), 2),
          n1(damageIn(e, HORIZONS[0])),
          n1(damageIn(e, HORIZONS[1])),
          n1(th, 0),
          pct(th / (groupMed.get(`${e.act}-${e.tier}`) ?? th) - 1),
          ...refs.map((r) => {
            const ttk = eff(e) / r.refDps;
            return `${Math.round((damageIn(e, ttk) / r.hero.hp) * 100)}%`;
          }),
          [...new Set(extras)].join('; ') || '–',
        ];
      }),
    ),
  );
  out.push(
    `\nThreat = DPS cycle × (HP + Block): the damage you take per 1 damage per second you deal. It is the number to compare inside one act and tier (the "vs tier+act" column is the gap from that group's median). Normal enemies also scale with the floor: ×${1 + CONFIG.floorHp} HP and ×${1 + CONFIG.floorDmg} damage per floor above the first (see \`enemyScale\`), not applied here. Only damage is priced: curses, statuses, steals and belt tricks sit in "Other effects" unpriced, so an enemy that mostly debuffs (toxicCoworker) looks harmless here. "Dmg in 30s/60s" follows the Strength each attack adds, "DPS cycle" does not.\n`,
  );
  out.push('### Moves\n');
  out.push(
    table(
      ['Enemy', 'Main', 'Specials (rotate)', 'Mains per special'],
      sorted.map((e) => [e.id, moveText(e.main), e.specials.map(moveText).join('<br>') || '–', String(e.every)]),
    ),
  );
  return out.join('\n');
}

// ---------------------------------------------------------------------------------------------------- report

function report(): string {
  const rows = cardRows();
  const refs = HERO_LIST.map((h) => heroRef(h, rows));
  return [
    '# Balance data',
    '',
    `Generated by \`npm run stats\` (tests/balance.stats.test.ts) from the data in \`src/data\`: no bot, no randomness. Rewrite it after any balance change.`,
    '',
    '## How to read it',
    '',
    '- A card is judged by what its **main effect gives per mana** (damage, block, poison). Extras (stun, chill, heal, block on an attack…) are listed beside it and are **not** priced in, so a card below the median can be fine if its extras are strong.',
    '- Poison counts as its full total, v + (v-1) + … + 1 (it fades one per tick). Burn, Weak, Vulnerable, Strength and the like are not converted.',
    '- Cards whose numbers change in the fight (`{dmg}={block}`, `×{cards}`, per-second values), powers and utility are in "Other", with their raw values.',
    '- Conditional damage (`{?cond}`) is shown in Extras as `if: …` and not counted in the output.',
    '- Curse cards are left out (they are hurdles, not rewards).',
    '',
    '## Heroes',
    '',
    heroSection(refs, rows),
    '',
    `The reference DPS assumes ${ATTACK_SHARE * 100}% of the mana goes into the starter deck's attacks. Real play has crystals, upgrades, rewards, stuns and Block: use it to compare enemies and heroes with each other, not as a prediction.`,
    '',
    '## Cards',
    '',
    cardSection(rows),
    '',
    '## Enemies',
    '',
    enemySection(refs),
    '',
  ].join('\n');
}

describe('balance stats', () => {
  it('computes the numbers for every card and enemy (and writes BALANCE.md with `npm run stats`)', () => {
    const md = report();
    expect(md).not.toContain('NaN');
    expect(md).not.toContain('undefined');
    if (process.env.BALANCE_MD) writeFileSync(OUT, md);
  });
});
