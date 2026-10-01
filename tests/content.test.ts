import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import enStrings from '../src/i18n/en';

/** Indexed as a plain dictionary: these tests check keys that are built at runtime. */
const en: Record<string, string> = enStrings;
import { CARD_LIST, CARDS } from '../src/data/cards';
import { ACT_DEFS } from '../src/data/acts';
import { rewardOdds, rewardUpgradeChance } from '../src/data/config';
import { DIFFICULTY, ENEMY_LIST, enemyMoves } from '../src/data/enemies';
import { HERO_LIST, starterCards } from '../src/data/heroes';
import { VALUES } from '../src/data/values';
import { PERK_LIST } from '../src/data/perks';
import { STATUS_ORDER, STATUSES } from '../src/data/statuses';
import { GLYPHS, TAG_ICON } from '../src/ui/components/cardView';
import { moveTone } from '../src/ui/components/moveText';
import { ICONS, INTENT_ICON } from '../src/ui/art/icons';
import { RELIC_SPRITES } from '../src/ui/art/relics';
import { ROOM_SPRITES } from '../src/ui/art/rooms';
import { ROOM_SCENE } from '../src/ui/components/room';
import { INK_HEX } from '../src/ui/art/riso';
import { HEXES } from '../src/data/hexes';
import { MODIFIER_LIST } from '../src/data/modifiers';
import { ENEMIES } from '../src/data/enemies';
import { RELIC_LIST } from '../src/data/relics';
import { ABILITY_ICON, PASSIVE_ICON } from '../src/ui/combat/view';
import { NODE_ICON } from '../src/ui/screens/journey';

