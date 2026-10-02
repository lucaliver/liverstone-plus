import { availableLocales, getLocale, setLocale, type TKey, t } from '../../core/i18n';
import { setSfxVolume, sfx } from '../../audio/sfx';
import { setMusicVolume } from '../../audio/music';
import { CARDS, type CardCategory, cardCategory, cardCostOf } from '../../data/cards';
import { saveSettings, settings } from '../../game/settings';
import type { CardInst, Rarity } from '../../game/types';
import { clearAll } from '../../core/save';
import { confirmModal, type ModalAction, openModal, type ModalHandle } from '../app';
import { cssMs, h, onPress, onTapOrHold, stagger } from '../dom';
import { icon } from '../art/icons';
import { cardKeywords, cardText, cardView, keywordHtml } from './cardView';

/** `note` appears under the row once it is touched. */
function toggleRow(label: string, get: () => boolean, set: (v: boolean) => void, note?: string): HTMLElement {
  const sw = h('button', { class: 'switch', role: 'switch', 'aria-checked': String(get()), 'aria-label': label });
  const noteEl = note ? h('p', { class: 'setting-note', hidden: true }, note) : null;
  sw.addEventListener('click', () => {
    set(!get());
    sw.setAttribute('aria-checked', String(get()));
    if (noteEl) noteEl.hidden = false;
    saveSettings();
    sfx('tap');
  });
  return h('div', { class: `setting ${note ? 'wrap' : ''}` }, h('span', null, label), sw, noteEl);
}

/** Volume slider in ten steps (0 = off). */
function volumeRow(label: string, get: () => number, set: (v: number) => void): HTMLElement {
  const input = h('input', { class: 'slider', type: 'range', min: 0, max: 10, step: 1, value: Math.round(get() * 10), 'aria-label': label });
  const num = h('b', { class: 'slider-val' }, Math.round(get() * 10));
  input.addEventListener('input', () => {
    set(Number(input.value) / 10);
    num.textContent = input.value;
  });
  input.addEventListener('change', () => {
    saveSettings();
    sfx('tap');
  });
  return h('div', { class: 'setting' }, h('span', null, label), h('div', { class: 'slider-wrap' }, input, num));
}

/** Asks before erasing every save (the run, unlocks, discoveries, settings), then reloads on a clean slate. */
export function openResetConfirm(): void {
  confirmModal(
    t('menu.resetConfirm'),
    t('common.confirm'),
    () => {
      clearAll();
      location.reload();
    },
    t('common.cancel'),
  );
}

/** Settings; `extra` actions go above Close (e.g. Main menu from the map). The version line (and the hidden reset under it) is only for the home screen's. */
export function openSettings(extra: ModalAction[] = [], home = false): ModalHandle {
  const locales = availableLocales();
  // A hidden way to wipe everything: hold the version line.
  const version = home
    ? h(
        'div',
        { class: 'version' },
        t('settings.version', {
          v: __APP_VERSION__,
          d: new Date(__BUILD_TIME__).toLocaleString(getLocale(), { dateStyle: 'medium', timeStyle: 'short' }),
        }),
      )
    : null;
  if (version) onTapOrHold(version, () => {}, openResetConfirm, cssMs('--dur-hold'));
  const body = h(
    'div',
    null,
    locales.length > 1
      ? h(
          'div',
          { class: 'setting' },
          h('span', null, t('settings.language')),
          h(
            'div',
            { class: 'seg' },
            ...locales.map((l) =>
              h(
                'button',
                {
                  'aria-pressed': String(getLocale() === l.code),
                  onclick: () => {
                    setLocale(l.code);
                    settings.locale = l.code;
                    saveSettings();
                    location.reload();
                  },
                },
                l.code.toUpperCase(),
              ),
            ),
          ),
        )
      : null,
    volumeRow(
      t('settings.music'),
      () => settings.musicVolume,
      (v) => {
        settings.musicVolume = v;
        setMusicVolume(v);
      },
    ),
    volumeRow(
      t('settings.sound'),
      () => settings.sfxVolume,
      (v) => {
        settings.sfxVolume = v;
        setSfxVolume(v);
      },
    ),
    toggleRow(
      t('settings.motion'),
      () => settings.reduceMotion,
      (v) => {
        settings.reduceMotion = v;
        document.documentElement.classList.toggle('reduce-motion', v);
      },
    ),
    'vibrate' in navigator
      ? toggleRow(
          t('settings.haptics'),
          () => settings.haptics,
          (v) => (settings.haptics = v),
        )
      : null,
    toggleRow(
      t('settings.rightToLeft'),
      () => settings.rightToLeft,
      (v) => (settings.rightToLeft = v),
      t('settings.nextFight'),
    ),
    toggleRow(
      t('settings.debugMenus'),
      () => settings.debugMenus,
      (v) => {
        settings.debugMenus = v;
        // The screens behind this window are already built: show or hide their debug buttons now.
        for (const b of document.querySelectorAll<HTMLElement>('.debug-fab')) b.hidden = !v;
      },
    ),
    version,
  );
  return openModal({
    title: t('settings.title'),
    body,
    actions: [...extra, { label: t('common.close'), cls: 'secondary' }],
  });
}

