import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { haptic } from '../fx/fx';
import { actDef, isFinalAct } from '../../data/acts';
import { clockAt, currentNode, mapAct, type RunNode, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h, onPress, onTapOrHold } from '../dom';
import { icon } from '../art/icons';
import { debugButton } from '../components/debugMenu';
import { openDeck, openInfo, openSettings, openStatInfo } from '../components/modals';
import { openHeroSheet } from '../components/heroSheet';
import { dropLetters } from '../components/decor';
import { creature } from '../art/creatures';
import { UNKNOWN } from '../components/cardView';
import { actArt } from '../art/actArt';

export const NODE_ICON: Record<RunNode['type'], string> = {
  fight: 'toolbox',
  elite: 'clipboard',
  rest: 'coffee',
  promotion: 'ladder',
  copy: 'shredder',
  tailor: 'tailor',
  lostFound: 'lostBox',
  vending: 'vendingMachine',
  crossTraining: 'whiteboard',
  boss: 'tophat',
};
/** What a room is called on the map and in its info (the last act's boss is the final one). */
const nodeKind = (n: RunNode): 'finalBoss' | RunNode['type'] => (n.type === 'boss' && isFinalAct(n.act) ? 'finalBoss' : n.type);
/** The icon of a room on the map: a boss wears the one of its act. */
export const nodeIcon = (n: RunNode): string => (n.type === 'boss' ? (actDef(n.act).bossIcon ?? NODE_ICON.boss) : NODE_ICON[n.type]);
/** Height of one floor on the map (px); a room takes most of it, the rest is corridor. */
const ROW_H = 92;
const laneX = (lane: number): number => 22 + lane * 56;
/** Rooms more than this many doors ahead are lost in fog: only the ones the player can go to next are in sight. */
const VISION = 1;
/** Footsteps along a walked corridor: one every so many px. The map is about this wide (px), to measure the turns. */
const STEP_PX = 12;
const MAP_W = 350;
/** Delay between the steps of the newest walked stretch (ms), and between the lamps that light up the roads just opened. */
const STEP_MS = 70;
const LAMP_MS = 45;

/** A point on the map: x in % of its width, y in px. */
type Pt = [number, number];

/** A workday clock time (minutes after midnight) as text, e.g. 08:27. */
export function clockText(min: number): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return t('journey.clock', { h: pad(Math.floor(min / 60) % 24), m: pad(min % 60) });
}

export function runHud(run: RunState, extra?: HTMLElement): HTMLElement {
  const portrait = h('button', { class: 'chip hero-chip', 'aria-label': t(`hero.${run.hero}.name`), html: creature(run.hero) });
  // Tap or hold the portrait for the hero's sheet.
  onPress(portrait, () => openHeroSheet(run));
  // HP explains itself and the deck opens, on a tap or a hold alike.
  const hp = h('button', { class: 'chip hp', html: `${icon('heart')}<span>${run.hp}/${run.maxHp}</span>` });
  onPress(hp, () => openStatInfo('hp'));
  const deck = h('button', { class: 'chip', html: `${icon('cards')}<span>${run.deck.length}</span>`, 'aria-label': t('common.deck') });
  onPress(deck, () => {
    sfx('tap');
    openDeck(run.deck);
  });
  return h('div', { class: 'run-hud' }, portrait, hp, deck, h('div', { class: 'spacer' }), extra ?? null);
}

/**
 * The act map, bottom to top: the floor plan of the office. Rooms on two lanes joined by corridors, a few rooms ahead in
 * sight and the rest in fog. After a room is cleared its doors light up; tap a room to pick it (tap it again, or the button, to go in).
 */
