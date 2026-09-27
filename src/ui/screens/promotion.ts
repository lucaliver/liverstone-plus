import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { PERK_LIST } from '../../data/perks';
import { addPerk, canPerk, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h } from '../dom';
import { icon } from '../art/icons';
import { openDeck } from '../components/modals';
import { motes } from '../components/decor';
import { runHud } from './journey';

/** Promotion: pick a perk, then the deck card that earns it (for good). */
export function promotionScreen(run: RunState, onDone: () => void): Screen {
  const el = h(
    'div',
    { class: 'screen' },
    runHud(run),
    h('h1', { class: 'h1', style: { marginTop: '12px' } }, t('promo.title')),
    h('p', { class: 'sub' }, t('promo.desc')),
    h('div', { class: 'rest-fire', html: `${motes(14, ['var(--y)', 'var(--b)'])}<div class="promo-badge">${icon('up')}</div>` }),
    h(
      'div',
      { class: 'rest-options' },
      ...PERK_LIST.map((p) => {
        const fits = run.deck.filter((c) => canPerk(c, p.id));
        return h('button', {
          class: 'option',
          disabled: fits.length === 0,
          html: `${icon(p.icon)}<b>${t(`perk.${p.id}`)}</b><span>${t(`perk.${p.id}.d`)}</span>`,
          onclick: () => {
            sfx('tap');
            openDeck(run.deck, {
              title: t('promo.hint'),
              confirmLabel: t('promo.confirm'),
              filter: (c) => canPerk(c, p.id),
              previewSelected: (c) => ({ ...c, perks: [...(c.perks ?? []), p.id] }),
              onPick: (c) => {
                sfx('block');
                addPerk(run, c.uid, p.id);
                onDone();
              },
            });
          },
        });
      }),
    ),
  );
  return { el };
}
