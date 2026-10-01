import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { crossTrain, rollCrossTraining, type RunState } from '../../game/run';
import type { CardInst } from '../../game/types';
import type { Screen } from '../app';
import { h, onTapOrHold } from '../dom';
import { CARD_SHOW_MS, playCardGain } from '../components/cardShow';
import { cardView } from '../components/cardView';
import { openCardDetail } from '../components/modals';
import { closeRoom } from '../components/room';
import { runHud } from './journey';

/** Cross-Training: cards of the other classes (two of each); the hero takes one into the deck. */
export function crossTrainingScreen(run: RunState, onDone: () => void): Screen {
  let chosen: string | null = null;
  const take = h('button', { class: 'btn', disabled: true }, t('cross.take'));
  const hint = h('p', { class: 'sub swap-hint' }, t('cross.pick'));
  const cards = rollCrossTraining(run).map((def, i) => {
    const card: CardInst = { uid: -100 - i, id: def.id, up: false };
    const el = cardView(card);
    // Tap selects, a long press reads the card.
    onTapOrHold(
      el,
      () => {
        sfx('tap');
        chosen = chosen === def.id ? null : def.id;
        refresh();
      },
      () => openCardDetail(card),
    );
    return { el, id: def.id };
  });
  const offer = h('div', { class: 'cross-offer' }, ...cards.map((c) => c.el));

  function refresh(): void {
    for (const c of cards) c.el.classList.toggle('sel', c.id === chosen);
    offer.classList.toggle('has-sel', !!chosen);
    take.disabled = !chosen;
    hint.textContent = chosen ? t('cross.ready') : t('cross.pick');
  }

  take.addEventListener('click', () => {
    if (!chosen) return;
    sfx('button');
    playCardGain(el, { ...crossTrain(run, chosen) }, t('cross.learned'), { start: 'ding', end: 'deckAdd' });
    closeRoom(el, onDone, CARD_SHOW_MS);
  });

  const el = h(
    'div',
    { class: 'screen' },
    runHud(run),
    h('h1', { class: 'h1', style: { marginTop: '12px' } }, t('cross.title')),
    h('p', { class: 'sub' }, t('cross.desc')),
    h('div', { class: 'cross-area' }, offer),
    hint,
    take,
  );
  refresh();
  return { el };
}