export function openHowTo(): ModalHandle {
  const items: [string, string][] = [
    ['cards', 'belt'],
    ['crystal', 'mana'],
    ['burst', 'intent'],
    ['shield', 'block'],
    ['hand', 'sleeve'],
    ['star', 'ability'],
    ['magnifier', 'inspect'],
  ];
  const body = h(
    'div',
    { class: 'howto' },
    ...items.map(([ic, k]) =>
      h(
        'div',
        { class: 'howto-item' },
        h('div', { class: 'tile', html: icon(ic) }),
        h('div', null, h('h4', null, t(`howto.${k}.t`)), h('p', null, t(`howto.${k}.d`))),
      ),
    ),
  );
  return openModal({
    title: t('howto.title'),
    body,
    actions: [{ label: t('common.close'), cls: 'secondary' }],
  });
}

export interface InfoOpts {
  icon?: string;
  /** HTML of a sprite, instead of an icon. */
  art?: string;
  title: string;
  /** Small label next to the title (e.g. Passive / Active / On you). */
  tag?: string;
  tagCls?: string;
  /** HTML body. */
  desc: string;
  /** Extra lines (HTML) under the description. */
  extra?: string[];
  ink?: 'good' | 'bad' | 'neutral';
}

/** Small explainer for anything that isn't a card: statuses, abilities, passives, enemy moves. */
export function openInfo(opts: InfoOpts, onClose?: () => void): ModalHandle {
  const body = h(
    'div',
    { class: `info ${opts.ink ?? 'neutral'}` },
    h('div', {
      class: 'info-head',
      html: `<span class="info-ico">${opts.art ?? icon(opts.icon ?? 'question')}</span><div><h3>${opts.title}</h3>${opts.tag ? `<span class="ftag ${opts.tagCls ?? ''}">${opts.tag}</span>` : ''}</div>`,
    }),
    h('p', { class: 'info-desc', html: opts.desc }),
    ...(opts.extra ?? []).map((x) => h('div', { class: 'info-extra', html: x })),
  );
  return openModal({ body, actions: [{ label: t('common.close'), cls: 'secondary' }], onClose });
}

/** What a hero or run stat means (hero select, map header): HP, mana, sleeve slots (`n`), pay. */
export function openStatInfo(stat: 'hp' | 'mana' | 'sleeve' | 'pay', n = 0): ModalHandle {
  sfx('tap');
  const info: Record<typeof stat, InfoOpts> = {
    hp: { icon: 'heart', title: t('info.hp.t'), desc: t('info.hp.d') },
    mana: { icon: 'crystal', title: t('common.mana'), desc: t('howto.mana.d') },
    sleeve: { icon: 'hand', title: t('howto.sleeve.t'), desc: t('howto.sleeve.d'), extra: [t('hero.sleeve', { n })] },
    pay: { icon: 'coin', title: t('common.pay'), desc: t('info.pay.d') },
  };
  return openInfo(info[stat]);
}

export function openCardDetail(card: CardInst, onClose?: () => void): ModalHandle {
  const wrap = h('div', { class: 'detail' });
  let showUp = card.up;
  const def = CARDS[card.id];
  const canToggle = !card.up && (!!def.upVals || def.upCost !== undefined || !!def.upKeywords);
  const render = (): void => {
    const shown = { ...card, up: showUp };
    const gloss = cardKeywords(shown).map((k) => h('div', { html: `<b class="kw">${t(`kw.${k}`)}</b> — ${keywordHtml(t(`kw.${k}.d`))}` }));
    wrap.replaceChildren(
      cardView(shown),
      h('div', {
        class: 'detail-meta',
        html: `<span class="rar ${def.rarity}">${t(`rarity.${def.rarity}`)}</span><span>${t(`type.${def.type}`)}</span>`,
      }),
      h('div', { class: 'rules', html: cardText(shown) }),
    );
    if (gloss.length) wrap.append(h('div', { class: 'glossary' }, ...gloss));
    if (canToggle)
      wrap.append(
        h(
          'button',
          {
            class: 'btn small secondary',
            onclick: () => {
              showUp = !showUp;
              render();
            },
          },
          showUp ? t('detail.hideUpgrade') : t('detail.showUpgrade'),
        ),
      );
  };
  render();
  return openModal({ body: wrap, actions: [{ label: t('common.close'), cls: 'secondary' }], onClose });
}

