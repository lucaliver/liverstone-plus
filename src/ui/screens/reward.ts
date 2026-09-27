import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { type RunState, swapCard } from '../../game/run';
import type { CardDef, CardInst } from '../../game/types';
import type { Screen } from '../app';
import { icon } from '../art/icons';
import { cardView } from '../components/cardView';
import { openCardDetail, sortDeck } from '../components/modals';
import { h, onTapOrHold } from '../dom';
import { dropLetters } from '../components/decor';
import { runHud } from './journey';

/** Tap selects; a long press opens the card detail instead (and doesn't select). */
function selectable(el: HTMLElement, card: CardInst, onSelect: () => void): void {
  onTapOrHold(
    el,
    () => {
      sfx('tap');
      onSelect();
    },
    () => openCardDetail(card),
  );
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
    h('h1', {
      class: 'h1 reward-title',
      'aria-label': t('reward.cleared'),
      // Letters drop in one by one (words kept together), then the print keeps slipping out of register.
      html: dropLetters(t('reward.cleared')),
    }),
    h(
      'div',
      { class: 'swap-area' },
      h('div', { class: 'swap-label' }, t('reward.yourDeck')),
      h('div', { class: 'swap-deck-wrap scroll' }, deckGrid),
      h('div', { class: 'swap-divider', html: icon('swap') }),
      h('div', { class: 'swap-label' }, t('reward.offer')),
      offerRow,
    ),
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
