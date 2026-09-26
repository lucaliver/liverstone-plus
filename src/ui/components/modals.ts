import { availableLocales, getLocale, setLocale, t } from '../../core/i18n';
import { setSfxEnabled, sfx } from '../../audio/sfx';
import { setMusicEnabled } from '../../audio/music';
import { CARDS } from '../../data/cards';
import { GAME_SPEEDS } from '../../data/config';
import { saveSettings, settings } from '../../game/settings';
import type { CardInst, CardType } from '../../game/types';
import { openModal, type ModalHandle } from '../app';
import { h, onPress } from '../dom';
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
    toggleRow(t('settings.music'), () => settings.music, (v) => {
      settings.music = v;
      setMusicEnabled(v);
    }),
    toggleRow(t('settings.sound'), () => settings.sound, (v) => {
      settings.sound = v;
      setSfxEnabled(v);
    }),
    h('div', { class: 'setting' }, h('span', null, t('settings.speed')), speedSelector(onChange)),
    toggleRow(t('settings.motion'), () => settings.reduceMotion, (v) => {
      settings.reduceMotion = v;
      document.documentElement.classList.toggle('reduce-motion', v);
    }),
    'vibrate' in navigator ? toggleRow(t('settings.haptics'), () => settings.haptics, (v) => (settings.haptics = v)) : null,
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
      h('div', { class: 'howto-item' }, h('div', { class: 'tile', html: icon(ic) }), h('div', null, h('h4', null, t(`howto.${k}.t`)), h('p', null, t(`howto.${k}.d`)))),
    ),
  );
  return openModal({
    title: t('howto.title'),
    body,
    actions: [{ label: firstTime ? t('howto.gotIt') : t('common.close'), cls: firstTime ? '' : 'secondary' }],
    onClose,
  });
}

export function openCardDetail(card: CardInst, onClose?: () => void): ModalHandle {
  const wrap = h('div', { class: 'detail' });
  let showUp = card.up;
  const def = CARDS[card.id];
  const canToggle = !card.up && (!!def.upVals || def.upCost !== undefined || !!def.upKeywords);
  const render = (): void => {
    const shown = { ...card, up: showUp };
    const gloss = cardKeywords(shown).map((k) => h('div', { html: `<b class="kw">${t(`kw.${k}`)}</b> — ${t(`kw.${k}.d`)}` }));
    wrap.replaceChildren(cardView(shown), h('div', { class: 'rules', html: cardText(shown) }));
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
export function openDeck(deck: CardInst[], opts: { title?: string; onPick?: (c: CardInst) => void; filter?: (c: CardInst) => boolean; preview?: (c: CardInst) => CardInst } = {}): ModalHandle {
  const cards = sortDeck(deck).filter(opts.filter ?? (() => true));
  let handle: ModalHandle;
  const grid = h(
    'div',
    { class: `deck-grid ${opts.onPick ? 'pick' : ''}` },
    ...cards.map((c) => {
      const el = cardView(opts.preview ? opts.preview(c) : c);
      if (opts.onPick) {
        // Picking: tap selects, long press shows the card instead.
        el.addEventListener('click', () => {
          sfx('tap');
          handle.close();
          opts.onPick!(c);
        });
        let t0 = 0;
        el.addEventListener('pointerdown', () => {
          t0 = window.setTimeout(() => openCardDetail(opts.preview ? opts.preview(c) : c), 420);
        });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, () => clearTimeout(t0)));
        el.addEventListener('contextmenu', (e) => e.preventDefault());
      } else {
        onPress(el, () => {
          sfx('tap');
          openCardDetail(c);
        });
      }
      return el;
    }),
  );
  handle = openModal({
    title: `${opts.title ?? t('deck.title')} (${cards.length})`,
    body: cards.length ? grid : h('p', null, t('deck.empty')),
    actions: [{ label: opts.onPick ? t('common.cancel') : t('common.close'), cls: 'secondary' }],
  });
  return handle;
}
