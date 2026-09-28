import { type TKey, t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { CARD_LIST } from '../../data/cards';
import { CONFIG } from '../../data/config';
import { ENEMY_LIST } from '../../data/enemies';
import type { EnemyDef } from '../../game/types';
import { HERO_LIST } from '../../data/heroes';
import { enemyMet, isDiscovered, records } from '../../game/meta';
import type { CardClass } from '../../game/types';
import type { Screen } from '../app';
import { h, onPress } from '../dom';
import { icon } from '../art/icons';
import { creature } from '../art/creatures';
import { cardView, UNKNOWN } from '../components/cardView';
import { bindMoveDetails, movePattern } from '../components/moveText';
import { openCardAnatomy, openCardDetail, sortCards, sortControl } from '../components/modals';

const TABS: CardClass[] = [...HERO_LIST.map((hd) => hd.id), 'neutral', 'curse'];

const tabLabel = (c: CardClass): string => t(`compendium.tab.${c}`);

const TIERS: EnemyDef['tier'][] = ['normal', 'elite', 'boss'];

function foeView(e: EnemyDef): HTMLElement {
  const el = h('article', {
    class: 'foe',
    html: `<div class="foe-head"><div class="foe-art">${creature(e.art)}</div><div class="foe-id"><h3>${enemyMet(e.id) ? t(`enemy.${e.id}.name`) : UNKNOWN}</h3><span class="tier act">${t('journey.title', { n: e.act })}</span>${
      e.tier !== 'normal' ? `<span class="tier ${e.tier}">${t(`journey.node.${e.tier}`)}</span>` : ''
    }<span class="foe-hp">${icon('heart')}${Math.round(e.hp * CONFIG.enemyHp)}</span></div></div>${movePattern(e)}`,
  });
  bindMoveDetails(el);
  return el;
}

/** Lifetime records, printed like the end of a run's payslip. */
function recordSlip(): HTMLElement {
  const r = records();
  const none = t('records.none');
  const row = (k: TKey, v: string | number): HTMLElement => h('div', { class: 'slip-row' }, h('span', null, t(k)), h('b', null, String(v)));
  return h(
    'div',
    { class: 'payslip records' },
    h('div', { class: 'slip-head' }, h('b', null, t('records.title')), h('span', null, t('end.slip.company'))),
    row('records.runs', r.runs),
    row('records.wins', r.wins),
    row('records.fullDays', r.fullDays),
    row('records.furthest', r.bestAct ? t('records.furthestValue', { a: r.bestAct, n: r.bestFloor }) : none),
    row('records.kills', r.kills),
    row('records.elites', r.elites),
    row('records.bosses', r.bosses),
    row('records.cards', r.cardsPlayed),
    row('records.bestPay', r.bestPay),
    row('records.bestKills', r.bestKills),
    row('records.bestCards', r.bestCards),
    row('records.fastest', r.fastest ? t('records.seconds', { n: r.fastest }) : none),
  );
}

/** Every card in the game by class, every enemy and its moves, and the player's records. */
export function compendiumScreen(onBack: () => void): Screen {
  let tab: CardClass = TABS[0];
  let section: 'cards' | 'enemies' | 'records' = 'cards';
  const total = CARD_LIST.length;
  const found = CARD_LIST.filter((c) => isDiscovered(c.id)).length;

  const tabs = h('div', { class: 'tabs', role: 'tablist' });
  const grid = h('div', { class: 'deck-grid comp-grid' });

  const sectionSwitch = h('div', { class: 'seg section-switch', role: 'tablist' });
  const foes = h(
    'div',
    { class: 'foes' },
    ...[...ENEMY_LIST].sort((a, b) => a.act - b.act || TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier)).map(foeView),
  );
  const cardsWrap = h('div', null);
  const sub = h('p', { class: 'sub' });
  const slip = recordSlip();

  const render = (): void => {
    sectionSwitch.replaceChildren(
      ...(['cards', 'enemies', 'records'] as const).map((sct) =>
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
    sub.textContent =
      section === 'cards'
        ? t('compendium.progress', { n: found, total })
        : section === 'enemies'
          ? t('compendium.foes', { n: ENEMY_LIST.length })
          : '';
    sub.hidden = section === 'records';
    cardsWrap.hidden = section !== 'cards';
    foes.hidden = section !== 'enemies';
    slip.hidden = section !== 'records';
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
    const cards = sortCards(CARD_LIST.filter((c) => c.cls === tab).map((c) => ({ uid: -1, id: c.id, up: false })));
    grid.replaceChildren(
      ...cards.map((card) => {
        // Every card can be inspected; undiscovered ones hide their name behind question marks.
        const known = isDiscovered(card.id);
        const el = cardView(card, { cls: known ? '' : 'undiscovered' });
        const name = el.querySelector<HTMLElement>('.c-name');
        if (!known && name) name.textContent = UNKNOWN;
        onPress(el, () => {
          sfx('tap');
          openCardDetail(card);
        });
        return el;
      }),
    );
    grid.scrollTop = 0;
  };
  cardsWrap.append(tabs, h('div', { style: { height: '12px' } }), sortControl(render), grid);
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
    h('div', { class: 'scroll', style: { flex: '1' } }, sub, cardsWrap, foes, slip),
  );
  return { el };
}
