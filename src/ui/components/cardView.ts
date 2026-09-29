import { t } from '../../core/i18n';
import { CARDS, cardCategory, cardCostOf, cardKeywordsOf, cardValsOf } from '../../data/cards';
import { PERKS } from '../../data/perks';
import type { Combat } from '../../game/combat';
import type { CardInst } from '../../game/types';
import { h } from '../dom';
import { icon } from '../art/icons';

const KEYWORD_LINE = ['innate', 'pending', 'exhaust', 'consume', 'fleeting', 'volatile', 'unplayable'];
export const TAG_ICON: Record<string, string> = {
  innate: 'flag',
  pending: 'pending',
  exhaust: 'cross',
  consume: 'trash',
  fleeting: 'wing',
  volatile: 'combust',
};

/** Glyph kind → icon and the unit shown after its value. */
export const GLYPHS: Record<string, { icon: string; unit?: string; sign?: string }> = {
  dmg: { icon: 'sword' },
  block: { icon: 'shield' },
  heal: { icon: 'heart', sign: '+' },
  mana: { icon: 'crystal', sign: '+' },
  stun: { icon: 'stars', unit: 's' },
  /** You are stunned (not the enemy). */
  selfStun: { icon: 'ko', unit: 's' },
  chill: { icon: 'snow', unit: 's' },
  rush: { icon: 'speedCards', unit: 's' },
  burn: { icon: 'flame' },
  str: { icon: 'fist', sign: '+' },
  dodge: { icon: 'mirror', unit: 's' },
  parry: { icon: 'crossed' },
  hp: { icon: 'blood', sign: '-' },
  grow: { icon: 'growth', sign: '+' },
  snow: { icon: 'snow' },
  skull: { icon: 'heartbreak' },
  exit: { icon: 'exitSlot' },
  clog: { icon: 'slime' },
  gate: { icon: 'gate' },
  boom: { icon: 'bomb' },
  drain: { icon: 'crystal', sign: '-' },
  crystal: { icon: 'crystalSlot', sign: '+' },
  poison: { icon: 'drop' },
  vuln: { icon: 'crack', unit: 's' },
  weak: { icon: 'broken', unit: 's' },
  fort: { icon: 'fortress', unit: 's' },
  weave: { icon: 'bolt2', sign: '+' },
  cards: { icon: 'cards' },
  timer: { icon: 'timer', unit: 's' },
  skip: { icon: 'skip' },
  copy: { icon: 'copy' },
  addCard: { icon: 'addCard', sign: '+' },
  lane: { icon: 'lane' },
  sudo: { icon: 'terminal', unit: 's' },
  tickUp: { icon: 'timer', sign: '+' },
  sleeve: { icon: 'hand' },
  tickDown: { icon: 'timer', sign: '-' },
  undo: { icon: 'undo' },
  auto: { icon: 'autopilot', unit: 's' },
  balance: { icon: 'seesaw' },
};

/** Long names get a smaller font so they fit the title band instead of being cut. */
const nameFit = (name: string): string => (name.length > 14 ? 'xlong' : name.length > 10 ? 'long' : '');

/** Stands in for the name or text of something not met or unlocked yet (handbook, hero select). */
export const UNKNOWN = '????';

export function cardName(card: CardInst): string {
  return t(`card.${card.id}.name`);
}

export function cardCostLabel(card: CardInst & { tax?: number }): string {
  const cost = cardCostOf(card);
  return cost < 0 ? 'X' : String(cost);
}

/** Value HTML with live damage preview (green = buffed/upgraded, red = weakened). */
function valueHtml(card: CardInst & { bonus?: number }, idx: number, combat?: Combat | null): string {
  const def = CARDS[card.id];
  const base = cardValsOf(card)[idx];
  const upgraded = card.up && def.upVals && def.upVals[idx] !== def.vals[idx];
  if (combat && def.dmg?.includes(idx)) {
    const v = combat.previewHeroDamage(base, def);
    const cls = v > base ? 'buff' : v < base ? 'nerf' : upgraded ? 'upg' : '';
    return `<b class="${cls}">${v}</b>`;
  }
  return `<b class="${upgraded ? 'upg' : ''}">${base}</b>`;
}

