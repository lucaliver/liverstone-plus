import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { canCopy, canShred, COPY_HP_COST, photocopyCard, SHRED_MIN_DECK, shredCard, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h } from '../dom';
import { icon } from '../art/icons';
import { openDeck } from '../components/modals';
import { motes } from '../components/decor';
import { haptic } from '../fx/fx';
import { runHud } from './journey';

/** Copy Room: shred a card out of the deck for good, or photocopy one (it costs HP). */
export function copyRoomScreen(run: RunState, onDone: () => void): Screen {
  const opt = (ic: string, title: string, desc: string, disabled: boolean, fn: () => void): HTMLButtonElement =>
    h('button', { class: 'option', disabled, onclick: fn, html: `${icon(ic)}<b>${title}</b><span>${desc}</span>` });
  const pick = (title: string, confirmLabel: string, apply: (uid: number) => void): void => {
    sfx('tap');
    openDeck(run.deck, {
      title,
      confirmLabel,
      onPick: (c) => {
        sfx('stash');
        haptic('tap');
        apply(c.uid);
        onDone();
      },
    });
  };

  const el = h(
    'div',
    { class: 'screen' },
    runHud(run),
    h('h1', { class: 'h1', style: { marginTop: '12px' } }, t('copy.title')),
    h('p', { class: 'sub' }, t('copy.desc')),
    h('div', {
      class: 'rest-fire',
      html: `${motes(14, ['var(--paper)', 'var(--paper)', 'var(--y)'])}<div class="promo-badge">${icon('shredder')}</div>`,
    }),
    h(
      'div',
      { class: 'rest-options' },
      opt('trash', t('copy.shred'), canShred(run) ? t('copy.shredDesc') : t('copy.shredFull', { n: SHRED_MIN_DECK }), !canShred(run), () =>
        pick(t('copy.shredHint'), t('copy.shredConfirm'), (uid) => shredCard(run, uid)),
      ),
      opt('copy', t('copy.photocopy'), canCopy(run) ? t('copy.photocopyDesc', { n: COPY_HP_COST }) : t('copy.photocopyWeak'), !canCopy(run), () =>
        pick(t('copy.photocopyHint'), t('copy.photocopyConfirm'), (uid) => photocopyCard(run, uid)),
      ),
    ),
  );
  return { el };
}
