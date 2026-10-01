import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { PERK_LIST } from '../../data/perks';
import { addPerk, canPerk, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h } from '../dom';
import { icon } from '../art/icons';
import { CARD_SHOW_MS, playCardChange } from '../components/cardShow';
import { openDeck } from '../components/modals';
import { closeRoom, roomOption, roomScene } from '../components/room';
import { runHud } from './journey';

/** Promotion: pick a perk, then the deck card that earns it (for good). */
export function promotionScreen(run: RunState, onDone: () => void): Screen {
  const el = h(
    'div',
    { class: 'screen' },
    runHud(run),
    h('h1', { class: 'h1', style: { marginTop: '12px' } }, t('promo.title')),
    h('p', { class: 'sub' }, t('promo.desc')),
    roomScene('promotion'),
    h(
      'div',
      { class: 'rest-options' },
      ...PERK_LIST.map((p) => {
        const fits = run.deck.filter((c) => canPerk(c, p.id));
        return roomOption(icon(p.icon), t(`perk.${p.id}`), t(`perk.${p.id}.d`), fits.length === 0, () => {
          sfx('tap');
          openDeck(run.deck, {
            title: t('promo.hint'),
            confirmLabel: t('promo.confirm'),
            filter: (c) => canPerk(c, p.id),
            previewSelected: (c) => ({ ...c, perks: [...(c.perks ?? []), p.id] }),
            onPick: (c) => {
              const before = { ...c };
              addPerk(run, c.uid, p.id);
              playCardChange(el, before, { ...c }, t(`perk.${p.id}`));
              closeRoom(el, onDone, CARD_SHOW_MS);
            },
          });
        });
      }),
    ),
  );
  return { el };
}
