import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { canUpgrade, REST_HEAL, rest, upgradeCard, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h } from '../dom';
import { icon } from '../art/icons';
import { openDeck } from '../components/modals';
import { motes } from '../components/decor';
import { runHud } from './journey';

export function restScreen(run: RunState, onDone: () => void): Screen {
  const heal = Math.min(run.maxHp - run.hp, Math.round(run.maxHp * REST_HEAL));
  const upgradable = run.deck.filter(canUpgrade);
  const opt = (ic: string, title: string, desc: string, disabled: boolean, fn: () => void): HTMLButtonElement =>
    h('button', { class: 'option', disabled, onclick: fn, html: `${icon(ic)}<b>${title}</b><span>${desc}</span>` });

  const el = h(
    'div',
    { class: 'screen' },
    runHud(run),
    h('h1', { class: 'h1', style: { marginTop: '12px' } }, t('rest.title')),
    h('p', { class: 'sub' }, t('rest.desc')),
    h('div', { class: 'rest-fire', html: `${motes(16, ['var(--y)', 'var(--p)'])}${icon('campfire')}` }),
    h(
      'div',
      { class: 'rest-options' },
      opt('heart', t('rest.heal'), heal > 0 ? t('rest.healDesc', { n: heal }) : t('rest.full'), heal <= 0, () => {
        sfx('heal');
        rest(run);
        onDone();
      }),
      opt('hammer', t('rest.smith'), t('rest.smithDesc'), upgradable.length === 0, () => {
        sfx('tap');
        openDeck(run.deck, {
          title: t('rest.smithHint'),
          confirmLabel: t('rest.upgrade'),
          filter: canUpgrade,
          preview: (c) => ({ ...c, up: true }),
          onPick: (c) => {
            sfx('block');
            upgradeCard(run, c.uid);
            run.cleared = true;
            onDone();
          },
        });
      }),
    ),
  );
  return { el };
}
