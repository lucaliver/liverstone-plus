import { describe, expect, it } from 'vitest';
import enStrings from '../src/i18n/en';

/** Indexed as a plain dictionary: these tests check keys that are built at runtime. */
const en: Record<string, string> = enStrings;
import { CARD_LIST, CARDS } from '../src/data/cards';
import { REWARD_ODDS } from '../src/data/config';
import { DIFFICULTY, ENEMY_LIST, enemyMoves } from '../src/data/enemies';
import { HERO_LIST, starterCards } from '../src/data/heroes';
import { PERK_LIST } from '../src/data/perks';
import { STATUS_ORDER, STATUSES } from '../src/data/statuses';
import { GLYPHS, TAG_ICON } from '../src/ui/components/cardView';
import { ICONS, INTENT_ICON } from '../src/ui/art/icons';
import { HEXES } from '../src/data/hexes';
import { MODIFIER_LIST } from '../src/data/modifiers';
import { ENEMIES } from '../src/data/enemies';
import { PERKS } from '../src/data/perks';
import { RELIC_LIST } from '../src/data/relics';
import { RENAMED } from '../src/game/renamed';
import { ABILITY_ICON, PASSIVE_ICON } from '../src/ui/combat/view';
import { NODE_ICON } from '../src/ui/screens/journey';

describe('content integrity', () => {
  it('ids renamed after the English names map old saves onto content that exists, and no old id is reused', () => {
    const kinds: [string, Map<string, string>, Record<string, unknown>][] = [
      ['cards', RENAMED.cards, CARDS],
      ['enemies', RENAMED.enemies, ENEMIES],
      ['perks', RENAMED.perks, PERKS],
    ];
    for (const [kind, table, now] of kinds) {
      for (const [was, is] of table) {
        expect(now[is], `${kind}: ${was} → ${is}`).toBeTruthy();
        expect(now[was], `${kind}: ${was} is still an id`).toBeUndefined();
      }
    }
  });

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

  it('Legendary cards are offered only after elites and bosses', () => {
    expect(REWARD_ODDS.fight.some(([r]) => r === 'legendary')).toBe(false);
    expect(REWARD_ODDS.elite.some(([r]) => r === 'legendary')).toBe(true);
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

  it('every relic has a name, a text and its own icon', () => {
    const arts = new Set<string>();
    for (const r of RELIC_LIST) {
      expect(en[`relic.${r.id}.name`] && en[`relic.${r.id}.d`], r.id).toBeTruthy();
      expect(ICONS[r.art], `${r.id}: missing icon ${r.art}`).toBeTruthy();
      expect(arts.has(r.art), `${r.id} shares ${r.art}`).toBe(false);
      arts.add(r.art);
    }
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
