import { availableLocales, getLocale, setLocale, type TKey, t } from '../../core/i18n';
import { setSfxVolume, sfx } from '../../audio/sfx';
import { setMusicVolume } from '../../audio/music';
import { CARDS } from '../../data/cards';
import { GAME_SPEEDS } from '../../data/config';
import { ENEMY_LIST } from '../../data/enemies';
import { HERO_LIST } from '../../data/heroes';
import { saveSettings, settings } from '../../game/settings';
import type { CardInst, CardType, HeroId } from '../../game/types';
import { openModal, type ModalHandle } from '../app';
import { h, onPress, onTapOrHold } from '../dom';
import { creature } from '../art/creatures';
import { icon } from '../art/icons';
import { cardKeywords, cardText, cardView } from './cardView';

function toggleRow(label: string, get: () => boolean, set: (v: boolean) => void): HTMLElement {
  const sw = h('button', { class: 'switch', role: 'switch', 'aria-checked': String(get()), 'aria-label': label });
  sw.addEventListener('click', () => {
    set(!get());
    sw.setAttribute('aria-checked', String(get()));
    saveSettings();
    sfx('tap');
  });
  return h('div', { class: 'setting' }, h('span', null, label), sw);
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

export function speedSelector(onChange?: (s: number) => void): HTMLElement {
  const seg = h('div', { class: 'seg', role: 'group' });
  const render = (): void => {
    seg.replaceChildren(
      ...GAME_SPEEDS.map((s) =>
        h(
          'button',
          {
            'aria-pressed': String(settings.speed === s),
            onclick: () => {
              settings.speed = s;
              saveSettings();
              sfx('tap');
              render();
              onChange?.(s);
            },
          },
          `${s}×`,
        ),
      ),
    );
  };
  render();
  return seg;
}

export function openSettings(onChange?: () => void): ModalHandle {
  const locales = availableLocales();
  const body = h(
    'div',
    null,
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
    h('div', { class: 'setting' }, h('span', null, t('settings.speed')), speedSelector(onChange)),
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
      t('settings.reverseBelt'),
      () => settings.reverseBelt,
      (v) => (settings.reverseBelt = v),
    ),
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
  );
  return openModal({ title: t('settings.title'), body, actions: [{ label: t('common.close'), cls: 'secondary' }], onClose: onChange });
}

export function openHowTo(onClose?: () => void, firstTime = false): ModalHandle {
  const items: [string, string][] = [
    ['cards', 'belt'],
    ['crystal', 'mana'],
    ['burst', 'intent'],
    ['shield', 'block'],
    ['hand', 'sleeve'],
    ['star', 'ability'],
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
    actions: [{ label: firstTime ? t('howto.gotIt') : t('common.close'), cls: firstTime ? '' : 'secondary' }],
    onClose,
  });
}

export interface InfoOpts {
  icon: string;
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
      html: `<span class="info-ico">${icon(opts.icon)}</span><div><h3>${opts.title}</h3>${opts.tag ? `<span class="ftag ${opts.tagCls ?? ''}">${opts.tag}</span>` : ''}</div>`,
    }),
    h('p', { class: 'info-desc', html: opts.desc }),
    ...(opts.extra ?? []).map((x) => h('div', { class: 'info-extra', html: x })),
  );
  return openModal({ body, actions: [{ label: t('common.close'), cls: 'secondary' }], onClose });
}

