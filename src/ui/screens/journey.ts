import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { currentNode, type RunNode, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h, onPress } from '../dom';
import { icon } from '../art/icons';
import { openDeck, openSettings } from '../components/modals';
import { openHeroSheet } from '../components/heroSheet';
import { creature } from '../art/creatures';

export const NODE_ICON: Record<RunNode['type'], string> = {
  fight: 'toolbox',
  elite: 'clipboard',
  rest: 'coffee',
  promotion: 'ladder',
  boss: 'tophat',
};
/** Height of one floor on the map (px). */
const ROW_H = 92;
const laneX = (lane: number): number => 22 + lane * 56;

export function runHud(run: RunState, extra?: HTMLElement): HTMLElement {
  const portrait = h('button', { class: 'chip hero-chip', 'aria-label': t(`hero.${run.hero}.name`), html: creature(run.hero) });
  // Tap or hold the portrait for the hero's sheet.
  onPress(portrait, () => openHeroSheet(run));
  return h(
    'div',
    { class: 'run-hud' },
    portrait,
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

/**
 * The act map, bottom to top: nodes on two lanes linked by dotted lines. After a node is cleared its reachable
 * nodes light up; tap one to pick it (tap it again, or the button, to go in).
 */
export function journeyScreen(run: RunState, onEnter: (to?: number) => void, onHome: () => void): Screen {
  const cur = currentNode(run);
  const options = run.cleared ? cur.next.filter((id) => !run.path.includes(id)) : [];
  // After an act boss the map turns to the next act.
  const act = options.length ? run.nodes[options[0]].act : cur.act;
  const nodes = run.nodes.filter((n) => n.act === act);
  const floors = Math.max(...nodes.map((n) => n.floor));
  const minFloor = Math.min(...nodes.map((n) => n.floor));
  let picked: number | null = !run.cleared ? cur.id : options.length === 1 ? options[0] : null;
  const y = (n: RunNode): number => (floors - n.floor + 0.5) * ROW_H;

  const lines = nodes
    .flatMap((n) =>
      n.next
        .map((id) => run.nodes[id])
        // A flat link goes both ways: draw it once.
        .filter((m) => m.act === n.act && !(m.floor === n.floor && m.id < n.id))
        .map((m) => {
          const walked = run.path.includes(n.id) && (run.path.includes(m.id) || (n.id === cur.id && m.id === picked));
          return `<line class="${walked ? 'walked' : ''}" x1="${laneX(n.lane)}" y1="${y(n)}" x2="${laneX(m.lane)}" y2="${y(m)}" vector-effect="non-scaling-stroke"/>`;
        }),
    )
    .join('');

  const enterBtn = h('button', { class: 'btn block' });
  const nodeEls = new Map<number, HTMLElement>();
  const refresh = (): void => {
    for (const [id, el] of nodeEls) el.classList.toggle('current', id === picked);
    const target = picked === null ? null : run.nodes[picked];
    enterBtn.disabled = !target;
    enterBtn.textContent = target ? t('journey.enter', { n: target.floor }) : t('journey.choose');
  };
  const go = (): void => {
    if (picked === null) return;
    sfx('button');
    onEnter(picked === cur.id ? undefined : picked);
  };
  enterBtn.onclick = go;

  const path = h('div', { class: 'path', style: { height: `${(floors - minFloor + 1) * ROW_H}px` } });
  path.innerHTML = `<svg class="links" viewBox="0 0 100 ${(floors - minFloor + 1) * ROW_H}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>`;
  for (let f = minFloor; f <= floors; f++) path.append(h('span', { class: 'num', style: { top: `${(floors - f + 0.5) * ROW_H}px` } }, f));
  for (const n of nodes) {
    const past = run.path.includes(n.id) && (n.id !== cur.id || run.cleared);
    const open = n.id === cur.id ? !run.cleared : options.includes(n.id);
    const missed = !past && !open && n.act === cur.act && n.floor <= cur.floor && n.id !== cur.id;
    const label = t(`journey.node.${n.type}`);
    const el = h(
      'div',
      {
        class: `node ${n.type} ${past ? 'done' : ''} ${missed ? 'missed' : ''} ${open ? 'open' : ''}`,
        style: { left: `${laneX(n.lane)}%`, top: `${y(n)}px` },
      },
      h('button', {
        class: 'dot',
        html: icon(past ? 'check' : NODE_ICON[n.type]),
        'aria-label': `${t('common.floor', { n: n.floor })} · ${label}`,
        disabled: !open,
        onclick: () => {
          if (picked === n.id) {
            go();
            return;
          }
          sfx('tap');
          picked = n.id;
          refresh();
        },
      }),
      h('span', { class: 'label' }, label),
    );
    nodeEls.set(n.id, el);
    path.append(el);
  }
  refresh();

  const menuBtns = h(
    'div',
    { class: 'hud-btns' },
    h('button', {
      class: 'icon-btn',
      'aria-label': t('menu.home'),
      html: icon('home'),
      onclick: () => {
        sfx('tap');
        onHome();
      },
    }),
    h('button', {
      class: 'icon-btn',
      'aria-label': t('menu.settings'),
      html: icon('gear'),
      onclick: () => {
        sfx('tap');
        openSettings();
      },
    }),
  );
  const el = h(
    'div',
    { class: 'screen journey' },
    runHud(run, menuBtns),
    h(
      'div',
      { class: 'act-banner' },
      h('div', { class: 'h1' }, t('journey.title', { n: act })),
      h('p', { class: 'sub' }, t(`journey.actName.${act}`)),
    ),
    h('div', { class: 'scroll', style: { flex: '1' } }, path),
    enterBtn,
  );
  return {
    el,
    enter() {
      el.querySelector('.node.current, .node.open')?.scrollIntoView({ block: 'center' });
    },
  };
}
