import { type TKey, t } from '../../core/i18n';
import { CONFIG } from '../../data/config';
import { HEXES } from '../../data/hexes';
import { STATUSES } from '../../data/statuses';
import { sfx } from '../../audio/sfx';
import type { EnemyDef, MoveDef } from '../../game/types';
import { icon, INTENT_ICON } from '../art/icons';
import { onPress } from '../dom';
import { openCardDetail, openInfo } from './modals';

/**
 * Colour-coded description of an enemy move (base values unless live `values` are given): damage in red,
 * Block in blue, statuses in their tone, curses in purple, theft in amber.
 * `verbose` adds words ("15 damage", "adds Hex") for the in-fight info sheet.
 */
export interface MoveValues {
  /** Damage per hit as it will land (floor scaling, Strength, Weak…). */
  dmg: (m: MoveDef) => number;
  /** Block and heal scale alike. */
  block: (m: MoveDef) => number;
  heal: (m: MoveDef) => number;
}

const baseValues: MoveValues = {
  dmg: (m) => Math.round((m.dmg ?? 0) * CONFIG.enemyDmg),
  block: (m) => Math.round((m.block ?? 0) * CONFIG.enemyDmg),
  heal: (m) => Math.round((m.heal ?? 0) * CONFIG.enemyDmg),
};

export function moveEffect(m: MoveDef, verbose = false, values: MoveValues = baseValues): string {
  const parts: string[] = [];
  if (m.dmg) {
    const n = values.dmg(m);
    const v = m.hits && m.hits > 1 ? `${n}×${m.hits}` : String(n);
    parts.push(`<span class="fx fx-dmg">${icon('sword')}<b>${v}</b>${verbose ? ` ${t('move.fx.damage')}` : ''}</span>`);
  }
  if (m.block) {
    const n = values.block(m);
    parts.push(`<span class="fx fx-block">${icon('shield')}<b>${n}</b>${verbose ? ` ${t('kw.block')}` : ''}</span>`);
  }
  if (m.heal) {
    const n = values.heal(m);
    parts.push(`<span class="fx fx-bad">${icon('heart')}<b>+${n}</b>${verbose ? ` ${t('move.fx.heal')}` : ''}</span>`);
  }
  if (m.drainMana) parts.push(`<span class="fx fx-bad" data-rule="drain">${icon('crystal')}${t('move.fx.drain', { n: m.drainMana })}</span>`);
  for (const st of m.status ?? []) {
    // Tone from the player's point of view: an enemy buff or a debuff on the hero is bad news.
    const bad = st.target === 'hero' ? !STATUSES[st.id].good : STATUSES[st.id].good;
    parts.push(
      `<span class="fx ${bad ? 'fx-bad' : 'fx-good'}" data-status="${st.id}" data-v="${st.v ?? 1}">${icon(STATUSES[st.id].icon)}${t(`status.${st.id}`)} <b>${st.t ? `${st.t}s` : `+${st.v ?? 1}`}</b></span>`,
    );
  }
  // Each curse names its card, so the handbook can open it on a press.
  for (const cu of m.curse ?? []) {
    const card = t(`card.${cu.id}.name`);
    const n = cu.n > 1 ? ` ×${cu.n}` : '';
    parts.push(`<span class="fx fx-curse" data-card="${cu.id}">${icon('skull')}${verbose ? t('move.fx.adds', { card }) : card}<b>${n}</b></span>`);
  }
  if (m.inflate) parts.push(`<span class="fx fx-bad" data-rule="inflation">${icon('inflation')}${t('move.fx.inflate', { n: m.inflate })}</span>`);
  if (m.absorb) parts.push(`<span class="fx fx-block" data-rule="copy">${icon('scanner')}${t('move.fx.absorb')}</span>`);
  if (m.release) parts.push(`<span class="fx fx-dmg" data-rule="copy">${icon('copy')}${t('move.fx.release')}</span>`);
  if (m.intent === 'idle') parts.push(`<span class="fx">${t('move.fx.idle')}</span>`);
  if (m.hex) {
    const n = t('move.fx.hexShare', { n: Math.round(m.hex.share * 100) });
    parts.push(`<span class="fx fx-curse" data-hex="${m.hex.id}">${icon(HEXES[m.hex.id].icon)}${t(`hex.${m.hex.id}`)} <b>${n}</b></span>`);
  }
  if (m.steal) parts.push(`<span class="fx fx-steal">${icon('snatch')}${t('compendium.steal')}</span>`);
  return parts.join(' ');
}

