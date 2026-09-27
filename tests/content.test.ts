import { describe, expect, it } from 'vitest';
import enStrings from '../src/i18n/en';

/** Indexed as a plain dictionary: these tests check keys that are built at runtime. */
const en: Record<string, string> = enStrings;
import { CARD_LIST } from '../src/data/cards';
import { ENEMY_LIST, enemyMoves } from '../src/data/enemies';
import { HERO_LIST } from '../src/data/heroes';
import { GLYPHS } from '../src/ui/components/cardView';

describe('content integrity', () => {
  it('every card has i18n text and valid face glyphs', () => {
    for (const c of CARD_LIST) {
      expect(en[`card.${c.id}.name`], c.id).toBeTruthy();
      expect(en[`card.${c.id}.desc`], c.id).toBeTruthy();
      for (const m of c.face.matchAll(/\{(\w+)(?::\d)?\}/g)) {
        if (/^\d$/.test(m[1])) continue;
        expect(GLYPHS[m[1]], `${c.id}: ${m[1]}`).toBeTruthy();
      }
      for (const m of en[`card.${c.id}.desc`].matchAll(/\[(\w+)\]/g)) expect(en[`kw.${m[1]}`], `${c.id}: kw ${m[1]}`).toBeTruthy();
    }
  });

  it('every enemy and move has a name, every hero deck exists', () => {
    for (const e of ENEMY_LIST) {
      expect(en[`enemy.${e.id}.name`], e.id).toBeTruthy();
      for (const m of enemyMoves(e)) expect(en[`move.${m.id}`], m.id).toBeTruthy();
    }
    const ids = new Set(CARD_LIST.map((c) => c.id));
    for (const h of HERO_LIST) for (const id of h.startDeck) expect(ids.has(id), id).toBe(true);
  });
});
