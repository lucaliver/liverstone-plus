import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { type RunState, SKIP_MAX_HP, skipReward, swapCard } from '../../game/run';
import type { CardDef, CardInst } from '../../game/types';
import type { Screen } from '../app';
import { icon } from '../art/icons';
import { cardView } from '../components/cardView';
import { openCardDetail, sortDeck } from '../components/modals';
import { h, onTapOrHold } from '../dom';
import { dropLetters } from '../components/decor';
import { runHud } from './journey';
import { HEAL_ANIM_MS, playHealing } from './rest';

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
      'aria-label': t('reward.title'),
      // Letters drop in one by one (words kept together), then the print keeps slipping out of register.
      html: dropLetters(t('reward.title')),
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
          class: 'btn small secondary skip-btn',
          onclick: (e: Event) => {
            sfx('tap');
            skipReward(run);
            // Max HP goes up: hearts rise, the HUD shows the new total, then on to the map.
            for (const b of el.querySelectorAll<HTMLButtonElement>('.reward-actions button')) b.disabled = true;
            (e.currentTarget as HTMLElement).blur();
            const hp = el.querySelector('.run-hud .chip.hp span');
            if (hp) hp.textContent = `${run.hp}/${run.maxHp}`;
            playHealing(el, SKIP_MAX_HP, t('reward.maxHp'));
            setTimeout(onDone, HEAL_ANIM_MS);
          },
        },
        h('span', null, t('reward.skip')),
        h('small', { html: `${icon('heart')}${t('reward.skipHp', { n: SKIP_MAX_HP })}` }),
      ),
    ),
  );
  refresh();
  return { el };
}
