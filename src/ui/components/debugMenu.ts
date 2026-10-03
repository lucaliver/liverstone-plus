import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { CARD_LIST, CARDS } from '../../data/cards';
import { CONFIG } from '../../data/config';
import { DEBUG_ENEMY, ENEMY_LIST } from '../../data/enemies';
import { HERO_LIST } from '../../data/heroes';
import { RELIC_LIST } from '../../data/relics';
import { unlockAll } from '../../game/meta';
import { settings } from '../../game/settings';
import type { HeroId } from '../../game/types';
import { openModal, type ModalHandle } from '../app';
import { keywordText } from './cardView';
import type { CardDef } from '../../game/types';
import { openCardDetail, openResetConfirm } from './modals';
import { h, onTapOrHold } from '../dom';
import { foeView } from './moveText';
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

/** The names of a card's keywords (base and upgraded), so the search finds them even when the text only shows their icon. */
function cardKeywords(c: CardDef): string {
  return [...new Set([...(c.keywords ?? []), ...(c.upKeywords ?? [])])].map((k) => t(`kw.${k}`)).join(' ');
}

/** Temporary debug tool: fight any enemy with any hero (a fresh run on floor 1), with extra cards added to the deck to try them. */
export function openDebugFight(onPick: (hero: HeroId, enemy: string, cards: string[], bigHp: boolean) => void): ModalHandle {
  let hero: HeroId = HERO_LIST[0].id;
  const extra: string[] = [];
  let bigHp = false;
  // The heroes across the whole width, each with its portrait.
  const heroSeg = h('div', { class: 'seg debug-heroes', role: 'group', 'aria-label': t('debug.hero') });
  const hpBtn = h(
    'button',
    {
      class: 'btn small secondary',
      'aria-pressed': 'false',
      onclick: () => {
        bigHp = !bigHp;
        hpBtn.setAttribute('aria-pressed', String(bigHp));
        sfx('tap');
      },
    },
    t('debug.bigHp', { n: CONFIG.debugHp }),
  );
  // One copy of every card the hero can play (its class and the neutral ones, no curses).
  const allBtn = h(
    'button',
    {
      class: 'btn small secondary',
      onclick: () => {
        extra.push(...CARD_LIST.filter((c) => c.type !== 'curse' && (c.cls === hero || c.cls === 'neutral')).map((c) => c.id));
        sfx('tap');
        renderCards();
      },
    },
    t('debug.allCards'),
  );
  const options = h('div', { class: 'debug-options' }, hpBtn, allBtn);
  const renderHeroes = (): void => {
    heroSeg.replaceChildren(
      ...HERO_LIST.map((hd) =>
        h('button', {
          'aria-pressed': String(hd.id === hero),
          onclick: () => {
            hero = hd.id;
            sfx('tap');
            renderHeroes();
            renderCards();
          },
          html: `${creature(hd.id)}<span>${t(`compendium.tab.${hd.id}`)}</span>`,
        }),
      ),
    );
  };
  // Every card, filtered as you type by name, rules text or keyword; a tap adds a copy (the count says how many), a hold shows the card.
  const search = h('input', { class: 'debug-search', type: 'search', placeholder: t('debug.cards'), 'aria-label': t('debug.cards') });
  const cardList = h('div', { class: 'debug-cards' });
  const tabs = h('div', { class: 'debug-tabs', role: 'tablist' });
  const cardsPane = h('div', { class: 'debug-pane' }, search, cardList);
  const foeSearch = h('input', { class: 'debug-search', type: 'search', placeholder: t('debug.foes'), 'aria-label': t('debug.foes') });
  const foesPane = h('div', { class: 'debug-pane' }, foeSearch);
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
        .filter((c) => `${t(`card.${c.id}.name`)} ${keywordText(t(`card.${c.id}.desc`))} ${cardKeywords(c)}`.toLowerCase().includes(q))
        .map((c) => {
          const n = extra.filter((id) => id === c.id).length;
          const btn = h('button', {
            class: 'debug-card',
            html: `<span>${t(`card.${c.id}.name`)}</span>${n ? `<b>×${n}</b>` : ''}`,
          });
          onTapOrHold(
            btn,
            () => {
              extra.push(c.id);
              sfx('tap');
              renderCards();
            },
            () => openCardDetail({ uid: -1, id: c.id, up: false }),
          );
          return btn;
        }),
    );
  };
  search.addEventListener('input', renderCards);
  renderHeroes();
  let handle: ModalHandle | null = null;
  const list = h('div', { class: 'debug-foes' });
  // A tap starts the fight, a hold shows the enemy's sheet.
  const foeButtons = [...ENEMY_LIST, DEBUG_ENEMY].map((e) => {
    const btn = h('button', {
      class: 'debug-foe',
      'data-enemy': e.id,
      html: `${creature(e.art)}<span>${t(`enemy.${e.id}.name`)}</span><small>${t('journey.title', { n: e.act })}${e.tier !== 'normal' ? ` · ${t(`journey.node.${e.tier}`)}` : ''}</small>`,
    });
    onTapOrHold(
      btn,
      () => {
        sfx('button');
        haptic('tap');
        handle?.close();
        onPick(hero, e.id, extra, bigHp);
      },
      () => openModal({ title: t(`enemy.${e.id}.name`), body: foeView(e, true), actions: [{ label: t('common.close'), cls: 'secondary' }] }),
    );
    return { id: e.id, btn };
  });
  const renderFoes = (): void => {
    const q = foeSearch.value.trim().toLowerCase();
    list.replaceChildren(...foeButtons.filter((f) => t(`enemy.${f.id}.name`).toLowerCase().includes(q)).map((f) => f.btn));
  };
  foeSearch.addEventListener('input', renderFoes);
  renderFoes();
  foesPane.append(list);
  renderCards();
  handle = openModal({
    title: t('debug.title'),
    cls: 'debug-modal',
    body: h('div', { class: 'debug-fight' }, heroSeg, options, tabs, foesPane, cardsPane),
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
