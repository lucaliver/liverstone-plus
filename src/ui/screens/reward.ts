import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { haptic } from '../fx/fx';
import { type RewardOffer, type RunState, skipPay, skipReward, swapCard } from '../../game/run';
import type { CardInst } from '../../game/types';
import type { Screen } from '../app';
import { icon } from '../art/icons';
import { cardView } from '../components/cardView';
import { openCardDetail, sortCards, sortControl } from '../components/modals';
import { h, onTapOrHold } from '../dom';
import { dropLetters } from '../components/decor';
import { runHud } from './journey';
import { HEAL_FAST_MS, playHealing } from './rest';

/** How long the chosen card takes to fly onto the one it replaces, and to be seen sitting there (ms). */
const SWAP_ANIM_MS = 550;

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
export function rewardScreen(run: RunState, picks: RewardOffer[], onDone: () => void): Screen {
  let fromDeck: CardInst | null = null;
  let offer: RewardOffer | null = null;

  const swapBtn = h('button', { class: 'btn', disabled: true }, t('reward.swap'));
  const skipBtn = h(
    'button',
    {
      class: 'btn small secondary skip-btn',
      onclick: (e: Event) => {
        sfx('tap');
        const pay = skipPay(run);
        skipReward(run);
        // Max HP goes up: hearts rise, the HUD shows the new total, then on to the map.
        swapBtn.disabled = true;
        skipBtn.disabled = true;
        (e.currentTarget as HTMLElement).blur();
        const hp = el.querySelector('.run-hud .chip.hp span');
        if (hp) hp.textContent = `${run.hp}/${run.maxHp}`;
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
    swapBtn.disabled = !(fromDeck && offer);
    hint.textContent =
      !fromDeck && !offer ? t('reward.pickBoth') : !fromDeck ? t('reward.pickDeck') : !offer ? t('reward.pickOffer') : t('reward.ready');
  }

  swapBtn.addEventListener('click', () => {
    if (!fromDeck || !offer) return;
    sfx('button');
    haptic('tap');
    const old = deckEls.find((d) => d.card.uid === fromDeck?.uid)?.el;
    const flyer = offerEls.find((o) => o.pick === offer)?.el;
    swapCard(run, fromDeck.uid, offer.def.id, offer.up);
    swapBtn.disabled = true;
    skipBtn.disabled = true;
    if (!old || !flyer) return onDone();
    // The offered card flies over the old one and lands on top of it.
    old.scrollIntoView({ block: 'nearest' });
    const from = flyer.getBoundingClientRect();
    const to = old.getBoundingClientRect();
    flyer.style.setProperty('--dx', `${to.left - from.left}px`);
    flyer.style.setProperty('--dy', `${to.top - from.top}px`);
    flyer.style.setProperty('--fit', String(to.width / from.width));
    flyer.classList.add('flying');
    old.classList.add('replaced');
    setTimeout(onDone, SWAP_ANIM_MS);
  });

  const el = h(
    'div',
    { class: 'screen reward' },
    runHud(run),
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
