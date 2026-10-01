import { t } from '../../core/i18n';
import type { Combat } from '../../game/combat';
import { currentNode, type RunState, totalFloors } from '../../game/run';
import type { HeroId, Side } from '../../game/types';
import { creature } from '../art/creatures';
import { icon } from '../art/icons';
import { darkEyes, motes } from '../components/decor';
import { $, centerOf, h, retrigger } from '../dom';
import { settings } from '../../game/settings';

export const ABILITY_ICON: Record<string, string> = { warrior: 'overtime', mage: 'stolenClock', necromancer: 'shutdown' };
export const PASSIVE_ICON: Record<string, string> = { warrior: 'thickSkin', mage: 'bolt2', necromancer: 'biohazard' };

export type Point = { x: number; y: number };

/** DOM, refs, shared state and helpers of one combat screen, passed to every combat UI module. */
export interface CombatView {
  el: HTMLElement;
  combat: Combat;
  heroId: HeroId;
  r: ReturnType<typeof queryRefs>;
  /**
   * `waiting`: before the player presses Start; things can be inspected but not played.
   * `ltr`: the belt runs left to right (the default setting; a Paradigm Shift turns it around mid-fight).
   * `stop`: seconds of hit-stop left (the fight freezes for a beat on heavy hits).
   */
  state: {
    paused: boolean;
    waiting: boolean;
    ended: boolean;
    frameNo: number;
    beltW: number;
    cardW: number;
    rowH: number;
    ltr: boolean;
    stop: number;
  };
  retrigger(target: Element, cls: string): void;
  enemyPoint(): Point;
  heroPoint(): Point;
  pointOf(side: Side): Point;
  /** A short notice in the middle of the fight; `alert` makes it a bad-news one that stays longer; `delayMs` holds it back (e.g. behind a speech bubble). */
  toast(text: string, alert?: boolean, delayMs?: number): void;
  banner(text: string, bad?: boolean): void;
  /** Pauses the fight while something is being inspected (set by the combat screen). */
  inspect(open: boolean): void;
}

function markup(run: RunState, combat: Combat): string {
  const node = currentNode(run);
  const enemyDef = combat.enemy.def;
  const heroId = run.hero;
  return `
    <header class="topbar">
      <div class="floor-chip"><div class="enemy-name">${t(`enemy.${enemyDef.id}.name`)}${enemyDef.tier !== 'normal' ? `<span class="tier ${enemyDef.tier}">${t(`journey.node.${enemyDef.tier}`)}</span>` : ''}</div><small>${t('common.floorOf', { a: node.act, n: node.floor, total: totalFloors(run) })}</small></div>
      <button class="icon-btn js-pause" aria-label="${t('combat.paused')}">${icon('pause')}</button>
    </header>
    <section class="stage">
      <div class="stage-floor"></div>
      ${motes(14)}
      ${darkEyes([
        { x: '6%', y: '14%' },
        { x: '84%', y: '44%' },
      ])}
      <!-- act decor (CSS shows the one for the enemy's act, so debug fights match too): the crypt's candles, the afternoon's flickering tube light and water cooler, the night's warning beacon -->
      <div class="candles"><i></i><i></i></div>
      <div class="neon"></div><div class="cooler">${creature('waterCooler')}</div><div class="neon-dim"></div>
      <div class="beacon"><i></i></div>
      <div class="shade"></div>
      <div class="enemy-wrap">
        <div class="enemy-art">${creature(enemyDef.art)}<button class="weak-spot" aria-label="${t('status.weakSpot')}">${icon('target')}</button></div>
        <div class="mop" aria-hidden="true">${icon('mop')}</div>
      </div>
      <div class="enemy-info">
        <div class="statuses js-estatus"></div>
        <div class="hpline">
          <div class="block-chip off js-eblock">${icon('shield')}<b></b></div>
          <div class="bar js-ehp"><div class="ghost"></div><div class="fill"></div><div class="txt"></div></div>
        </div>
        <div class="threat" role="status" aria-live="polite">
          <div class="t-ico js-intent-ico"></div>
          <div class="t-val"></div>
          <div class="t-track"><div class="t-fill"></div><span class="t-lbl"></span></div>
          <div class="t-next" aria-hidden="true"></div>
          <div class="t-time"></div>
        </div>
      </div>
    </section>
    <!-- right above the belt: your HP, Block and statuses stay in view while you play -->
    <section class="hero-row">
      <div class="hero-portrait">${creature(heroId)}</div>
      <div class="hero-info">
        <div class="hpline">
          <div class="block-chip off js-hblock">${icon('shield')}<b></b></div>
          <div class="bar js-hhp"><div class="ghost"></div><div class="fill"></div><div class="incoming"></div><div class="txt"></div></div>
        </div>
        <div class="statuses js-hstatus"></div>
      </div>
    </section>
    <section class="belt rows-${combat.beltRows} ${settings.rightToLeft ? '' : 'ltr'}">
      <div class="belt-track"></div>
      <div class="belt-alarm"></div>
      <div class="belt-rust"></div>
      <div class="maw-eyes" aria-hidden="true"><i></i><i></i></div>
      <div class="belt-cards"></div>
    </section>
    <section class="mana-row">${icon('crystal')}<div class="mana-pips"></div><div class="mana-num"></div></section>
    <section class="action-row">
      <div class="sleeve js-sleeve"></div>
      <button class="ability-btn js-ability" aria-label="${t(`hero.${heroId}.ability`)}">
        <div class="charge"></div>${icon(ABILITY_ICON[heroId])}<span class="acost">${icon('crystal')}${combat.abilityCost()}</span><span class="albl">${t(`hero.${heroId}.ability`)}</span>
      </button>
    </section>`;
}

