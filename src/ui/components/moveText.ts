import { t } from '../../core/i18n';
import { CONFIG } from '../../data/config';
import { HEXES } from '../../data/hexes';
import { STATUSES } from '../../data/statuses';
import type { EnemyDef, MoveDef } from '../../game/types';
import { icon, INTENT_ICON } from '../art/icons';

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
  if (m.hex) {
    const { belt, draw } = m.hex;
    const n = belt === 'all' ? t('move.fx.hexAll', { n: draw }) : `×${belt + draw}`;
    parts.push(`<span class="fx fx-curse">${icon(HEXES[m.hex.id].icon)}${t(`hex.${m.hex.id}`)} <b>${n}</b></span>`);
  }
  if (m.steal) parts.push(`<span class="fx fx-steal">${icon('hand')}${t('compendium.steal')}</span>`);
  return parts.join(' ');
}

/**
 * An enemy's whole attack pattern: the main attack, the specials it uses in turn, then its passives and enrage.
 * In a fight, `mark` highlights the move being charged and the next special.
 */
export function movePattern(e: EnemyDef, values: MoveValues = baseValues, mark?: { now: MoveDef; next: MoveDef | null }): string {
  const row = (m: MoveDef): string => {
    const cls = m === mark?.now ? 'now' : m === mark?.next ? 'next' : '';
    // A curse row names its card, so the handbook can open it on a press.
    return `<li class="${cls}" data-intent="${m.intent}"${m.curse ? ` data-card="${m.curse.id}"` : ''}><span class="mi">${icon(INTENT_ICON[m.intent] ?? 'star')}</span><span class="mn">${t(`move.${m.id}`)}</span><span class="me">${moveEffect(m, false, values)}</span><span class="mt">${m.windup.toFixed(1)}s</span></li>`;
  };
  const every = e.specials.length ? `<li class="foe-every">${t('compendium.every', { n: e.every })}</li>` : '';
  const traits = enemyTraits(e)
    .map((x) => `<p class="foe-half">${icon(x.icon)}${x.name ? `<b>${x.name}</b>: ` : ''}${x.desc}</p>`)
    .join('');
  return `<ul class="foe-moves">${row(e.main)}${every}${e.specials.map(row).join('')}</ul>${traits}`;
}

/** What an enemy does beyond its moves: passive statuses and what happens at half HP. */
export function enemyTraits(e: EnemyDef): { icon: string; name: string; desc: string }[] {
  const traits = (e.start ?? [])
    .filter((s) => STATUSES[s.id].passive)
    .map((s) => ({ icon: STATUSES[s.id].icon, name: t(`status.${s.id}`), desc: t(`status.${s.id}.d`, { v: s.v ?? 1 }) }));
  if (e.onHalf) traits.push({ icon: 'rage', name: '', desc: t(`enemy.${e.id}.half`) });
  return traits;
}
