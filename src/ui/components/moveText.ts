import { t } from '../../core/i18n';
import { CONFIG } from '../../data/config';
import type { MoveDef } from '../../game/types';
import { icon } from '../art/icons';

/** Short, icon-led description of an enemy move (base values, before floor scaling). */
export function moveEffect(m: MoveDef): string {
  const parts: string[] = [];
  if (m.dmg) parts.push(`${icon('sword')}<b>${Math.round(m.dmg * CONFIG.enemyDmg)}${m.hits && m.hits > 1 ? `×${m.hits}` : ''}</b>`);
  if (m.block) parts.push(`${icon('shield')}<b>${Math.round(m.block * CONFIG.enemyDmg)}</b>`);
  for (const st of m.status ?? []) parts.push(`${t(`status.${st.id}`)} ${st.t ? `${st.t}s` : `+${st.v ?? 1}`}`);
  if (m.curse) parts.push(`${icon('skull')}${t(`card.${m.curse.id}.name`)}${m.curse.n > 1 ? ` ×${m.curse.n}` : ''}`);
  if (m.steal) parts.push(t('compendium.steal'));
  return parts.join(' ');
}
