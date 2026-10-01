import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { CONFIG } from '../../data/config';
import { canCopy, canShred, photocopyCard, shredCard, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h } from '../dom';
import { icon } from '../art/icons';
import type { CardInst } from '../../game/types';
import { CARD_SHOW_MS, playPhotocopy, playShred } from '../components/cardShow';
import { openDeck } from '../components/modals';
import { closeRoom, roomOption, roomScene } from '../components/room';
import { runHud } from './journey';

/** Copy Room: shred a card out of the deck for good, or photocopy one (it costs HP). */
export function copyRoomScreen(run: RunState, onDone: () => void): Screen {
  const pick = (title: string, confirmLabel: string, apply: (uid: number) => void, play: (screen: HTMLElement, card: CardInst) => void): void => {
    sfx('tap');
    openDeck(run.deck, {
      title,
      confirmLabel,
      onPick: (c) => {
        const card = { ...c };
        apply(c.uid);
        play(el, card);
        closeRoom(el, onDone, CARD_SHOW_MS);
      },
    });
  };

  const el = h(
    'div',
    { class: 'screen' },
    runHud(run),
    h('h1', { class: 'h1', style: { marginTop: '12px' } }, t('copy.title')),
    h('p', { class: 'sub' }, t('copy.desc')),
    roomScene('copy'),
    h(
      'div',
      { class: 'rest-options' },
      roomOption(
        icon('trash'),
        t('copy.shred'),
        canShred(run) ? t('copy.shredDesc') : t('copy.shredFull', { n: CONFIG.shredMinDeck }),
        !canShred(run),
        () =>
          pick(
            t('copy.shredHint'),
            t('copy.shredConfirm'),
            (uid) => shredCard(run, uid),
            (screen, c) => playShred(screen, c, t('copy.shredded')),
          ),
      ),
      roomOption(
        icon('copy'),
        t('copy.photocopy'),
        canCopy(run) ? t('copy.photocopyDesc', { n: CONFIG.copyHpCost }) : t('copy.photocopyWeak'),
        !canCopy(run),
        () =>
          pick(
            t('copy.photocopyHint'),
            t('copy.photocopyConfirm'),
            (uid) => photocopyCard(run, uid),
            (screen, c) => playPhotocopy(screen, c, t('copy.copied')),
          ),
      ),
    ),
  );
  return { el };
}
