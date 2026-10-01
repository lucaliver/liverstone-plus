import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { RELICS } from '../../data/relics';
import { gainRelic, rollRelics, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h, onTapOrHold } from '../dom';
import { relicArt } from '../art/relics';
import { CARD_SHOW_MS, playRelic } from '../components/cardShow';
import { openInfo } from '../components/modals';
import { closeRoom, roomScene } from '../components/room';
import { runHud } from './journey';

/** Lost & Found: three relics nobody came back for; the player keeps one. */
export function lostFoundScreen(run: RunState, onDone: () => void): Screen {
  const el = h(
    'div',
    { class: 'screen' },
    runHud(run),
    h('h1', { class: 'h1', style: { marginTop: '12px' } }, t('lost.title')),
    h('p', { class: 'sub' }, t('lost.desc')),
    roomScene('lostFound'),
    h(
      'div',
      { class: 'relic-row' },
      ...rollRelics(run).map((id) => {
        const text = t(`relic.${id}.d`, { n: RELICS[id].n });
        const card = h('button', {
          class: `relic-card ${RELICS[id].rarity}`,
          html: `<b>${t(`relic.${id}.name`)}</b>${relicArt(id)}<span>${text}</span>`,
        });
        // Tap = keep it, hold = read all of it (the card shows only the first lines).
        onTapOrHold(
          card,
          () => {
            sfx('tap');
            gainRelic(run, id);
            playRelic(el, id);
            closeRoom(el, onDone, CARD_SHOW_MS);
          },
          () => openInfo({ art: relicArt(id), title: t(`relic.${id}.name`), desc: text }),
        );
        return card;
      }),
    ),
  );
  return { el };
}