describe('content integrity', () => {
  it('every card has i18n text and valid face glyphs', () => {
    for (const c of CARD_LIST) {
      expect(en[`card.${c.id}.name`], c.id).toBeTruthy();
      expect(en[`card.${c.id}.desc`], c.id).toBeTruthy();
      if (c.tip) expect(en[`card.${c.id}.tip` as keyof typeof en], `${c.id}: tip`).toBeTruthy();
      for (const m of c.face.matchAll(/\{\??([\w+]+)(?::\d)?\}/g)) {
        for (const g of m[1].split('+')) {
          if (/^\d$/.test(g)) continue;
          expect(GLYPHS[g], `${c.id}: ${g}`).toBeTruthy();
        }
      }
      for (const m of en[`card.${c.id}.desc`].matchAll(/\[(\w+)\]/g)) expect(en[`kw.${m[1]}`], `${c.id}: kw ${m[1]}`).toBeTruthy();
    }
  });

  it('every enemy and move has a name, every hero deck exists', () => {
    for (const e of ENEMY_LIST) {
      expect(en[`enemy.${e.id}.name`], e.id).toBeTruthy();
      expect(DIFFICULTY, `${e.id} missing from DIFFICULTY`).toContain(e.id);
      for (const m of enemyMoves(e)) expect(en[`move.${m.id}`], m.id).toBeTruthy();
    }
    const ids = new Set(CARD_LIST.map((c) => c.id));
    for (const h of HERO_LIST) for (const id of h.startDeck) expect(ids.has(id), id).toBe(true);
    for (const h of HERO_LIST) expect(h.startDeck, h.id).toHaveLength(15);
    for (const h of HERO_LIST) {
      // A single copy of each listed starter starts upgraded.
      const up = starterCards(h).filter((c) => c.up);
      expect(
        up.map((c) => c.id),
        h.id,
      ).toEqual(h.startUpgraded);
    }
    // The first run's hand-picked rewards: real cards the hero could be offered, four each time.
    for (const h of HERO_LIST)
      for (const offer of h.firstRewards ?? []) {
        expect(offer.length, h.id).toBe(4);
        for (const id of offer)
          expect(CARDS[id] && (CARDS[id].cls === h.id || CARDS[id].cls === 'neutral') && !CARDS[id].pack, `${h.id}: ${id}`).toBeTruthy();
      }
  });

  it('Legendary cards are offered only after elites and bosses, and every act pays better than the one before', () => {
    const share = (kind: 'fight' | 'elite', act: number): number => {
      const odds = rewardOdds(kind, act);
      return 1 - odds.filter(([r]) => r === 'common').reduce((n, [, w]) => n + w, 0) / odds.reduce((n, [, w]) => n + w, 0);
    };
    for (let act = 1; act <= ACT_DEFS.length; act++) {
      expect(rewardOdds('fight', act).some(([r]) => r === 'legendary')).toBe(false);
      expect(rewardOdds('elite', act).some(([r]) => r === 'legendary')).toBe(true);
      expect(rewardOdds('boss', act).every(([r]) => r === 'legendary')).toBe(true);
      if (act > 1) {
        expect(rewardUpgradeChance(act)).toBeGreaterThan(rewardUpgradeChance(act - 1));
        expect(share('fight', act)).toBeGreaterThan(share('fight', act - 1));
        expect(share('elite', act)).toBeGreaterThan(share('elite', act - 1));
      }
    }
  });

  it('every enemy past the first three can grow stronger, except the ones with nothing to hit with or a single move', () => {
    const exempt = ['toxicCoworker', 'guyAsleep', 'overthinker'];
    for (const e of ENEMY_LIST.slice(3)) {
      const grows = enemyMoves(e).some((m) => m.status?.some((s) => s.id === 'strength' && s.target === 'enemy'));
      expect(grows, e.id).toBe(!exempt.includes(e.id));
    }
  });

  it('cards whose main effect is healing cost at least 2 and exhaust (potions are consumed instead)', () => {
    const healers = CARD_LIST.filter((c) => c.type !== 'curse' && c.type !== 'potion' && /^\{(heal|regen)|^\{undo\}/.test(c.face));
    expect(healers.length).toBeGreaterThan(5);
    for (const c of healers) {
      expect(c.cost, `${c.id}: cost`).toBeGreaterThanOrEqual(2);
      expect(c.keywords, `${c.id}: exhaust`).toContain('exhaust');
    }
  });

  it('elites and bosses start the fight with Block, normal enemies without', () => {
    for (const e of ENEMY_LIST) expect(!!e.block, e.id).toBe(e.tier !== 'normal');
  });

  it('every card has its own art, never shared with another card or a rule icon', () => {
    const rules = new Set([
      ...Object.values(GLYPHS).map((g) => g.icon),
      ...STATUS_ORDER.map((id) => STATUSES[id].icon),
      ...Object.values(INTENT_ICON),
      ...Object.values(TAG_ICON),
      ...PERK_LIST.map((p) => p.icon),
      ...Object.values(HEXES).map((x) => x.icon),
      ...Object.values(ABILITY_ICON),
      ...Object.values(PASSIVE_ICON),
      ...Object.values(NODE_ICON),
    ]);
    const seen = new Map<string, string>();
    for (const c of CARD_LIST) {
      expect(ICONS[c.art], `${c.id}: missing icon ${c.art}`).toBeTruthy();
      expect(seen.get(c.art), `${c.id} and ${seen.get(c.art)} share ${c.art}`).toBeUndefined();
      expect(rules.has(c.art), `${c.id} uses the rule icon ${c.art}`).toBe(false);
      seen.set(c.art, c.id);
    }
  });

  it('a hero whose passive is a status points at a real, timed one that drains', () => {
    for (const h of HERO_LIST) {
      if (!h.passiveStatus) continue;
      const def = STATUSES[h.passiveStatus];
      expect(def, `${h.id}: ${h.passiveStatus}`).toBeTruthy();
      expect(def.kind === 'timed' && def.span && def.span > 0, `${h.passiveStatus} needs a span`).toBeTruthy();
    }
  });

  it('every act boss wears an icon of its own on the map', () => {
    const icons = ACT_DEFS.map((d) => (d.bossClock ? 'clock' : (d.bossIcon ?? 'default')));
    expect(new Set(icons).size).toBe(ACT_DEFS.length);
    for (const d of ACT_DEFS) if (d.bossIcon) expect(ICONS[d.bossIcon], d.bossIcon).toBeTruthy();
  });

  it('every relic has a name, a text and a sprite of its own', () => {
    for (const r of RELIC_LIST) {
      expect(en[`relic.${r.id}.name`] && en[`relic.${r.id}.d`], r.id).toBeTruthy();
      expect(RELIC_SPRITES[`relic.${r.id}`], `${r.id}: missing sprite`).toBeTruthy();
    }
    expect(Object.keys(RELIC_SPRITES).length).toBe(RELIC_LIST.length);
  });

  it('every room picture has a sprite (and its second frame, if it has one)', () => {
    for (const [type, scene] of Object.entries(ROOM_SCENE)) {
      expect(ROOM_SPRITES[`room.${type}`], `${type}: missing sprite`).toBeTruthy();
      if (scene.alt) expect(ROOM_SPRITES[`room.${type}.open`], `${type}: missing second frame`).toBeTruthy();
    }
    expect(Object.keys(ROOM_SPRITES).length).toBe(Object.keys(ROOM_SCENE).length + Object.values(ROOM_SCENE).filter((s) => s.alt).length);
  });

  it('every management memo has a name, a text and an icon, and changes something', () => {
    for (const m of MODIFIER_LIST) {
      expect(en[`memo.${m.id}.name`] && en[`memo.${m.id}.d`], m.id).toBeTruthy();
      expect(ICONS[m.icon], `${m.id}: missing icon ${m.icon}`).toBeTruthy();
      expect(m.enemyHp ?? m.enemyDmg ?? m.beltMul ?? m.heroHp ?? m.restHeal ?? m.rewardCards, `${m.id} does nothing`).toBeDefined();
    }
  });

  it('every perk and status has a name and a description', () => {
    for (const p of PERK_LIST) expect(en[`perk.${p.id}`] && en[`perk.${p.id}.d`], p.id).toBeTruthy();
    for (const id of STATUS_ORDER) expect(en[`status.${id}`] && en[`status.${id}.d`], id).toBeTruthy();
  });
});

describe('colours', () => {
  const tokens = readFileSync('src/styles/tokens.css', 'utf8');
  const token = (name: string): string | undefined => new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(tokens)?.[1];

  it('colours are written only in tokens.css and acts.css', () => {
    for (const file of readdirSync('src/styles').filter((f) => f.endsWith('.css') && f !== 'tokens.css' && f !== 'acts.css')) {
      const hexes = readFileSync(`src/styles/${file}`, 'utf8').match(/#[0-9a-fA-F]{3,8}\b/g);
      expect(hexes, `${file} has raw colours: use a token`).toBeNull();
    }
  });

  it('every status has a tone, and every tone has its two inks and its data-tone rule in tokens.css', () => {
    const tones = ['red', 'green', 'purple', 'blue', 'teal', 'amber', 'mint'];
    for (const id of STATUS_ORDER) expect(tones, id).toContain(STATUSES[id].tone);
    for (const tone of tones) {
      expect(tokens, tone).toContain(`--tone-${tone}:`);
      expect(tokens, tone).toContain(`--tone-${tone}-hi:`);
      expect(tokens, tone).toContain(`[data-tone='${tone}']`);
    }
  });

  it('an enemy move takes the colour of what it does', () => {
    expect(moveTone(ENEMIES.toxicCoworker.main)).toBe('green');
    expect(moveTone(ENEMIES.seniorBoomer.main)).toBe('red');
    expect(moveTone(ENEMIES.hrOrientationVideo.specials[0])).toBe('teal');
    for (const e of ENEMY_LIST) for (const m of enemyMoves(e)) if (m.intent !== 'idle') expect(moveTone(m), `${e.id}.${m.id}`).not.toBeNull();
  });

  it('every inks-with-transparency token starts with its base ink', () => {
    const base: Record<string, string | undefined> = {
      void: token('--void'),
      k: token('--k'),
      paper: token('--paper'),
      p: token('--p'),
      white: '#ffffff',
    };
    for (const m of tokens.matchAll(/--(\w+)-a\d+:\s*(#[0-9a-fA-F]{8})/g)) expect(m[2].slice(0, 7).toLowerCase(), m[0]).toBe(base[m[1]]);
  });

  it('the pixel renderer prints with the inks of the stylesheet', () => {
    expect(INK_HEX).toEqual({ Y: token('--y'), P: token('--p'), B: token('--b'), K: token('--k') });
  });
});

describe('numbers in rules text', () => {
  const used = new Set(Object.values(en).flatMap((text) => [...text.matchAll(/\{\$(\w+)\}/g)].map((m) => m[1])));

  it('every {$name} in a string is a value the game provides, and every value is used', () => {
    for (const name of used) expect(name in VALUES, `{$${name}} is not in VALUES`).toBe(true);
    for (const name of Object.keys(VALUES)) expect(used.has(name), `${name} is in VALUES but no string uses it`).toBe(true);
  });

  it('every value is a plain number', () => {
    for (const [name, v] of Object.entries(VALUES)) expect(Number.isFinite(v), name).toBe(true);
  });
});
