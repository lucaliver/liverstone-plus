import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { CARD_LIST } from '../../data/cards';
import { CONFIG } from '../../data/config';
import { ENEMY_LIST } from '../../data/enemies';
import type { EnemyDef, MoveDef } from '../../game/types';
import { HERO_LIST } from '../../data/heroes';
import { isDiscovered } from '../../game/meta';
import type { CardClass, Rarity } from '../../game/types';
import type { Screen } from '../app';
import { h, onPress } from '../dom';
import { icon, INTENT_ICON } from '../art/icons';
import { creature } from '../art/creatures';
import { cardView } from '../components/cardView';
import { openCardDetail } from '../components/modals';

const RARITY_ORDER: Rarity[] = ['starter', 'common', 'rare', 'epic', 'legendary', 'special'];
const TABS: CardClass[] = [...HERO_LIST.map((hd) => hd.id), 'neutral', 'curse'];

const tabLabel = (c: CardClass): string => t(`compendium.tab.${c}`);

const TIERS: EnemyDef['tier'][] = ['normal', 'elite', 'boss'];

/** Short, icon-led description of an enemy move. */
function moveEffect(m: MoveDef): string {
  const parts: string[] = [];
  if (m.dmg) parts.push(`${icon('sword')}<b>${Math.round(m.dmg * CONFIG.enemyDmg)}${m.hits && m.hits > 1 ? `×${m.hits}` : ''}</b>`);
  if (m.block) parts.push(`${icon('shield')}<b>${Math.round(m.block * CONFIG.enemyDmg)}</b>`);
  for (const st of m.status ?? []) parts.push(`${t(`status.${st.id}`)} ${st.t ? `${st.t}s` : `+${st.v ?? 1}`}`);
  if (m.curse) parts.push(`${icon('skull')}${t(`card.${m.curse.id}.name`)}${m.curse.n > 1 ? ` ×${m.curse.n}` : ''}`);
  if (m.steal) parts.push(t('compendium.steal'));
  return parts.join(' ');
}

function foeView(e: EnemyDef): HTMLElement {
  const row = (m: MoveDef): string =>
    `<li data-intent="${m.intent}"><span class="mi">${icon(INTENT_ICON[m.intent] ?? 'star')}</span><span class="mn">${t(`move.${m.id}`)}</span><span class="me">${moveEffect(m)}</span><span class="mt">${m.windup.toFixed(1)}s</span></li>`;
  const moves = `${row(e.main)}<li class="foe-every">${t('compendium.every', { n: e.every })}</li>${e.specials.map(row).join('')}`;
  const half = e.onHalf ? `<p class="foe-half">${icon('rage')}${t(`enemy.${e.id}.half`)}</p>` : '';
  return h('article', {
    class: 'foe',
    html: `<div class="foe-head"><div class="foe-art">${creature(e.art)}</div><div class="foe-id"><h3>${t(`enemy.${e.id}.name`)}</h3>${
      e.tier !== 'normal' ? `<span class="tier ${e.tier}">${t(`journey.node.${e.tier}`)}</span>` : ''
    }<span class="foe-hp">${icon('heart')}${Math.round(e.hp * CONFIG.enemyHp)}</span></div></div><ul class="foe-moves">${moves}</ul>${half}`,
  });
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
    ),
    sub,
    sectionSwitch,
    h('div', { class: 'scroll', style: { flex: '1', marginTop: '12px' } }, cardsWrap, foes),
  );
  return { el };
}
