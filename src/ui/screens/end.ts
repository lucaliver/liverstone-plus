import { type TKey, t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { currentNode, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h } from '../dom';
import { creature } from '../art/creatures';
import { icon } from '../art/icons';
import { motes } from '../components/decor';

export function endScreen(run: RunState, won: boolean, onAgain: () => void, onMenu: () => void): Screen {
  const node = currentNode(run);
  const stat = (ic: string, k: TKey, v: number | string): HTMLElement => h('div', { html: `${icon(ic)}<span>${t(k)}</span><b>${v}</b>` });
  const el = h(
    'div',
    { class: `screen end ${won ? 'win' : 'lose'}` },
    h(
      'div',
      { class: 'end-body' },
      h('h1', { class: 'h1' }, won ? t('end.victory') : t('end.defeat')),
      h('div', { class: 'portrait-lg', html: `${motes(10)}${creature(run.hero)}` }),
      h('p', { class: 'sub' }, won ? t('end.victoryDesc') : t('end.defeatDesc', { n: node.floor })),
      h(
        'div',
        { class: 'stats' },
        stat('up', 'end.stats.floor', node.floor),
        stat('skull', 'end.stats.kills', run.stats.kills),
        stat('cards', 'end.stats.cards', run.stats.cardsPlayed),
        stat('blood', 'end.stats.damage', run.stats.damageTaken),
      ),
    ),
    h(
      'div',
      { class: 'end-actions' },
      h(
        'button',
        {
          class: 'btn block',
          onclick: () => {
            sfx('button');
            onAgain();
          },
        },
        t('end.again'),
      ),
      h(
        'button',
        {
          class: 'btn secondary block',
          onclick: () => {
            sfx('tap');
            onMenu();
          },
        },
        t('end.title'),
      ),
    ),
  );
  return { el };
}
