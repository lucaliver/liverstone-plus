import { trackReward } from '../../analytics';
import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { burst, haptic } from '../fx/fx';
import { addCard, type RewardOffer, type RunState, skipPay, skipReward, swapCard } from '../../game/run';
import type { CardInst } from '../../game/types';
import type { Screen } from '../app';
import { icon } from '../art/icons';
import { cardView } from '../components/cardView';
import { openCardDetail, sortCards, sortControl } from '../components/modals';
import { SLACK_MS, cssMs, h, onTapOrHold } from '../dom';
import { dropLetters } from '../components/decor';
import { HEAL_FAST_MS, playHealing } from './rest';

/** How long the chosen card takes to fly onto the one it replaces, and to be seen sitting there (ms): the CSS plays it, this waits for it. */
const swapMs = (): number => cssMs('--delay-swap-gone') + cssMs('--dur-swap-gone') + SLACK_MS;

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
 * Post-fight reward. A normal fight swaps: pick a card of your deck (top) and one of the offered cards (bottom), then
 * Swap them, or Skip. An elite or a boss (`adds`) pays one more card: pick an offer and Add it.
 */
export function rewardScreen(run: RunState, picks: RewardOffer[], adds: boolean, onDone: () => void): Screen {
  let fromDeck: CardInst | null = null;
  let offer: RewardOffer | null = null;
  const offered = picks.map((p) => p.def.id);

  const swapBtn = h('button', { class: 'btn', disabled: true }, t(adds ? 'reward.add' : 'reward.swap'));
  const skipBtn = h(
    'button',
    {
      class: 'btn small secondary skip-btn',
      onclick: (e: Event) => {
        sfx('tap');
        const pay = skipPay(run);
        trackReward(run, offered, null, null);
        skipReward(run);
        // Max HP goes up: hearts rise, then on to the map.
        swapBtn.disabled = true;
        skipBtn.disabled = true;
        (e.currentTarget as HTMLElement).blur();
        playHealing(el, pay, t('reward.maxHp'), true);
        setTimeout(onDone, HEAL_FAST_MS);
      },
    },
    h('span', null, t('reward.skip')),
    h('small', { html: `${icon('heart')}${t('reward.skipHp', { n: skipPay(run) })}` }),
  );
  const deckGrid = h('div', { class: 'swap-deck' });
  const offerRow = h('div', { class: 'swap-offer' });
  const hint = h('p', { class: 'sub swap-hint' });

  // Every card of the deck, one by one (copies aren't grouped: the swap takes one of them out), sortable.
  let deckEls: { el: HTMLElement; card: CardInst }[] = [];
  const renderDeck = (): void => {
    deckEls = sortCards(run.deck).map((card) => {
      const el = cardView(card);
      if (adds)
        onTapOrHold(
          el,
          () => openCardDetail(card),
          () => openCardDetail(card),
        );
      else
        selectable(el, card, () => {
          fromDeck = fromDeck?.uid === card.uid ? null : card;
          refresh();
        });
      return { el, card };
    });
    deckGrid.replaceChildren(...deckEls.map((d) => d.el));
  };
  const sorter = sortControl(() => {
    renderDeck();
    refresh();
  });
  renderDeck();

  const offerEls = picks.map((pick, i) => {
    const card: CardInst = { uid: -100 - i, id: pick.def.id, up: pick.up };
    const el = cardView(card);
    selectable(el, card, () => {
      offer = offer === pick ? null : pick;
      refresh();
    });
    return { el, pick };
  });
  offerRow.append(...offerEls.map((o) => o.el));

  function refresh(): void {
    for (const d of deckEls) d.el.classList.toggle('sel', d.card.uid === fromDeck?.uid);
    for (const o of offerEls) o.el.classList.toggle('sel', o.pick === offer);
    deckGrid.classList.toggle('has-sel', !!fromDeck);
    offerRow.classList.toggle('has-sel', !!offer);
    swapBtn.disabled = !offer || !(adds || fromDeck);
    hint.textContent = adds
      ? t(offer ? 'reward.readyAdd' : 'reward.pickAdd')
      : !fromDeck && !offer
        ? t('reward.pickBoth')
        : !fromDeck
          ? t('reward.pickDeck')
          : !offer
            ? t('reward.pickOffer')
            : t('reward.ready');
  }

  swapBtn.addEventListener('click', () => {
    if (!offer || !(adds || fromDeck)) return;
    sfx('cardPlay');
    haptic('tap');
    const flyer = offerEls.find((o) => o.pick === offer)?.el;
    const old = adds ? deckGrid : deckEls.find((d) => d.card.uid === fromDeck?.uid)?.el;
    trackReward(run, offered, offer.def.id, fromDeck?.id ?? null);
    if (adds) addCard(run, offer.def.id);
    else if (fromDeck) swapCard(run, fromDeck.uid, offer.def.id, offer.up);
    swapBtn.disabled = true;
    skipBtn.disabled = true;
    if (!old || !flyer) return onDone();
    // The offered card flies over the old one (or into the deck) and lands with a stamp and a spray of paper.
    if (!adds) old.scrollIntoView({ block: 'nearest' });
    const from = flyer.getBoundingClientRect();
    const to = old.getBoundingClientRect();
    const fit = adds ? 0.3 : to.width / from.width;
    flyer.style.setProperty('--dx', `${to.left + to.width / 2 - from.left - from.width / 2}px`);
    flyer.style.setProperty('--dy', `${to.top + to.height / 2 - from.top - from.height / 2}px`);
    flyer.style.setProperty('--fit', String(fit));
    flyer.classList.add('flying');
    if (adds) flyer.classList.add('into-deck');
    if (!adds) old.classList.add('replaced');
    setTimeout(() => {
      burst('paper', to.left + to.width / 2, to.top + to.height / 2, 22, 1.2);
      sfx(adds ? 'deckAdd' : 'stamp');
      haptic('ability');
    }, cssMs('--dur-swap-fly') * 0.8);
    setTimeout(onDone, swapMs());
  });

  const el = h(
    'div',
    { class: 'screen reward' },
    h('h1', {
      class: 'h1 reward-title',
      'aria-label': t('reward.title'),
      // Letters drop in one by one (words kept together), then the print keeps slipping out of register.
      html: dropLetters(t('reward.title')),
    }),
    h(
      'div',
      { class: 'swap-area' },
      h('div', { class: 'swap-head' }, h('div', { class: 'swap-label' }, t('reward.yourDeck')), sorter),
      h('div', { class: 'swap-deck-wrap scroll' }, deckGrid),
      // The offers sit in a tray under the deck, so the deck keeps every pixel that is left.
      h(
        'div',
        { class: 'swap-tray' },
        h('div', { class: 'swap-head' }, h('div', { class: 'swap-label' }, t('reward.offer')), h('span', { class: 'swap-icon', html: icon('swap') })),
        offerRow,
      ),
    ),
    hint,
    h('div', { class: 'reward-actions' }, swapBtn, skipBtn),
  );
  refresh();
  return { el };
}