function queryRefs(el: HTMLElement) {
  return {
    stage: $('.stage', el),
    enemyWrap: $('.enemy-wrap', el),
    enemyArt: $('.enemy-art', el),
    weakSpot: $('.weak-spot', el),
    mop: $('.mop', el),
    beltAlarm: $('.belt-alarm', el),
    rust: $('.belt-rust', el),
    intent: $('.threat', el),
    intentIco: $('.js-intent-ico', el),
    intentVal: $('.threat .t-val', el),
    intentLbl: $('.threat .t-lbl', el),
    timer: $('.threat .t-fill', el),
    intentTime: $('.threat .t-time', el),
    intentNext: $('.threat .t-next', el),
    incoming: $('.js-hhp .incoming', el),
    eHp: $('.js-ehp', el),
    eBlock: $('.js-eblock', el),
    eStatus: $('.js-estatus', el),
    hHp: $('.js-hhp', el),
    hBlock: $('.js-hblock', el),
    hStatus: $('.js-hstatus', el),
    portrait: $('.hero-portrait', el),
    ability: $<HTMLButtonElement>('.js-ability', el),
    pause: $<HTMLButtonElement>('.js-pause', el),
    manaRow: $('.mana-row', el),
    pips: $('.mana-pips', el),
    manaNum: $('.mana-num', el),
    sleeve: $('.js-sleeve', el),
    belt: $('.belt', el),
    track: $('.belt-track', el),
    beltCards: $('.belt-cards', el),
  };
}

export function createCombatView(run: RunState, combat: Combat): CombatView {
  const el = h('div', {
    class: 'screen combat',
    'data-hero': run.hero,
    'data-act': String(combat.enemy.def.act),
    'data-tier': combat.enemy.def.tier,
    style: { '--hero-color': combat.heroDef.color } as never,
  });
  el.innerHTML = markup(run, combat);
  const r = queryRefs(el);

  const enemyPoint = (): Point => {
    const rc = r.enemyArt.getBoundingClientRect();
    return { x: rc.left + rc.width / 2, y: rc.top + rc.height * 0.45 };
  };
  const heroPoint = (): Point => centerOf(r.portrait);

  return {
    el,
    combat,
    heroId: run.hero,
    r,
    state: { paused: true, waiting: true, ended: false, frameNo: 0, beltW: 0, cardW: 0, rowH: 0, ltr: !settings.rightToLeft, stop: 0 },
    retrigger,
    enemyPoint,
    heroPoint,
    pointOf: (side) => (side === 'enemy' ? enemyPoint() : heroPoint()),
    toast(text, alert = false, delayMs = 0) {
      el.querySelector('.hint-toast')?.remove();
      const tEl = h('div', { class: `hint-toast ${alert ? 'alert' : ''}`, style: { animationDelay: `${delayMs}ms` } }, text);
      // A held-back note sits at rest size while it waits (the fill shows its first keyframe): it slams in only when it's not delayed.
      if (delayMs > 0) tEl.style.setProperty('--slam', '1');
      tEl.addEventListener('animationend', () => tEl.remove());
      el.append(tEl);
    },
    inspect() {
      /* replaced by the combat screen */
    },
    banner(text, bad = false) {
      const b = h('div', { class: `banner ${bad ? 'bad' : ''}` }, text);
      b.addEventListener('animationend', () => b.remove());
      el.append(b);
    },
  };
}
