import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { type RunState, swapCard } from '../../game/run';
import type { CardDef, CardInst } from '../../game/types';
import type { Screen } from '../app';
import { cardView } from '../components/cardView';
import { openCardDetail, sortDeck } from '../components/modals';
import { h } from '../dom';
import { runHud } from './journey';

const LONG_PRESS_MS = 420;

/** Tap selects; a long press opens the card detail instead (and doesn't select). */
function selectable(el: HTMLElement, card: CardInst, onSelect: () => void): void {
  let timer = 0;
  let long = false;
  el.addEventListener('pointerdown', () => {
    long = false;
    timer = window.setTimeout(() => {
      long = true;
      openCardDetail(card);
    }, LONG_PRESS_MS);
  });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) el.addEventListener(ev, () => clearTimeout(timer));
  el.addEventListener('click', () => {
    if (long) return;
    sfx('tap');
    onSelect();
  });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

/**
 * Post-fight reward, Cardstone style: the deck never grows. Pick a card of your deck (top) and one of the
 * offered cards (bottom), then Swap them, or Skip.
 */
export function rewardScreen(run: RunState, picks: CardDef[], onDone: () => void): Screen {
  let fromDeck: CardInst | null = null;
  let offer: CardDef | null = null;

  const swapBtn = h('button', { class: 'btn', disabled: true }, t('reward.swap'));
  const deckGrid = h('div', { class: 'swap-deck' });
  const offerRow = h('div', { class: 'swap-offer' });
  const hint = h('p', { class: 'sub swap-hint' });

  const deckEls = sortDeck(run.deck).map((card) => {
    const el = cardView(card);
    selectable(el, card, () => {
      fromDeck = fromDeck?.uid === card.uid ? null : card;
      refresh();
    });
    return { el, card };
  });
  deckGrid.append(...deckEls.map((d) => d.el));

  const offerEls = picks.map((def, i) => {
    const card: CardInst = { uid: -100 - i, id: def.id, up: false };
    const el = cardView(card);
    selectable(el, card, () => {
      offer = offer === def ? null : def;
      refresh();
    });
    return { el, def };
  });
  offerRow.append(...offerEls.map((o) => o.el));

  function refresh(): void {
    for (const d of deckEls) d.el.classList.toggle('sel', d.card.uid === fromDeck?.uid);
    for (const o of offerEls) o.el.classList.toggle('sel', o.def === offer);
    deckGrid.classList.toggle('has-sel', !!fromDeck);
    offerRow.classList.toggle('has-sel', !!offer);
    swapBtn.disabled = !(fromDeck && offer);
    hint.textContent =
      !fromDeck && !offer ? t('reward.pickBoth') : !fromDeck ? t('reward.pickDeck') : !offer ? t('reward.pickOffer') : t('reward.ready');
  }

  swapBtn.addEventListener('click', () => {
    if (!fromDeck || !offer) return;
    sfx('button');
    swapCard(run, fromDeck.uid, offer.id);
    onDone();
  });

  const el = h(
    'div',
    { class: 'screen reward' },
    runHud(run),
    h('h1', { class: 'h1 reward-title' }, t('reward.victory')),
    h('div', { class: 'swap-label' }, t('reward.yourDeck')),
    h('div', { class: 'swap-deck-wrap scroll' }, deckGrid),
    h('div', { class: 'swap-divider', html: '<span>⇅</span>' }),
    h('div', { class: 'swap-label' }, t('reward.offer')),
    offerRow,
    hint,
    h(
      'div',
      { class: 'reward-actions' },
      swapBtn,
      h(
        'button',
        {
          class: 'btn small secondary',
          onclick: () => {
            sfx('tap');
            onDone();
          },
        },
        t('reward.skip'),
      ),
    ),
  );
  refresh();
  return { el };
}
