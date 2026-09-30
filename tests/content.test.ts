import { describe, expect, it } from 'vitest';
import enStrings from '../src/i18n/en';

/** Indexed as a plain dictionary: these tests check keys that are built at runtime. */
const en: Record<string, string> = enStrings;
import { CARD_LIST, CARDS } from '../src/data/cards';
import { DIFFICULTY, ENEMY_LIST, enemyMoves } from '../src/data/enemies';
import { HERO_LIST } from '../src/data/heroes';
import { PERK_LIST } from '../src/data/perks';
import { STATUS_ORDER, STATUSES } from '../src/data/statuses';
import { GLYPHS, TAG_ICON } from '../src/ui/components/cardView';
import { ICONS, INTENT_ICON } from '../src/ui/art/icons';
import { HEXES } from '../src/data/hexes';
import { ENEMIES } from '../src/data/enemies';
import { PERKS } from '../src/data/perks';
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
      for (const m of c.face.matchAll(/\{\??(\w+)(?::\d)?\}/g)) {
        if (/^\d$/.test(m[1])) continue;
        expect(GLYPHS[m[1]], `${c.id}: ${m[1]}`).toBeTruthy();
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
    // The first run's hand-picked rewards: real cards the hero could be offered, four each time.
    for (const h of HERO_LIST)
      for (const offer of h.firstRewards ?? []) {
        expect(offer.length, h.id).toBe(4);
        for (const id of offer)
          expect(CARDS[id] && (CARDS[id].cls === h.id || CARDS[id].cls === 'neutral') && !CARDS[id].pack, `${h.id}: ${id}`).toBeTruthy();
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

  it('every perk and status has a name and a description', () => {
    for (const p of PERK_LIST) expect(en[`perk.${p.id}`] && en[`perk.${p.id}.d`], p.id).toBeTruthy();
    for (const id of STATUS_ORDER) expect(en[`status.${id}`] && en[`status.${id}.d`], id).toBeTruthy();
  });
});