/**
 * An enemy's whole attack pattern: the main attack, the specials it uses in turn, then its passives and enrage.
 * In a fight, `mark` highlights the move being charged and the next special.
 */
export function movePattern(e: EnemyDef, values: MoveValues = baseValues, mark?: { now: MoveDef; next: MoveDef | null }): string {
  const row = (m: MoveDef): string => {
    const cls = m === mark?.now ? 'now' : m === mark?.next ? 'next' : '';
    return `<li class="${cls}" data-intent="${m.intent}"><span class="mi">${icon(moveIcon(m))}</span><span class="mn">${t(`move.${m.id}`)}</span><span class="me">${moveEffect(m, false, values)}</span><span class="mt">${m.windup.toFixed(1)}s</span></li>`;
  };
  const every = e.specials.length ? `<li class="foe-every">${t('compendium.every', { n: e.every })}</li>` : '';
  const traits = enemyTraits(e)
    .map((x) => `<p class="foe-half">${icon(x.icon)}${x.name ? `<b>${x.name}</b><i class="sep"></i>` : ''}<span>${x.desc}</span></p>`)
    .join('');
  return `<ul class="foe-moves">${row(e.main)}${every}${e.specials.map(row).join('')}</ul>${traits}`;
}

/** A move's icon: its intent's, or the status's own when applying one status is all it does (Snark: Poison). */
export function moveIcon(m: MoveDef): string {
  const st = m.status?.length === 1 ? m.status[0] : undefined;
  const only = st && !m.dmg && !m.block && !m.heal && !m.curse && !m.hex && !m.inflate && !m.drainMana;
  return only ? STATUSES[st.id].icon : (INTENT_ICON[m.intent] ?? 'star');
}

/** Icon of an enemy's half-HP trait (traits list, status row). */
export const HALF_ICON = 'rage';

/** What an enemy does beyond its moves: passive statuses and (unless `withHalf` is false) what happens at half HP. */
export function enemyTraits(e: EnemyDef, withHalf = true): { icon: string; name: string; desc: string }[] {
  const traits = (e.start ?? [])
    .filter((s) => STATUSES[s.id].passive)
    .map((s) => ({ icon: STATUSES[s.id].icon, name: t(`status.${s.id}`), desc: t(`status.${s.id}.d`, { v: s.v ?? 1 }) }));
  if (e.fillSleeve) traits.push({ icon: 'hand', name: t(`card.${e.fillSleeve}.name`), desc: t('enemy.fillSleeve') });
  if (e.onHalf && withHalf) traits.push({ icon: HALF_ICON, name: '', desc: t(`enemy.${e.id}.half`) });
  return traits;
}

/** Rules a move can bring that aren't statuses or cards, explained on a press. */
const RULES: Record<string, { icon: string; title: TKey; desc: TKey }> = {
  inflation: { icon: 'inflation', title: 'rule.inflation', desc: 'rule.inflation.d' },
  drain: { icon: 'drain', title: 'rule.drain', desc: 'rule.drain.d' },
  copy: { icon: 'scanner', title: 'rule.copy', desc: 'rule.copy.d' },
};

/** Inside a move description (threat info, handbook): press a curse, status, hex or rule to learn what it does. */
export function bindMoveDetails(root: HTMLElement): void {
  for (const el of root.querySelectorAll<HTMLElement>('[data-card], [data-status], [data-hex], [data-rule]')) {
    onPress(el, () => {
      sfx('tap');
      const { card, status, v, hex, rule } = el.dataset;
      if (card) openCardDetail({ uid: -1, id: card, up: false });
      else if (status) {
        const def = STATUSES[status];
        openInfo({
          icon: def.icon,
          title: t(`status.${status}`),
          desc: t(`status.${status}.d`, { v: Number(v ?? 1) }),
          ink: def.good ? 'good' : 'bad',
        });
      } else if (hex) openInfo({ icon: HEXES[hex].icon, title: t(`hex.${hex}`), desc: t(`hex.${hex}.d`, { n: HEXES[hex].taps }), ink: 'bad' });
      else if (rule && RULES[rule]) openInfo({ icon: RULES[rule].icon, title: t(RULES[rule].title), desc: t(RULES[rule].desc), ink: 'bad' });
    });
  }
}
