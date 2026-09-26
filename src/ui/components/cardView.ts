import { t } from '../../core/i18n';
import { CARDS } from '../../data/cards';
import type { Combat } from '../../game/combat';
import type { CardInst } from '../../game/types';
import { h } from '../dom';
import { icon, iconElement } from '../art/icons';

const KEYWORD_LINE = ['exhaust', 'consume', 'fleeting', 'volatile', 'unplayable'];

export function cardName(card: CardInst): string {
  return t(`card.${card.id}.name`) + (card.up ? '+' : '');
}

export function cardCostLabel(card: CardInst): string {
  const def = CARDS[card.id];
  const cost = card.up && def.upCost !== undefined ? def.upCost : def.cost;
  return cost < 0 ? 'X' : String(cost);
}

/** Card rules text as HTML. With a combat, damage values show live modifiers (green up, red down). */
export function cardText(card: CardInst & { bonus?: number }, combat?: Combat | null): string {
  const def = CARDS[card.id];
  const vals = [...(card.up ? (def.upVals ?? def.vals) : def.vals)];
  if (card.bonus && def.dmg?.length) vals[def.dmg[0]] += card.bonus;
  let s = t(`card.${card.id}.desc`).replace(/\{(\d)\}/g, (_, i: string) => {
    const idx = Number(i);
    const base = vals[idx];
    const upgradedDiff = card.up && def.upVals && def.upVals[idx] !== def.vals[idx];
    if (combat && def.dmg?.includes(idx)) {
      const v = combat.previewHeroDamage(base, def);
      const cls = v > base ? 'buff' : v < base ? 'nerf' : upgradedDiff ? 'upg' : '';
      return `<span class="num ${cls}">${v}</span>`;
    }
    return `<span class="num ${upgradedDiff ? 'upg' : ''}">${base}</span>`;
  });
  s = s.replace(/\[(\w+)\]/g, (_, kw: string) => `<b class="kw">${t(`kw.${kw}`)}</b>`);
  const kws = (card.up ? (def.upKeywords ?? def.keywords) : def.keywords) ?? [];
  const extra = kws.filter((k) => KEYWORD_LINE.includes(k)).map((k) => `<b class="kw">${t(`kw.${k}`)}</b>`);
  if (def.type === 'power') extra.unshift(`<b class="kw">${t('kw.power')}</b>`);
  if (extra.length) s += `<span class="kwline">${extra.join(' · ')}</span>`;
  return s;
}

/** Keywords referenced by a card, for the glossary in the detail view. */
export function cardKeywords(card: CardInst): string[] {
  const def = CARDS[card.id];
  const found = new Set<string>();
  for (const m of t(`card.${card.id}.desc`).matchAll(/\[(\w+)\]/g)) found.add(m[1]);
  for (const k of (card.up ? (def.upKeywords ?? def.keywords) : def.keywords) ?? []) if (KEYWORD_LINE.includes(k)) found.add(k);
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
    'data-el': iconElement(def.art),
    'data-uid': card.uid,
  });
  el.innerHTML = `
    <div class="card-face">
      <div class="card-art">${icon(def.art)}</div>
      <div class="card-name"><span>${cardName(card)}</span></div>
      <div class="card-type">${t(`type.${def.type}`)}</div>
      <div class="card-desc"><div>${cardText(card, opts.combat)}</div></div>
      <div class="card-gem"></div>
    </div>
    <div class="card-cost"><span>${cardCostLabel(card)}</span></div>`;
  return el;
}