/**
 * The language-neutral face: icons + big numbers, one effect per line (`|`).
 * Grammar: `{kind:i}` icon + value i · `{kind}` icon · `{?kind}` condition, shown as (icon) · `{i}` bare value · other text as is.
 */
export function cardFace(card: CardInst & { bonus?: number }, combat?: Combat | null): string {
  const def = CARDS[card.id];
  const lines = def.face.split('|').map((line) => {
    let kind = 'op';
    const html = line.replace(
      /\{(\?)?(\w+)(?::(\d))?\}|([^{]+)/g,
      (_, cond: string | undefined, k: string | undefined, idx: string | undefined, text: string | undefined) => {
        if (text !== undefined) return `<span class="op">${text}</span>`;
        if (/^\d$/.test(k!)) return valueHtml(card, Number(k), combat);
        const g = GLYPHS[k!];
        if (cond) return `<span class="cond">(${icon(g.icon)})</span>`;
        if (kind === 'op') kind = k!;
        const val =
          idx !== undefined ? `${g.sign ?? ''}${valueHtml(card, Number(idx), combat)}${g.unit ? `<span class="unit">${g.unit}</span>` : ''}` : '';
        return `${icon(g.icon)}${val}`;
      },
    );
    return `<div class="gl gk-${kind}">${html}</div>`;
  });
  return lines.join('');
}

/** Full rules text as HTML (detail view). */
export function cardText(card: CardInst & { bonus?: number }): string {
  const def = CARDS[card.id];
  const vals = cardValsOf(card);
  let s = t(`card.${card.id}.desc`).replace(/\{(\d)\}/g, (_, i: string) => {
    const idx = Number(i);
    const upgraded = card.up && def.upVals && def.upVals[idx] !== def.vals[idx];
    return `<span class="num ${upgraded ? 'upg' : ''}">${vals[idx]}</span>`;
  });
  s = s.replace(/\[(\w+)\]/g, (_, kw: string) => `<b class="kw">${t(`kw.${kw}`)}</b>`);
  const kws = cardKeywordsOf(card).filter((k) => KEYWORD_LINE.includes(k));
  const extra = kws.map((k) => `<b class="kw">${t(`kw.${k}`)}</b>`);
  if (def.type === 'power') extra.unshift(`<b class="kw">${t('kw.power')}</b>`);
  if (extra.length) s += `<span class="kwline">${extra.join(' · ')}</span>`;
  return s;
}

/** Keywords referenced by a card, for the glossary in the detail view. */
export function cardKeywords(card: CardInst): string[] {
  const def = CARDS[card.id];
  const found = new Set<string>();
  for (const m of t(`card.${card.id}.desc`).matchAll(/\[(\w+)\]/g)) found.add(m[1]);
  for (const k of cardKeywordsOf(card)) if (KEYWORD_LINE.includes(k)) found.add(k);
  if (def.type === 'power') found.add('power');
  if (def.cost < 0) found.add('x');
  return [...found];
}

export interface CardViewOpts {
  combat?: Combat | null;
  cls?: string;
}

export function cardView(card: CardInst & { bonus?: number }, opts: CardViewOpts = {}): HTMLDivElement {
  const def = CARDS[card.id];
  const el = h('div', {
    class: `card ${opts.cls ?? ''} ${card.up ? 'is-up' : ''}`,
    'data-cls': def.cls,
    'data-type': def.type,
    'data-rarity': def.rarity,
    'data-cat': cardCategory(def.id),
    'data-uid': card.uid,
    'aria-label': cardName(card),
  });
  const tags = cardKeywordsOf(card)
    .filter((k) => TAG_ICON[k])
    .map((k) => icon(TAG_ICON[k]))
    .join('');
  const lines = def.face.split('|').length;
  el.innerHTML = `
    <div class="c-top"><div class="c-cost ${card.perks?.some((p) => PERKS[p]?.costDelta) ? 'cheap' : ''}">${cardCostLabel(card)}</div><div class="c-name ${nameFit(cardName(card))}">${cardName(card)}</div></div>
    <div class="c-art">${icon(def.art)}</div>
    <div class="c-face ${lines > 1 ? 'two' : ''}">${cardFace(card, opts.combat)}</div>
    ${tags ? `<div class="c-tags">${tags}</div>` : ''}
    <div class="c-gem"></div>`;
  return el;
}
