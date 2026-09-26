import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { addCard, swapCard, type RunState } from '../../game/run';
import type { CardDef } from '../../game/types';
import type { Screen } from '../app';
import { h } from '../dom';
import { cardView } from '../components/cardView';
import { openCardDetail, openDeck } from '../components/modals';
import { runHud } from './journey';

/** Post-fight reward: Add the card, Swap it for one in the deck (Cardstone's classic), or Skip. */
export function rewardScreen(run: RunState, picks: CardDef[], onDone: (msg?: string) => void): Screen {
  let sel: CardDef | null = null;
  const addBtn = h('button', { class: 'btn', disabled: true }, t('reward.add'));
  const swapBtn = h('button', { class: 'btn secondary', disabled: true }, t('reward.swap'));
  const row = h('div', { class: 'reward-cards' });
  const cardEls = picks.map((def, i) => {
    const c = cardView({ uid: -100 - i, id: def.id, up: false });
    let pressTimer = 0;
    c.addEventListener('pointerdown', () => {
      pressTimer = window.setTimeout(() => {
        pressTimer = -1;
        openCardDetail({ uid: -1, id: def.id, up: false });
      }, 450);
    });
    c.addEventListener('pointerup', () => {
      if (pressTimer === -1) return;
      clearTimeout(pressTimer);
      sel = sel === def ? null : def;
      sfx('tap');
      cardEls.forEach((x, j) => x.classList.toggle('sel', picks[j] === sel));
      row.classList.toggle('has-sel', !!sel);
      addBtn.disabled = swapBtn.disabled = !sel;
    });
    c.addEventListener('pointerleave', () => clearTimeout(pressTimer));
    return c;
  });
  row.append(...cardEls);

  addBtn.addEventListener('click', () => {
    if (!sel) return;
    sfx('button');
    addCard(run, sel.id);
    onDone(t('reward.added', { name: t(`card.${sel.id}.name`) }));
  });
  swapBtn.addEventListener('click', () => {
    if (!sel) return;
    const pick = sel;
    sfx('tap');
    openDeck(run.deck, {
      title: t('reward.swapHint', { name: t(`card.${pick.id}.name`) }),
      onPick: (c) => {
        swapCard(run, c.uid, pick.id);
        onDone();
      },
    });
  });

  const el = h(
    'div',
    { class: 'screen reward' },
    runHud(run),
    h('h1', { class: 'h1', style: { fontSize: '36px', marginTop: '16px' } }, t('reward.victory')),
    h('p', { class: 'sub' }, t('reward.choose')),
    row,
    h(
          'div',
          { class: 'reward-actions' },
          addBtn,
          swapBtn,
          h('button', { class: 'btn small secondary full', onclick: () => (sfx('tap'), onDone()) }, t('reward.skip')),
        ),
  );
  return { el };
}