export function journeyScreen(run: RunState, onEnter: (to?: number) => void, onHome: () => void, onDebug: () => void, revealAll = false): Screen {
  const cur = currentNode(run);
  const options = run.cleared ? cur.next.filter((id) => !run.path.includes(id)) : [];
  const act = mapAct(run);
  const nodes = run.nodes.filter((n) => n.act === act);
  const floors = Math.max(...nodes.map((n) => n.floor));
  const minFloor = Math.min(...nodes.map((n) => n.floor));
  let picked: number | null = !run.cleared ? cur.id : options.length === 1 ? options[0] : null;
  const y = (n: RunNode): number => (floors - n.floor + 0.5) * ROW_H;
  // Nodes still ahead on some path from here; everything else is out of reach and dimmed.
  const reachable = new Set<number>();
  const walk = (id: number): void => {
    if (reachable.has(id) || run.path.includes(id)) return;
    reachable.add(id);
    for (const nx of run.nodes[id].next) walk(nx);
  };
  for (const id of run.cleared ? options : cur.next) walk(id);
  // Fog: how many doors away each room is; the ones past VISION can't be made out (the boss is always in sight).
  const seenFrom = (start: number): Map<number, number> => {
    const dist = new Map<number, number>();
    const look = (id: number, d: number): void => {
      if ((dist.get(id) ?? Infinity) <= d) return;
      dist.set(id, d);
      if (d < VISION) for (const nx of run.nodes[id].next) look(nx, d + 1);
    };
    look(start, 0);
    return dist;
  };
  const dist = seenFrom(cur.id);
  // Back from a job in the same act: the rooms that came out of the fog with this step stamp in once the walk ends.
  const before =
    run.cleared && run.path.length > 1 && run.nodes[run.path[run.path.length - 2]].act === cur.act ? seenFrom(run.path[run.path.length - 2]) : null;
  let walkMs = 0;
  /** When the walk and the roads lighting up are over: the new rooms are stamped then. */
  let revealMs = 0;
  const foggy = (n: RunNode): boolean => !revealAll && n.type !== 'boss' && !run.path.includes(n.id) && !dist.has(n.id);

  /** The corridor between two rooms: straight along a lane or across a floor, else up, across and up again. */
  const route = (a: RunNode, b: RunNode): Pt[] => {
    const [xa, xb, ya, yb] = [laneX(a.lane), laneX(b.lane), y(a), y(b)];
    if (a.floor === b.floor || xa === xb)
      return [
        [xa, ya],
        [xb, yb],
      ];
    const mid = (ya + yb) / 2;
    return [
      [xa, ya],
      [xa, mid],
      [xb, mid],
      [xb, yb],
    ];
  };
  /** The corridors (a flat one usually goes both ways: drawn once), and which wall of a room each one leaves through. */
  const halls = nodes.flatMap((n) =>
    n.next
      .map((id) => run.nodes[id])
      .filter((m) => m.act === n.act && !(m.floor === n.floor && m.id < n.id && m.next.includes(n.id)))
      .map((m) => ({ n, m, pts: route(n, m) })),
  );
  const doors = new Map<number, Set<string>>();
  const addDoor = (n: RunNode, side: string): void => void doors.set(n.id, (doors.get(n.id) ?? new Set()).add(side));
  for (const { n, m } of halls) {
    const right = laneX(m.lane) > laneX(n.lane);
    const [from, to] = m.floor > n.floor ? ['top', 'bottom'] : right ? ['right', 'left'] : ['left', 'right'];
    addDoor(n, from);
    addDoor(m, to);
  }
  const hallSvg = (cls: string): string =>
    halls
      .map(({ n, m, pts }) => {
        // Walked corridors carry footsteps instead; the one to the room picked next is lit.
        const trod = run.path.includes(n.id) && run.path.includes(m.id);
        const next = (n.id === cur.id && m.id === picked) || (m.id === cur.id && n.id === picked);
        const state = `${trod ? 'trod' : next ? 'walked' : ''} ${foggy(n) || foggy(m) ? 'fog' : ''}`;
        return `<polyline class="${cls} ${state}" points="${pts.map((p) => p.join(',')).join(' ')}" vector-effect="non-scaling-stroke"/>`;
      })
      .join('');

  const enterBtn = h('button', { class: 'btn block' });
  const nodeEls = new Map<number, HTMLElement>();
  const refresh = (): void => {
    for (const [id, el] of nodeEls) el.classList.toggle('current', id === picked);
    const target = picked === null ? null : run.nodes[picked];
    enterBtn.disabled = !target;
    // With a room picked, going in is the one thing the screen wants: the button pulses like the other calls to action.
    enterBtn.classList.toggle('cta', !!target);
    enterBtn.textContent = target ? t('journey.enter', { n: target.floor }) : t('journey.choose');
  };
  const go = (): void => {
    if (picked === null) return;
    sfx('button');
    haptic('tap');
    onEnter(picked === cur.id ? undefined : picked);
  };
  enterBtn.onclick = go;

  // The workday clock (on the boss of acts with `bossClock`): the time of the floor ahead. Back from a job, its hands
  // run forward from the floor just done.
  const to = clockAt(run, options.length ? run.nodes[options[0]] : cur);
  const from = run.cleared ? clockAt(run, cur) : to;
  const clockFace = (): HTMLElement => {
    const face = h('span', { class: 'shift-clock', html: '<i class="hh"></i><i class="mh"></i>' });
    for (const [k, deg] of [
      ['--h0', from / 2],
      ['--h1', to / 2],
      ['--m0', from * 6],
      ['--m1', to * 6],
    ] as const)
      face.style.setProperty(k, `${deg}deg`);
    return face;
  };

  const path = h('div', { class: 'path', style: { height: `${(floors - minFloor + 1) * ROW_H}px` } });
  path.innerHTML = `<svg class="links" viewBox="0 0 100 ${(floors - minFloor + 1) * ROW_H}" preserveAspectRatio="none" aria-hidden="true">${hallSvg('hall')}${hallSvg('hall-mid')}</svg>`;
  for (let f = minFloor; f <= floors; f++) path.append(h('span', { class: 'num', style: { top: `${(floors - f + 0.5) * ROW_H}px` } }, f));
  /** Dots along the corridor from a to b, one every STEP_PX, appearing one after the other from `after` ms (`gap` ms apart). Returns when the last one is in. */
  const trail = (a: RunNode, b: RunNode, cls: string, after: number, gap: number): number => {
    const pts = route(a, b);
    const px = (p: Pt): Pt => [(p[0] * MAP_W) / 100, p[1]];
    const lens = pts.slice(1).map((p, k) => Math.hypot(px(p)[0] - px(pts[k])[0], p[1] - pts[k][1]));
    const total = lens.reduce((sum, l) => sum + l, 0);
    const n = Math.max(4, Math.round(total / STEP_PX));
    for (let k = 0; k < n; k++) {
      let d = ((k + 0.5) / n) * total;
      let seg = 0;
      while (seg < lens.length - 1 && d > lens[seg]) d -= lens[seg++];
      const f = lens[seg] ? d / lens[seg] : 0;
      const [p, q] = [pts[seg], pts[seg + 1]];
      path.append(
        h('i', {
          class: `step ${k % 2 ? 'odd' : ''} ${p[1] === q[1] ? 'flat' : ''} ${cls}`,
          style: { left: `${p[0] + (q[0] - p[0]) * f}%`, top: `${p[1] + (q[1] - p[1]) * f}px`, animationDelay: `${after + k * gap}ms` },
        }),
      );
    }
    return after + n * gap;
  };
  // The way walked so far, as footsteps along the corridors; back from a job, its last stretch is walked again step by step.
  run.path.forEach((id, i) => {
    const a = run.nodes[run.path[i - 1]];
    const b = run.nodes[id];
    if (!a || a.act !== act || b.act !== act) return;
    const fresh = run.cleared && i === run.path.length - 1;
    const end = trail(a, b, fresh ? 'fresh' : '', 0, STEP_MS);
    if (fresh) walkMs = end;
  });
  // Then the roads that just opened light up from this room to each new one, and the rooms are stamped where they end.
  if (before) for (const id of options) revealMs = Math.max(revealMs, trail(cur, run.nodes[id], 'lamp', walkMs, LAMP_MS));
  for (const n of nodes) {
    const past = run.path.includes(n.id) && (n.id !== cur.id || run.cleared);
    const open = n.id === cur.id ? !run.cleared : options.includes(n.id);
    const missed = !past && !open && n.id !== cur.id && !reachable.has(n.id);
    const fog = foggy(n);
    const revealed = !!before && !before.has(n.id) && dist.has(n.id) && !past;
    const label = fog ? UNKNOWN : t(`journey.node.${nodeKind(n)}`);
    const el = h(
      'div',
      {
        class: `node ${n.type} ${past ? 'done' : ''} ${missed ? 'missed' : ''} ${open ? 'open' : ''} ${fog ? 'fog' : ''} ${revealed ? 'revealed' : ''}`,
        style: { left: `${laneX(n.lane)}%`, top: `${y(n)}px` },
      },
      h('button', {
        class: 'dot',
        html: fog ? icon('question') : past || !(n.type === 'boss' && !!actDef(n.act).bossClock) ? icon(past ? 'check' : nodeIcon(n)) : undefined,
        'aria-label': `${t('common.floor', { n: n.floor })} · ${label}`,
        // Not `disabled`: every node can still be held to read what it is.
        'aria-disabled': String(!open),
      }),
      h('span', { class: 'label' }, label),
      ...[...(doors.get(n.id) ?? [])].map((side) => h('i', { class: `door ${side}` })),
    );
    if (revealed) el.style.setProperty('--reveal', `${revealMs}ms`);
    const dot = el.querySelector<HTMLElement>('.dot')!;
    if (!past && !fog && n.type === 'boss' && actDef(n.act).bossClock) dot.append(clockFace());
    // Tap an open node to pick it (again to go in); hold any node to learn what it is.
    onTapOrHold(
      dot,
      () => {
        if (!open) return;
        if (picked === n.id) {
          go();
          return;
        }
        sfx('tap');
        picked = n.id;
        refresh();
      },
      () => {
        sfx('tap');
        if (fog) {
          openInfo({ icon: 'question', title: t('journey.fog'), tag: t('common.floor', { n: n.floor }), desc: t('journey.info.fog') });
          return;
        }
        const enemy = n.enemy ? t(`enemy.${n.enemy}.name`) : null;
        openInfo({
          icon: nodeIcon(n),
          title: label,
          tag: t('common.floor', { n: n.floor }),
          desc: t(`journey.info.${nodeKind(n)}`),
          extra: enemy ? [t('journey.info.enemy', { name: enemy })] : undefined,
        });
      },
    );
    nodeEls.set(n.id, el);
    path.append(el);
  }
  refresh();

  // Pay earned so far (the run's score), then Settings (Main menu is in there).
  const pay = h('button', { class: 'chip money', 'aria-label': t('common.pay'), html: `${icon('coin')}<span>${run.money}</span>` });
  onPress(pay, () => openStatInfo('pay'));
  const menuBtns = h(
    'div',
    { class: 'hud-btns' },
    pay,
    h('button', {
      class: 'icon-btn',
      'aria-label': t('menu.settings'),
      html: icon('gear'),
      onclick: () => {
        sfx('tap');
        openSettings([{ label: t('menu.home'), icon: 'home', cls: 'secondary', onClick: onHome }]);
      },
    }),
  );
  const el = h(
    'div',
    { class: 'screen journey', 'data-act': String(act) },
    runHud(run, menuBtns),
    h(
      'div',
      { class: 'act-banner' },
      h('div', { class: 'act-scene', html: actArt(act) }),
      h('div', { class: 'h1' }, t('journey.title', { n: act })),
      h('p', { class: 'sub' }, t(`journey.actName.${act}`)),
    ),
    h('div', { class: 'scroll', style: { flex: '1' } }, path),
    enterBtn,
    debugButton(t('debug.menu'), onDebug),
  );

  // A new shift begins (the act boss is down): a curtain with the act's title, its clock-in time and the factory whistle.
  const actIntro = (): void => {
    const title = t('journey.title', { n: act });
    const curtain = h(
      'div',
      { class: 'act-intro' },
      h('div', { class: 'h1 act-intro-title', 'aria-label': title, html: dropLetters(title) }),
      h('div', { class: 'act-intro-art', html: actArt(act, true) }),
      h('p', { class: 'act-intro-name' }, t(`journey.actName.${act}`)),
      h('p', { class: 'act-intro-clock', html: `${icon('timer')}${t('combat.clockIn', { time: clockText(to) })}` }),
    );
    curtain.addEventListener('click', () => curtain.classList.add('out'));
    curtain.addEventListener('animationend', (e) => {
      if (e.target === curtain && e.animationName === 'act-out') curtain.remove();
    });
    el.append(curtain);
    sfx('siren');
    haptic('ability');
  };

  let revealTimer = 0;
  return {
    el,
    leave() {
      clearTimeout(revealTimer);
    },
    enter() {
      el.querySelector('.node.current, .node.open')?.scrollIntoView({ block: 'center' });
      // The new rooms come out of the fog with a chime.
      if (revealMs) revealTimer = window.setTimeout(() => sfx('ding'), revealMs);
      // A new shift: after an act's boss, or on the first floor of the run.
      if (act !== cur.act || (run.path.length === 1 && !run.cleared)) actIntro();
    },
  };
}
