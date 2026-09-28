import { type TKey, t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import type { RunRecord } from '../../game/meta';
import { ACTS, currentNode, type RunEnd, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h } from '../dom';
import { creature } from '../art/creatures';
import { icon } from '../art/icons';
import { groupCopies, sortCards } from '../components/modals';
import { payslipImage, type ShareSlip, type SlipRow, shareImage } from '../components/shareSlip';
import { dropLetters, motes } from '../components/decor';
import { burst, haptic } from '../fx/fx';
import { playMusic } from '../../audio/music';

/** Payslip rows that can carry a one-run record. */
const ROW_RECORD: Partial<Record<TKey, RunRecord>> = {
  'end.slip.floors': 'bestFloor',
  'end.slip.kills': 'bestKills',
  'end.slip.cards': 'bestCards',
  'end.slip.gross': 'bestPay',
};

/** The end of a run: the heroes it unlocked (shown as the next hire, so the end is a step forward), the payslip with the records it beat, and a shareable copy. */
export function endScreen(run: RunState, won: boolean, end: RunEnd, onAgain: () => void, onMenu: () => void): Screen {
  const node = currentNode(run);
  const title = won ? t('end.victory') : t('end.defeat');
  let confetti = 0;
  const row = (k: TKey, v: number | string, kind: SlipRow['kind'] = 'row'): SlipRow => {
    const rec = ROW_RECORD[k];
    return { label: t(k), value: String(v), kind, record: !!rec && end.beaten.includes(rec) };
  };
  const rows: SlipRow[] = [
    row('end.slip.earnings', '', 'section'),
    row('end.slip.floors', node.floor),
    row('end.slip.kills', run.stats.kills),
    row('end.slip.overtime', run.stats.elites),
    row('end.slip.cards', run.stats.cardsPlayed),
    row('end.slip.gross', run.money),
    row('end.slip.deductions', '', 'section'),
    row('end.slip.injuries', `-${run.stats.damageTaken}`),
    row('end.slip.ceoBonus', `-${run.money}`),
    row('end.slip.net', t('end.slip.netValue'), 'net'),
  ];
  const slip: ShareSlip = {
    hero: run.hero,
    title,
    employee: t('end.slip.employee', { hero: t(`hero.${run.hero}.name`), a: node.act, n: node.floor }),
    rows,
    won,
    stamp: won ? t('end.slip.paid') : t('end.slip.void'),
    deck: groupCopies(sortCards(run.deck)),
  };
  // The image is drawn ahead, so the share sheet opens right on the tap (browsers want it within the gesture).
  let image: Promise<Blob | null> | null = null;
  /** `--i` staggers the payslip's lines (and its stamps) as the slip prints. */
  let line = 0;
  const staggered = (e: HTMLElement): HTMLElement => {
    e.style.setProperty('--i', String(line++));
    return e;
  };
  const el = h(
    'div',
    { class: `screen end ${won ? 'win' : 'lose'}` },
    h(
      'div',
      { class: 'end-body' },
      h('h1', { class: 'h1 end-title', 'aria-label': title, html: dropLetters(title) }),
      h('div', { class: 'portrait-lg', html: `${motes(10)}${creature(run.hero)}` }),
      ...end.hired.map((id) =>
        h('div', {
          class: 'new-hire',
          html: `${creature(id)}<div><b>${t('end.newHire')}</b><span>${t('end.nextHire', { hero: t(`hero.${id}.name`) })}</span></div>`,
        }),
      ),
      h('p', { class: 'sub' }, won ? t(node.act < ACTS ? 'end.firstShiftDesc' : 'end.victoryDesc') : t('end.defeatDesc', { n: node.floor })),
      // The run's stats as a dot-matrix payslip: all that work, and the net pay is still zero.
      h(
        'div',
        { class: 'payslip' },
        h('div', { class: 'slip-head' }, h('b', null, t('end.slip.title')), h('span', null, t('end.slip.company'))),
        h('div', { class: 'slip-sub' }, slip.employee),
        ...rows.map((r) =>
          staggered(
            h(
              'div',
              { class: `slip-row ${r.kind === 'row' ? '' : `slip-${r.kind}`}` },
              h('span', null, r.label, r.record ? h('i', { class: 'slip-record' }, t('end.newRecord')) : null),
              h('b', null, r.value),
            ),
          ),
        ),
        staggered(h('div', { class: 'slip-stamp' }, slip.stamp)),
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
      h('button', {
        class: 'btn secondary block share-btn',
        html: `${icon('share')}<span>${t('end.share')}</span>`,
        onclick: async () => {
          sfx('tap');
          image ??= payslipImage(slip);
          const blob = await image;
          if (blob) await shareImage(blob, 'punchcard-payslip.png', t('end.shareText', { url: location.href.split('#')[0] }));
        },
      }),
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
      image = payslipImage(slip);
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
