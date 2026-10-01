import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { canVend, vend, vendingCost, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h } from '../dom';
import { icon } from '../art/icons';
import { CARD_SHOW_MS, playCardGain } from '../components/cardShow';
import { closeRoom, roomOption, roomScene } from '../components/room';
import { runHud } from './journey';

const RARITIES = ['rare', 'epic'] as const;

/** Vending Machine: a random rare or epic card drops into the deck, paid in HP. */
export function vendingScreen(run: RunState, onDone: () => void): Screen {
  const el = h(
    'div',
    { class: 'screen' },
    runHud(run),
    h('h1', { class: 'h1', style: { marginTop: '12px' } }, t('vending.title')),
    h('p', { class: 'sub' }, t('vending.desc')),
    roomScene('vending'),
    h(
      'div',
      { class: 'rest-options' },
      ...RARITIES.map((rarity) =>
        roomOption(
          icon(rarity === 'rare' ? 'sandwich' : 'pizza'),
          t(`vending.${rarity}`),
          canVend(run, rarity) ? t(`vending.${rarity}Desc`, { n: vendingCost(rarity) }) : t('vending.weak'),
          !canVend(run, rarity),
          () => {
            sfx('tap');
            playCardGain(el, { ...vend(run, rarity) }, t('vending.dropped'), { start: 'bloodDrip', end: 'thunk' });
            closeRoom(el, onDone, CARD_SHOW_MS);
          },
        ),
      ),
    ),
  );
  return { el };
}