export function openCardDetail(card: CardInst, onClose?: () => void): ModalHandle {
  const wrap = h('div', { class: 'detail' });
  let showUp = card.up;
  const def = CARDS[card.id];
  const canToggle = !card.up && (!!def.upVals || def.upCost !== undefined || !!def.upKeywords);
  const render = (): void => {
    const shown = { ...card, up: showUp };
    const gloss = cardKeywords(shown).map((k) => h('div', { html: `<b class="kw">${t(`kw.${k}`)}</b> — ${t(`kw.${k}.d`)}` }));
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

const TYPE_ORDER: CardType[] = ['attack', 'spell', 'skill', 'power', 'potion', 'curse'];

export function sortDeck(deck: CardInst[]): CardInst[] {
  return [...deck].sort((a, b) => {
    const da = CARDS[a.id];
    const db = CARDS[b.id];
    return TYPE_ORDER.indexOf(da.type) - TYPE_ORDER.indexOf(db.type) || da.cost - db.cost || a.id.localeCompare(b.id) || Number(b.up) - Number(a.up);
  });
}

/** Deck grid. With `onPick`, tapping a card selects it; otherwise tapping opens its detail. */
/**
 * Deck grid. Without `onPick`, tapping (or holding) a card opens its detail.
 * With `onPick`: tap selects a card (shown as `previewSelected` if given, e.g. its upgraded version),
 * hold shows its detail, and the single confirm button calls `onPick`. Tapping outside cancels.
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
  const cards = sortDeck(deck).filter(opts.filter ?? (() => true));
  let selected: CardInst | null = null;
  let confirm: HTMLButtonElement | null = null;

  const makeEl = (c: CardInst, isSelected: boolean): HTMLElement => {
    const el = cardView(isSelected && opts.previewSelected ? opts.previewSelected(c) : c);
    el.classList.toggle('sel', isSelected);
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
        select(selected?.uid === c.uid ? null : c);
      },
      () => openCardDetail(isSelected && opts.previewSelected ? opts.previewSelected(c) : c),
    );
    return el;
  };
  const els = cards.map((c) => makeEl(c, false));
  const grid = h('div', { class: `deck-grid ${opts.onPick ? 'pick' : ''}` }, ...els);

  // Re-render the old and new selection (they may change look, e.g. base ↔ upgraded).
  function select(c: CardInst | null): void {
    const prev = selected;
    selected = c;
    for (const [i, card] of cards.entries()) {
      if (card.uid !== prev?.uid && card.uid !== c?.uid) continue;
      const fresh = makeEl(card, card.uid === c?.uid);
      els[i].replaceWith(fresh);
      els[i] = fresh;
    }
    grid.classList.toggle('has-sel', !!selected);
    if (confirm) confirm.disabled = !selected;
  }

  const handle = openModal({
    title: opts.onPick ? (opts.title ?? t('deck.title')) : `${opts.title ?? t('deck.title')} (${cards.length})`,
    body: cards.length ? grid : h('p', null, t('deck.empty')),
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
  // A placeholder card: the layout of a real one (rare, two effects, a modifier), with dummy name and art.
  const sample = cardView({ uid: -1, id: 'secondWind', up: false });
  sample.querySelector('.c-name')!.textContent = t('anatomy.sample');
  sample.querySelector('.c-art')!.innerHTML = icon('question');
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
        ['var(--p)', 'compendium.tab.warrior'],
        ['var(--b)', 'compendium.tab.mage'],
        ['var(--green)', 'compendium.tab.necromancer'],
        ['var(--y)', 'compendium.tab.neutral'],
        ['var(--k)', 'compendium.tab.curse'],
      ])}`,
    ],
    [
      t('anatomy.art'),
      `${t('anatomy.art.d')}<br>${inks([
        ['#ffc2de', 'anatomy.art.attack'],
        ['#c6d9f8', 'anatomy.art.defense'],
        ['#fff0a0', 'anatomy.art.utility'],
        ['#bfe38a', 'anatomy.art.curse'],
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

/** Temporary debug tool: fight any enemy with any hero (a fresh run on floor 1). */
export function openDebugFight(onPick: (hero: HeroId, enemy: string) => void): ModalHandle {
  let hero: HeroId = HERO_LIST[0].id;
  const heroSeg = h('div', { class: 'seg' });
  const renderHeroes = (): void => {
    heroSeg.replaceChildren(
      ...HERO_LIST.map((hd) =>
        h(
          'button',
          {
            'aria-pressed': String(hd.id === hero),
            onclick: () => {
              hero = hd.id;
              sfx('tap');
              renderHeroes();
            },
          },
          t(`compendium.tab.${hd.id}`),
        ),
      ),
    );
  };
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
          handle?.close();
          onPick(hero, e.id);
        },
        html: `${creature(e.art)}<span>${t(`enemy.${e.id}.name`)}</span><small>${t('journey.title', { n: e.act })}${e.tier !== 'normal' ? ` · ${t(`journey.node.${e.tier}`)}` : ''}</small>`,
      }),
    ),
  );
  handle = openModal({
    title: t('debug.title'),
    body: h('div', { class: 'debug-fight' }, h('div', { class: 'setting' }, h('span', null, t('debug.hero')), heroSeg), list),
    actions: [{ label: t('common.close'), cls: 'secondary' }],
  });
  return handle;
}
