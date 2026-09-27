import { t } from '../../core/i18n';
import { CONFIG } from '../../data/config';
import { STATUSES } from '../../data/statuses';
import type { MoveDef } from '../../game/types';
import { icon } from '../art/icons';

/**
 * Colour-coded description of an enemy move (base values unless live `values` are given): damage in red,
 * Block in blue, statuses in their tone, curses in purple, theft in amber.
 * `verbose` adds words ("15 damage", "adds Hex") for the in-fight info sheet.
 */
export interface MoveValues {
  /** Damage per hit as it will land (floor scaling, Strength, Weak…). */
  dmg: (m: MoveDef) => number;
  block: (m: MoveDef) => number;
}

const baseValues: MoveValues = {
  dmg: (m) => Math.round((m.dmg ?? 0) * CONFIG.enemyDmg),
  block: (m) => Math.round((m.block ?? 0) * CONFIG.enemyDmg),
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
  for (const st of m.status ?? []) {
    // Tone from the player's point of view: an enemy buff or a debuff on the hero is bad news.
    const bad = st.target === 'hero' ? !STATUSES[st.id].good : STATUSES[st.id].good;
    parts.push(
      `<span class="fx ${bad ? 'fx-bad' : 'fx-good'}">${icon(STATUSES[st.id].icon)}${t(`status.${st.id}`)} <b>${st.t ? `${st.t}s` : `+${st.v ?? 1}`}</b></span>`,
    );
  }
  if (m.curse) {
    const card = t(`card.${m.curse.id}.name`);
    const n = m.curse.n > 1 ? ` ×${m.curse.n}` : '';
    parts.push(`<span class="fx fx-curse">${icon('skull')}${verbose ? t('move.fx.adds', { card }) : card}<b>${n}</b></span>`);
  }
  if (m.steal) parts.push(`<span class="fx fx-steal">${icon('hand')}${t('compendium.steal')}</span>`);
  return parts.join(' ');
}
