import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { CARD_LIST } from '../../data/cards';
import { CONFIG } from '../../data/config';
import { ENEMY_LIST } from '../../data/enemies';
import type { EnemyDef } from '../../game/types';
import { HERO_LIST } from '../../data/heroes';
import { isDiscovered } from '../../game/meta';
import type { CardClass, Rarity } from '../../game/types';
import type { Screen } from '../app';
import { h, onPress } from '../dom';
import { icon } from '../art/icons';
import { creature } from '../art/creatures';
import { cardView } from '../components/cardView';
import { movePattern } from '../components/moveText';
import { openCardAnatomy, openCardDetail } from '../components/modals';

const RARITY_ORDER: Rarity[] = ['starter', 'common', 'rare', 'epic', 'legendary', 'special'];
const TABS: CardClass[] = [...HERO_LIST.map((hd) => hd.id), 'neutral', 'curse'];

const tabLabel = (c: CardClass): string => t(`compendium.tab.${c}`);

const TIERS: EnemyDef['tier'][] = ['normal', 'elite', 'boss'];

function foeView(e: EnemyDef): HTMLElement {
  const el = h('article', {
    class: 'foe',
    html: `<div class="foe-head"><div class="foe-art">${creature(e.art)}</div><div class="foe-id"><h3>${t(`enemy.${e.id}.name`)}</h3>${
      e.tier !== 'normal' ? `<span class="tier ${e.tier}">${t(`journey.node.${e.tier}`)}</span>` : ''
    }<span class="foe-hp">${icon('heart')}${Math.round(e.hp * CONFIG.enemyHp)}</span></div></div>${movePattern(e)}`,
  });
  // Moves that add a curse: press to see the card.
  for (const li of el.querySelectorAll<HTMLElement>('li[data-card]')) {
    onPress(li, () => {
      sfx('tap');
      openCardDetail({ uid: -1, id: li.dataset.card!, up: false });
    });
  }
  return el;
}

/** Every card in the game by class, plus every enemy and its moves. */
export function compendiumScreen(onBack: () => void): Screen {
  let tab: CardClass = TABS[0];
  let section: 'cards' | 'enemies' = 'cards';
  const total = CARD_LIST.length;
  const found = CARD_LIST.filter((c) => isDiscovered(c.id)).length;

  const tabs = h('div', { class: 'tabs', role: 'tablist' });
  const grid = h('div', { class: 'deck-grid comp-grid' });

  const sectionSwitch = h('div', { class: 'seg section-switch', role: 'tablist' });
  const foes = h('div', { class: 'foes' }, ...[...ENEMY_LIST].sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier)).map(foeView));
  const cardsWrap = h('div', null);
  const sub = h('p', { class: 'sub' });

  const render = (): void => {
    sectionSwitch.replaceChildren(
      ...(['cards', 'enemies'] as const).map((sct) =>
        h(
          'button',
          {
            role: 'tab',
            'aria-selected': String(sct === section),
            'aria-pressed': String(sct === section),
            onclick: () => {
              sfx('tap');
              section = sct;
              render();
            },
          },
          t(`compendium.${sct}`),
        ),
      ),
    );
    sub.textContent = section === 'cards' ? t('compendium.progress', { n: found, total }) : t('compendium.foes', { n: ENEMY_LIST.length });
    cardsWrap.hidden = section !== 'cards';
    foes.hidden = section !== 'enemies';
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
        // Every card can be inspected; undiscovered ones hide their name behind question marks.
        const known = isDiscovered(def.id);
        const el = cardView({ uid: -1, id: def.id, up: false }, { cls: known ? '' : 'undiscovered' });
        const name = el.querySelector<HTMLElement>('.c-name');
        if (!known && name) name.textContent = name.textContent!.replace(/\S/g, '?');
        onPress(el, () => {
          sfx('tap');
          openCardDetail({ uid: -1, id: def.id, up: false });
        });
        return el;
      }),
    );
    grid.scrollTop = 0;
  };
  cardsWrap.append(tabs, h('div', { style: { height: '12px' } }), grid);
  render();

  const el = h(
    'div',
    { class: 'screen compendium' },
    h(
      'div',
      { class: 'topline' },
      h('button', {
        class: 'icon-btn',
        'aria-label': t('common.back'),
        onclick: () => {
          sfx('tap');
          onBack();
        },
        html: icon('left'),
      }),
      h('h1', { class: 'h1' }, t('compendium.title')),
      h('button', {
        class: 'icon-btn',
        'aria-label': t('compendium.anatomy'),
        onclick: () => {
          sfx('tap');
          openCardAnatomy();
        },
        html: icon('question'),
      }),
    ),
    sectionSwitch,
    h('div', { class: 'scroll', style: { flex: '1' } }, sub, cardsWrap, foes),
  );
  return { el };
}
