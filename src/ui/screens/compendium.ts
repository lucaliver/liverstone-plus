import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { CARD_LIST } from '../../data/cards';
import { HERO_LIST } from '../../data/heroes';
import { isDiscovered } from '../../game/meta';
import type { CardClass, Rarity } from '../../game/types';
import type { Screen } from '../app';
import { h, onPress } from '../dom';
import { icon } from '../art/icons';
import { cardView } from '../components/cardView';
import { openCardDetail } from '../components/modals';

const RARITY_ORDER: Rarity[] = ['starter', 'common', 'rare', 'epic', 'legendary', 'special'];
const TABS: CardClass[] = [...HERO_LIST.map((hd) => hd.id), 'neutral', 'curse'];

const tabLabel = (c: CardClass): string => t(`compendium.tab.${c}`);

/** Every card in the game, by class. Undiscovered cards show their back and rarity only. */
export function compendiumScreen(onBack: () => void): Screen {
  let tab: CardClass = TABS[0];
  const total = CARD_LIST.length;
  const found = CARD_LIST.filter((c) => isDiscovered(c.id)).length;

  const tabs = h('div', { class: 'tabs', role: 'tablist' });
  const grid = h('div', { class: 'deck-grid comp-grid' });

  const render = (): void => {
    tabs.replaceChildren(
      ...TABS.map((c) =>
        h(
          'button',
          {
            role: 'tab',
            'aria-selected': String(c === tab),
            onclick: () => {
              sfx('tap');
              tab = c;
              render();
            },
          },
          tabLabel(c),
        ),
      ),
    );
    const cards = CARD_LIST.filter((c) => c.cls === tab).sort(
      (a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) || a.cost - b.cost || a.id.localeCompare(b.id),
    );
    grid.replaceChildren(
      ...cards.map((def) => {
        // Every card can be inspected; undiscovered ones just carry a "?" badge.
        const el = cardView({ uid: -1, id: def.id, up: false }, { cls: isDiscovered(def.id) ? '' : 'undiscovered' });
        onPress(el, () => {
          sfx('tap');
          openCardDetail({ uid: -1, id: def.id, up: false });
        });
        return el;
      }),
    );
    grid.scrollTop = 0;
  };
  render();

  const el = h(
    'div',
    { class: 'screen compendium' },
    h(
      'div',
      { class: 'topline' },
      h('button', { class: 'icon-btn', 'aria-label': t('common.back'), onclick: () => (sfx('tap'), onBack()), html: icon('left') }),
      h('h1', { class: 'h1' }, t('compendium.title')),
    ),
    h('p', { class: 'sub' }, t('compendium.progress', { n: found, total })),
    tabs,
    h('div', { class: 'scroll', style: { flex: '1', marginTop: '12px' } }, grid),
  );
  return { el };
}
