import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { CARDS } from '../../data/cards';
import { ENEMY_LIST } from '../../data/enemies';
import { HERO_LIST } from '../../data/heroes';
import { RELIC_LIST } from '../../data/relics';
import { unlockAll } from '../../game/meta';
import { settings } from '../../game/settings';
import type { HeroId } from '../../game/types';
import { openModal, type ModalHandle } from '../app';
import { openResetConfirm } from './modals';
import { h } from '../dom';
import { creature } from '../art/creatures';
import { haptic } from '../fx/fx';
import { icon } from '../art/icons';

/** Temporary debug tool: the small floating bug button that opens a debug menu (placed per screen by `.debug-fab`). */
export function debugButton(label: string, onClick: () => void): HTMLButtonElement {
  return h('button', {
    class: 'icon-btn debug-fab',
    'aria-label': label,
    hidden: !settings.debugMenus,
    html: icon('bug'),
    onclick: () => {
      sfx('tap');
      onClick();
    },
  });
}

/** Temporary debug tool: a window of cheat buttons; a tap closes the window, then does it. */
export function openDebugMenu(title: string, items: { label: string; icon: string; run: () => void }[], onClose?: () => void): ModalHandle {
  const handle = openModal({
    title,
    body: h(
      'div',
      { class: 'debug-menu' },
      ...items.map((it) =>
        h(
          'button',
          {
            class: 'btn small secondary',
            html: icon(it.icon),
            onclick: () => {
              sfx('button');
              handle.close();
              it.run();
            },
          },
          h('span', null, it.label),
        ),
      ),
    ),
    actions: [{ label: t('common.close'), cls: 'secondary' }],
    onClose,
  });
  return handle;
}

/** Temporary debug tool: fight any enemy with any hero (a fresh run on floor 1), with extra cards added to the deck to try them. */
export function openDebugFight(onPick: (hero: HeroId, enemy: string, cards: string[]) => void): ModalHandle {
  let hero: HeroId = HERO_LIST[0].id;
  const extra: string[] = [];
  // The heroes across the whole width, each with its portrait.
  const heroSeg = h('div', { class: 'seg debug-heroes', role: 'group', 'aria-label': t('debug.hero') });
  const renderHeroes = (): void => {
    heroSeg.replaceChildren(
      ...HERO_LIST.map((hd) =>
        h('button', {
          'aria-pressed': String(hd.id === hero),
          onclick: () => {
            hero = hd.id;
            extra.length = 0;
            sfx('tap');
            renderHeroes();
            renderCards();
          },
          html: `${creature(hd.id)}<span>${t(`compendium.tab.${hd.id}`)}</span>`,
        }),
      ),
    );
  };
  // Cards of the hero (and the neutral ones), filtered as you type; a tap adds a copy, the count says how many.
  const search = h('input', { class: 'debug-search', type: 'search', placeholder: t('debug.cards'), 'aria-label': t('debug.cards') });
  const cardList = h('div', { class: 'debug-cards' });
  const tabs = h('div', { class: 'debug-tabs', role: 'tablist' });
  const cardsPane = h('div', { class: 'debug-pane' }, search, cardList);
  const foesPane = h('div', { class: 'debug-pane' });
  let tab: 'foes' | 'cards' = 'foes';
  const renderTabs = (): void => {
    const tabBtn = (id: 'foes' | 'cards', label: string): HTMLButtonElement =>
      h(
        'button',
        {
          role: 'tab',
          'aria-selected': String(tab === id),
          onclick: () => {
            tab = id;
            sfx('tap');
            renderTabs();
          },
        },
        label,
      );
    tabs.replaceChildren(tabBtn('foes', t('debug.tab.foes')), tabBtn('cards', t('debug.tab.cards', { n: extra.length })));
    foesPane.hidden = tab !== 'foes';
    cardsPane.hidden = tab !== 'cards';
  };
  const renderCards = (): void => {
    renderTabs();
    const q = search.value.trim().toLowerCase();
    cardList.replaceChildren(
      ...Object.values(CARDS)
        .filter((c) => (c.cls === hero || c.cls === 'neutral') && t(`card.${c.id}.name`).toLowerCase().includes(q))
        .map((c) => {
          const n = extra.filter((id) => id === c.id).length;
          return h('button', {
            class: 'debug-card',
            onclick: () => {
              extra.push(c.id);
              sfx('tap');
              renderCards();
            },
            html: `<span>${t(`card.${c.id}.name`)}</span>${n ? `<b>×${n}</b>` : ''}`,
          });
        }),
    );
  };
  search.addEventListener('input', renderCards);
  renderHeroes();
  let handle: ModalHandle | null = null;
  const list = h(
    'div',
    { class: 'debug-foes' },
    ...ENEMY_LIST.map((e) =>
      h('button', {
        class: 'debug-foe',
        'data-enemy': e.id,
        onclick: () => {
          sfx('button');
          haptic('tap');
          handle?.close();
          onPick(hero, e.id, extra);
        },
        html: `${creature(e.art)}<span>${t(`enemy.${e.id}.name`)}</span><small>${t('journey.title', { n: e.act })}${e.tier !== 'normal' ? ` · ${t(`journey.node.${e.tier}`)}` : ''}</small>`,
      }),
    ),
  );
  foesPane.append(list);
  renderCards();
  handle = openModal({
    title: t('debug.title'),
    cls: 'debug-modal',
    body: h('div', { class: 'debug-fight' }, heroSeg, tabs, foesPane, cardsPane),
    actions: [
      {
        label: t('debug.unlockAll'),
        icon: 'lock',
        onClick: () => {
          unlockAll(
            Object.keys(CARDS),
            ENEMY_LIST.map((e) => e.id),
            RELIC_LIST.map((r) => r.id),
          );
          sfx('ability');
          haptic('ability');
          const toast = h('div', { class: 'hint-toast debug-toast' }, t('debug.unlocked'));
          document.body.append(toast);
          toast.addEventListener('animationend', () => toast.remove());
          return false;
        },
      },
      {
        label: t('menu.reset'),
        icon: 'trash',
        cls: 'danger',
        onClick: () => {
          openResetConfirm();
          return false;
        },
      },
      { label: t('common.close'), cls: 'secondary' },
    ],
  });
  return handle;
}