/** Sorting by type goes by the art's colour family, the only type the player sees. */
const TYPE_ORDER: CardCategory[] = ['attack', 'defense', 'utility', 'curse'];
const RARITY_ORDER: Rarity[] = ['starter', 'common', 'rare', 'epic', 'legendary', 'special'];
const SORT_KEYS = {
  cost: (c: CardInst): number => cardCostOf(c),
  type: (c: CardInst): number => TYPE_ORDER.indexOf(cardCategory(c.id)),
  rarity: (c: CardInst): number => RARITY_ORDER.indexOf(CARDS[c.id].rarity),
};
const DECK_SORTS = ['cost', 'type', 'rarity'] as const;
type DeckSort = (typeof DECK_SORTS)[number];
/** The deck windows' and handbook's sort, kept while the game is open. */
let deckSort: DeckSort = 'type';
/** Descending on the sort's main key (tapping the active sort again flips it). */
let deckDesc = false;

/** Sorted by `by` (flipped when `desc`); ties fall back on the other keys (type, cost, rarity), then the name. */
function sortDeck(deck: CardInst[], by: DeckSort, desc: boolean): CardInst[] {
  const name = (c: CardInst): string => t(`card.${c.id}.name`);
  const sign = desc ? -1 : 1;
  const ties = (['type', 'cost', 'rarity'] as const).filter((k) => k !== by);
  return [...deck].sort((a, b) => {
    const first = sign * (SORT_KEYS[by](a) - SORT_KEYS[by](b));
    return first || ties.map((k) => SORT_KEYS[k](a) - SORT_KEYS[k](b)).find(Boolean) || name(a).localeCompare(name(b)) || Number(b.up) - Number(a.up);
  });
}

/**
 * A slim line of text links: "Sort by  Cost · Type · Rarity", the active one marked with the sort arrow; tapping it
 * again flips the order. `onChange` re-renders the list, sorted with `sortCards`.
 */
export function sortControl(onChange: () => void): HTMLElement {
  const el = h('div', { class: 'deck-sort', role: 'group', 'aria-label': t('deck.sortBy') });
  const render = (): void =>
    el.replaceChildren(
      h('span', null, t('deck.sortBy')),
      ...DECK_SORTS.map((by) =>
        h('button', {
          'aria-pressed': String(by === deckSort),
          html: `${by === deckSort ? icon(deckDesc ? 'up' : 'down') : ''}${t(`deck.sort.${by}`)}`,
          onclick: () => {
            sfx('tap');
            deckDesc = by === deckSort && !deckDesc;
            deckSort = by;
            render();
            onChange();
          },
        }),
      ),
    );
  render();
  return el;
}

/** Cards in the order the sort control shows. */
export const sortCards = (cards: CardInst[]): CardInst[] => sortDeck(cards, deckSort, deckDesc);

/** Identical copies (same card, upgrade and perks) shown once, with how many there are. */
export function groupCopies(cards: CardInst[]): { card: CardInst; n: number }[] {
  const groups = new Map<string, { card: CardInst; n: number }>();
  for (const c of cards) {
    const key = `${c.id}|${c.up}|${[...(c.perks ?? [])].sort().join()}`;
    const g = groups.get(key);
    if (g) g.n++;
    else groups.set(key, { card: c, n: 1 });
  }
  return [...groups.values()];
}

/**
 * Deck grid, sortable by type, cost or name, identical copies grouped (×N). Without `onPick`, tapping (or holding) a
 * card opens its detail. With `onPick`: tap selects a card (shown as `previewSelected` if given, e.g. its upgraded
 * version), hold shows its detail, and the single confirm button calls `onPick`. Tapping outside cancels.
 */
