import { type TKey, t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { currentNode, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h } from '../dom';
import { creature } from '../art/creatures';
import { dropLetters, motes } from '../components/decor';
import { burst, haptic } from '../fx/fx';
import { playMusic } from '../../audio/music';

export function endScreen(run: RunState, won: boolean, onAgain: () => void, onMenu: () => void): Screen {
  const node = currentNode(run);
  const title = won ? t('end.victory') : t('end.defeat');
  let confetti = 0;
  /** `--i` staggers the payslip's lines (and its stamp) as the slip prints. */
  let line = 0;
  const staggered = (e: HTMLElement): HTMLElement => {
    e.style.setProperty('--i', String(line++));
    return e;
  };
  const row = (k: TKey, v: number | string, cls = ''): HTMLElement =>
    staggered(h('div', { class: `slip-row ${cls}` }, h('span', null, t(k)), h('b', null, String(v))));
  const el = h(
    'div',
    { class: `screen end ${won ? 'win' : 'lose'}` },
    h(
      'div',
      { class: 'end-body' },
      h('h1', { class: 'h1 end-title', 'aria-label': title, html: dropLetters(title) }),
      h('div', { class: 'portrait-lg', html: `${motes(10)}${creature(run.hero)}` }),
      h('p', { class: 'sub' }, won ? t('end.victoryDesc') : t('end.defeatDesc', { n: node.floor })),
      // The run's stats as a dot-matrix payslip: all that work, and the net pay is still zero.
      h(
        'div',
        { class: 'payslip' },
        h('div', { class: 'slip-head' }, h('b', null, t('end.slip.title')), h('span', null, t('end.slip.company'))),
        h('div', { class: 'slip-sub' }, t('end.slip.employee', { hero: t(`hero.${run.hero}.name`), a: node.act, n: node.floor })),
        row('end.slip.earnings', '', 'slip-section'),
        row('end.slip.floors', node.floor),
        row('end.slip.kills', run.stats.kills),
        row('end.slip.overtime', run.stats.elites),
        row('end.slip.cards', run.stats.cardsPlayed),
        row('end.slip.gross', run.money),
        row('end.slip.deductions', '', 'slip-section'),
        row('end.slip.injuries', `-${run.stats.damageTaken}`),
        row('end.slip.ceoBonus', `-${run.money}`),
        row('end.slip.net', t('end.slip.netValue'), 'slip-net'),
        staggered(h('div', { class: 'slip-stamp' }, won ? t('end.slip.paid') : t('end.slip.void'))),
      ),
    ),
    h(
      'div',
      { class: 'end-actions' },
      h(
        'button',
        {
          class: 'btn cta block',
          onclick: () => {
            sfx('button');
            haptic('tap');
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
  return {
    el,
    enter() {
      playMusic(won ? 'victory' : 'menu');
      if (!won) return;
      // A few bursts of ink "confetti" around the title.
      let n = 0;
      const pop = (): void => {
        const r = el.querySelector('.end-title')?.getBoundingClientRect();
        if (r) burst('gold', r.left + Math.random() * r.width, r.top + Math.random() * r.height, 26, 1.3);
        if (++n < 6) confetti = window.setTimeout(pop, 450);
      };
      confetti = window.setTimeout(pop, 500);
    },
    leave() {
      clearTimeout(confetti);
    },
  };
}
