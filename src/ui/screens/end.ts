import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { currentNode, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h } from '../dom';

export function endScreen(run: RunState, won: boolean, onAgain: () => void, onMenu: () => void): Screen {
  const node = currentNode(run);
  const stat = (k: string, v: number | string): HTMLElement => h('div', null, h('span', null, t(k)), h('b', null, v));
  const el = h(
    'div',
    { class: `screen end ${won ? 'win' : 'lose'}` },
    h('div', { class: 'bg-dungeon' }),
    h('h1', { class: 'h1' }, won ? t('end.victory') : t('end.defeat')),
    h('p', { class: 'sub' }, won ? t('end.victoryDesc') : t('end.defeatDesc', { n: node.floor })),
    h(
      'div',
      { class: 'stats' },
      stat('end.stats.floor', node.floor),
      stat('end.stats.kills', run.stats.kills),
      stat('end.stats.cards', run.stats.cardsPlayed),
      stat('end.stats.damage', run.stats.damageTaken),
      stat('end.stats.deck', run.deck.length),
    ),
    h('button', { class: 'btn block', onclick: () => (sfx('button'), onAgain()) }, t('end.again')),
    h('button', { class: 'btn secondary block', style: { marginTop: '10px' }, onclick: () => (sfx('tap'), onMenu()) }, t('end.title')),
  );
  return { el };
}