export function openDeck(
  deck: CardInst[],
  opts: {
    title?: string;
    onPick?: (c: CardInst) => void;
    confirmLabel?: string;
    filter?: (c: CardInst) => boolean;
    previewSelected?: (c: CardInst) => CardInst;
    onClose?: () => void;
  } = {},
): ModalHandle {
  const cards = deck.filter(opts.filter ?? (() => true));
  let selected: CardInst | null = null;
  let confirm: HTMLButtonElement | null = null;

  const makeEl = (c: CardInst, n: number): HTMLElement => {
    const isSelected = selected?.uid === c.uid;
    const el = cardView(isSelected && opts.previewSelected ? opts.previewSelected(c) : c);
    el.classList.toggle('sel', isSelected);
    if (n > 1) el.append(h('span', { class: 'copies' }, t('deck.copies', { n })));
    if (!opts.onPick) {
      onPress(el, () => {
        sfx('tap');
        openCardDetail(c);
      });
      return el;
    }
    onTapOrHold(
      el,
      () => {
        sfx('tap');
        selected = selected?.uid === c.uid ? null : c;
        render();
        if (confirm) confirm.disabled = !selected;
      },
      () => openCardDetail(isSelected && opts.previewSelected ? opts.previewSelected(c) : c),
    );
    return el;
  };
  const grid = h('div', { class: `deck-grid ${opts.onPick ? 'pick' : ''}` });
  const sorter = sortControl(() => render(true));
  /** `print`: the cards are dealt in (opening, sorting), not on a selection change. */
  function render(print = false): void {
    grid.replaceChildren(...stagger(groupCopies(sortCards(cards)).map((g) => makeEl(g.card, g.n))));
    grid.classList.toggle('has-sel', !!selected);
    grid.classList.toggle('print', print);
  }
  render(true);

  const handle = openModal({
    title: opts.onPick ? (opts.title ?? t('deck.title')) : `${opts.title ?? t('deck.title')} (${cards.length})`,
    body: cards.length ? h('div', null, sorter, grid) : h('p', null, t('deck.empty')),
    actions: opts.onPick
      ? [
          {
            label: opts.confirmLabel ?? t('common.confirm'),
            onClick: () => {
              if (!selected) return false;
              opts.onPick?.(selected);
            },
          },
        ]
      : [{ label: t('common.close'), cls: 'secondary' }],
    onClose: opts.onClose,
  });
  if (opts.onPick) {
    confirm = handle.el.querySelector<HTMLButtonElement>('.actions .btn');
    if (confirm) confirm.disabled = true;
  }
  return handle;
}

/** What each part of a card means: a sample card with numbered spots, and the legend (handbook "?" button). */
export function openCardAnatomy(): ModalHandle {
  // A placeholder card: the layout of a real one (rare, two effects, a modifier), with dummy name, art and numbers
  // (letters, so nobody takes it for a real card).
  const sample = cardView({ uid: -1, id: 'secondBreakfast', up: false });
  sample.querySelector('.c-name')!.textContent = t('anatomy.sample');
  sample.querySelector('.c-art')!.innerHTML = icon('question');
  sample.querySelector('.c-cost')!.textContent = 'X';
  sample.querySelectorAll('.c-face b').forEach((b, i) => {
    b.textContent = 'YZ'[i] ?? '';
  });
  // Numbered spots just outside the card, level with the part they name (in % of the card box).
  const spots: [number, number][] = [
    [-12, 9],
    [112, 9],
    [-12, 32],
    [112, 68],
    [-12, 93],
    [112, 93],
  ];
  const card = h(
    'div',
    { class: 'anatomy-card' },
    sample,
    ...spots.map(([x, y], i) => h('b', { class: 'spot', style: { left: `${x}%`, top: `${y}%` } }, i + 1)),
  );
  const inks = (list: [string, TKey][]): string =>
    list.map(([ink, k]) => `<span class="ink-chip"><i style="background:${ink}"></i>${t(k)}</span>`).join('');
  const rows: [string, string][] = [
    [t('anatomy.cost'), t('anatomy.cost.d')],
    [
      t('anatomy.band'),
      `${t('anatomy.band.d')}<br>${inks([
        ['var(--band-warrior)', 'compendium.tab.warrior'],
        ['var(--band-mage)', 'compendium.tab.mage'],
        ['var(--band-necro)', 'compendium.tab.necromancer'],
        ['var(--band-neutral)', 'compendium.tab.neutral'],
        ['var(--band-curse)', 'compendium.tab.curse'],
      ])}`,
    ],
    [
      t('anatomy.art'),
      `${t('anatomy.art.d')}<br>${inks([
        ['var(--cat-attack)', 'anatomy.art.attack'],
        ['var(--cat-defense)', 'anatomy.art.defense'],
        ['var(--cat-utility)', 'anatomy.art.utility'],
        ['var(--cat-curse)', 'anatomy.art.curse'],
      ])}`,
    ],
    [t('anatomy.face'), t('anatomy.face.d')],
    [t('anatomy.tags'), t('anatomy.tags.d')],
    [
      t('anatomy.gem'),
      `${t('anatomy.gem.d')}<br>${inks([
        ['var(--b)', 'rarity.rare'],
        ['var(--p)', 'rarity.epic'],
        ['var(--y)', 'rarity.legendary'],
        ['var(--k)', 'rarity.special'],
      ])}`,
    ],
  ];
  const legend = h('ol', { class: 'anatomy-legend' }, ...rows.map(([title, desc]) => h('li', { html: `<b>${title}</b> ${desc}` })));
  return openModal({
    title: t('anatomy.title'),
    body: h('div', { class: 'anatomy' }, card, legend),
    actions: [{ label: t('common.close'), cls: 'secondary' }],
  });
}
