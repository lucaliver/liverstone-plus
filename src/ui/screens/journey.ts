import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { currentNode, type RunNode, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h } from '../dom';
import { icon } from '../art/icons';
import { openDeck, openSettings } from '../components/modals';

const NODE_ICON: Record<RunNode['type'], string> = { fight: 'sword', elite: 'skull', rest: 'campfire', boss: 'crown' };

export function runHud(run: RunState, extra?: HTMLElement): HTMLElement {
  return h(
    'div',
    { class: 'run-hud' },
    h('div', { class: 'chip hp', html: `${icon('heart')}<span>${run.hp}/${run.maxHp}</span>` }),
    h('button', {
      class: 'chip',
      onclick: () => {
        sfx('tap');
        openDeck(run.deck);
      },
      html: `${icon('cards')}<span>${run.deck.length}</span>`,
      'aria-label': t('common.deck'),
    }),
    h('div', { class: 'spacer' }),
    extra ?? null,
  );
}

export function journeyScreen(run: RunState, onEnter: () => void): Screen {
  const cur = currentNode(run);
  const nodes = run.nodes.filter((n) => n.act === cur.act);
  const path = h(
    'div',
    { class: 'path' },
    ...nodes.map((n) => {
      const state = n.id < run.current || (n.id === run.current && run.cleared) ? 'done' : n.id === run.current ? 'current' : '';
      const label = t(`journey.node.${n.type}`);
      return h(
        'div',
        { class: `node ${n.type} ${state}` },
        h('span', { class: 'num' }, n.floor),
        h('button', {
          class: 'dot',
          html: icon(state === 'done' ? 'cross' : NODE_ICON[n.type]),
          'aria-label': `${t('common.floor', { n: n.floor })} · ${label}`,
          disabled: state !== 'current',
          onclick: () => {
            sfx('button');
            onEnter();
          },
        }),
        h('span', { class: 'label' }, label),
      );
    }),
  );
  const menuBtn = h('button', {
    class: 'icon-btn',
    'aria-label': t('menu.settings'),
    html: icon('gear'),
    onclick: () => {
      sfx('tap');
      openSettings();
    },
  });
  const el = h(
    'div',
    { class: 'screen journey' },
    runHud(run, menuBtn),
    h(
      'div',
      { class: 'act-banner' },
      h('div', { class: 'h1' }, t('journey.title', { n: cur.act })),
      h('p', { class: 'sub' }, t(`journey.actName.${cur.act}`)),
    ),
    h('div', { class: 'scroll', style: { flex: '1' } }, path),
    h(
      'button',
      {
        class: 'btn block',
        onclick: () => {
          sfx('button');
          onEnter();
        },
      },
      t('journey.enter', { n: cur.floor }),
    ),
  );
  return {
    el,
    enter() {
      el.querySelector('.node.current')?.scrollIntoView({ block: 'center' });
    },
  };
}
