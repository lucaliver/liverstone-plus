import { t } from '../../core/i18n';
import { sfx, type SoundId } from '../../audio/sfx';
import { CARDS } from '../../data/cards';
import { CONFIG, GAME_SPEEDS } from '../../data/config';
import { STATUSES, STATUS_ORDER } from '../../data/statuses';
import { MINIONS } from '../../data/minions';
import type { Combat, Fighter } from '../../game/combat';
import { currentNode, totalFloors, type RunState } from '../../game/run';
import { saveSettings, settings } from '../../game/settings';
import { discover } from '../../game/meta';
import type { CombatCard, CombatEvent, MoveDef, Side } from '../../game/types';
import { openModal, type ModalHandle, type Screen } from '../app';
import { creature } from '../art/creatures';
import { icon, INTENT_ICON } from '../art/icons';
import { cardFace, cardView } from '../components/cardView';
import { darkEyes, motes } from '../components/decor';
import { openCardDetail, openHowTo, openSettings, speedSelector } from '../components/modals';
import { $, centerOf, h, setHtml, setText, toggle } from '../dom';
import { burst, floatText, haptic, shake } from '../fx/fx';

const LONG_PRESS_MS = 420;
export const ABILITY_ICON: Record<string, string> = { warrior: 'rage', mage: 'hourglass', necromancer: 'skull' };

const DRAG_THRESHOLD = 10;

type Removal = 'played' | 'expired' | 'stolen' | 'stashed';

interface CardEl {
  el: HTMLDivElement;
  card: CombatCard;
  desc: HTMLElement;
}

interface Drag {
  uid: number;
  el: HTMLElement;
  from: 'belt' | 'sleeve';
  pointerId: number;
  startX: number;
  startY: number;
  offX: number;
  offY: number;
  moved: boolean;
  timer: number;
}

export interface CombatCallbacks {
  onEnd: (c: Combat) => void;
  onQuit: () => void;
}

export function combatScreen(run: RunState, combat: Combat, cb: CombatCallbacks): Screen {
  const node = currentNode(run);
  const enemyDef = combat.enemy.def;
  const heroId = run.hero;

  const el = h('div', { class: 'screen combat', 'data-hero': heroId, style: { '--hero-color': combat.heroDef.color } as never });
  el.innerHTML = `
    <header class="topbar">
      <button class="icon-btn js-pause" aria-label="${t('combat.paused')}">${icon('pause')}</button>
      <div class="floor-chip">${t('common.floorOf', { n: node.floor, total: totalFloors(run) })}<small>${t(`journey.node.${node.type}`)}</small></div>
      <button class="icon-btn speed-btn js-speed" aria-label="${t('combat.speed')}"></button>
    </header>
    <section class="stage">
      <div class="stage-floor"></div>
      ${motes(14)}
      ${darkEyes([{ x: '6%', y: '14%' }, { x: '84%', y: '44%' }])}
      <div class="candle l">${icon('flame')}</div><div class="candle r">${icon('flame')}</div>
      <div class="shade"></div>
      <div class="minions"></div>
      <div class="enemy-wrap">
        <div class="enemy-art">${creature(enemyDef.art)}</div>
      </div>
      <div class="enemy-info">
        <div class="enemy-name">${t(`enemy.${enemyDef.id}.name`)}${enemyDef.tier !== 'normal' ? `<span class="tier ${enemyDef.tier}">${t(`journey.node.${enemyDef.tier}`)}</span>` : ''}</div>
        <div class="hpline">
          <div class="block-chip off js-eblock">${icon('shield')}<b></b></div>
          <div class="bar js-ehp"><div class="ghost"></div><div class="fill"></div><div class="txt"></div></div>
        </div>
        <div class="statuses js-estatus"></div>
        <div class="threat" role="status" aria-live="polite">
          <div class="t-ico js-intent-ico"></div>
          <div class="t-val"></div>
          <div class="t-track"><div class="t-fill"></div><span class="t-lbl"></span></div>
          <div class="t-time"></div>
        </div>
      </div>
    </section>
    <section class="belt">
      <div class="belt-track"></div>
      <div class="maw-eyes" aria-hidden="true"><i></i><i></i></div>
      <div class="belt-cards"></div>
    </section>
    <section class="mana-row">${icon('crystal')}<div class="mana-pips"></div><div class="mana-num"></div></section>
    <section class="action-row">
      <div class="sleeve js-sleeve"></div>
      <div class="piles">
        <div class="pile" aria-label="${t('combat.drawPile')}">${icon('cards')}<span class="js-draw"></span></div>
        <div class="pile discard" aria-label="${t('combat.discardPile')}">${icon('cards')}<span class="js-discard"></span></div>
      </div>
      <button class="ability-btn js-ability" aria-label="${t(`hero.${heroId}.ability`)}">
        <div class="charge"></div>${icon(ABILITY_ICON[heroId])}<span class="albl">${t(`hero.${heroId}.ability`)}</span>
      </button>
    </section>
    <section class="hero-row">
      <div class="hero-portrait">${creature(heroId)}</div>
      <div class="hero-info">
        <div class="hpline">
          <div class="block-chip off js-hblock">${icon('shield')}<b></b></div>
          <div class="bar js-hhp"><div class="ghost"></div><div class="fill"></div><div class="incoming"></div><div class="txt"></div></div>
        </div>
        <div class="resource"><span class="js-res-lbl"></span><div class="rbar"><div class="rfill js-res"></div></div><span class="weave-badge off js-weave"></span></div>
        <div class="statuses js-hstatus"></div>
      </div>
    </section>`;

  // ---------------------------------------------------------------- refs
  const r = {
    stage: $('.stage', el),
    enemyArt: $('.enemy-art', el),
    intent: $('.threat', el),
    intentIco: $('.js-intent-ico', el),
    intentVal: $('.threat .t-val', el),
    intentLbl: $('.threat .t-lbl', el),
    timer: $('.threat .t-fill', el),
    intentTime: $('.threat .t-time', el),
    incoming: $('.js-hhp .incoming', el),
    eHp: $('.js-ehp', el),
    eBlock: $('.js-eblock', el),
    eStatus: $('.js-estatus', el),
    hHp: $('.js-hhp', el),
    hBlock: $('.js-hblock', el),
    hStatus: $('.js-hstatus', el),
    portrait: $('.hero-portrait', el),
    resLbl: $('.js-res-lbl', el),
    res: $('.js-res', el),
    weave: $('.js-weave', el),
    ability: $<HTMLButtonElement>('.js-ability', el),
    manaRow: $('.mana-row', el),
    pips: $('.mana-pips', el),
    manaNum: $('.mana-num', el),
    sleeve: $('.js-sleeve', el),
    draw: $('.js-draw', el),
    discard: $('.js-discard', el),
    belt: $('.belt', el),
    track: $('.belt-track', el),
    beltCards: $('.belt-cards', el),
    speed: $<HTMLButtonElement>('.js-speed', el),
    minions: $('.minions', el),
  };
  const minionEls = new Map<number, HTMLElement>();

  let paused = false;
  let pauseModal: ModalHandle | null = null;
  let ended = false;
  let beltW = 0;
  let beltOffset = 0;
  let frameNo = 0;
  let lastMove: MoveDef | null = null;
  let lastMaxMana = -1;
  let lastMana = combat.hero.mana;
  const statusSig: Record<Side, string> = { hero: '', enemy: '' };
  const beltEls = new Map<number, CardEl>();
  const removals = new Map<number, Removal>();
  const sleeveEls: (CardEl | null)[] = combat.sleeve.map(() => null);
  const slotHint = `${icon('hand')}<span>${t('combat.sleeveHint')}</span>`;
  const slotEls: HTMLElement[] = combat.sleeve.map((_, i) => h('div', { class: 'sleeve-slot', 'data-slot': i, html: slotHint }));
  r.sleeve.append(...slotEls);
  let drag: Drag | null = null;

  // ---------------------------------------------------------------- layout
  const layout = (): void => {
    beltW = r.belt.clientWidth || el.clientWidth;
    el.style.setProperty('--cw-belt', `${Math.round(beltW * CONFIG.cardWidth)}px`);
  };

  // ---------------------------------------------------------------- helpers
  const retrigger = (target: Element, cls: string): void => {
    target.classList.remove(cls);
    void (target as HTMLElement).offsetWidth;
    target.classList.add(cls);
  };
  const enemyPoint = (): { x: number; y: number } => {
    const rc = r.enemyArt.getBoundingClientRect();
    return { x: rc.left + rc.width / 2, y: rc.top + rc.height * 0.45 };
  };
  const heroPoint = (): { x: number; y: number } => centerOf(r.portrait);
  const pointOf = (side: Side): { x: number; y: number } => (side === 'enemy' ? enemyPoint() : heroPoint());

  const toast = (text: string): void => {
    el.querySelector('.hint-toast')?.remove();
    const tEl = h('div', { class: 'hint-toast' }, text);
    tEl.addEventListener('animationend', () => tEl.remove());
    el.append(tEl);
  };
  const banner = (text: string, bad = false): void => {
    const b = h('div', { class: `banner ${bad ? 'bad' : ''}` }, text);
    b.addEventListener('animationend', () => b.remove());
    el.append(b);
  };

  const setPaused = (p: boolean): void => {
    paused = p;
  };

  // ---------------------------------------------------------------- events
  const SOUND_FOR_KIND: Record<string, SoundId> = { slash: 'slash', blunt: 'blunt', fire: 'fire', ice: 'ice', arcane: 'arcane', thorns: 'slash', claw: 'enemyHit' };

  const onEvent = (e: CombatEvent): void => {
    switch (e.type) {
      case 'damage': {
        const p = pointOf(e.target);
        const delay = e.hitIndex * 90;
        if (e.amount > 0) {
          const big = e.amount >= 15;
          floatText(p.x, p.y, `-${e.amount}`, `${e.target === 'hero' ? 'hurt' : 'dmg'} ${big ? 'big' : ''}`, delay);
          setTimeout(() => burst(e.kind, p.x, p.y, e.source === 'dot' ? 8 : big ? 30 : 18), delay);
        }
        if (e.blocked > 0) {
          floatText(p.x + 30, p.y - 20, `🛡${e.blocked}`, 'blocked', delay);
          sfx('blocked');
        }
        if (e.target === 'enemy') {
          if (e.amount > 0) retrigger(r.enemyArt, 'hit');
          if (e.source !== 'dot') sfx(SOUND_FOR_KIND[e.kind] ?? 'blunt');
          if (e.amount >= 15) shake('small');
        } else if (e.source !== 'dot' || e.amount > 0) {
          if (e.amount > 0) {
            retrigger(r.portrait, 'hurt');
            shake(e.amount >= 12 ? 'big' : 'small');
            haptic(e.amount >= 12 ? 60 : 25);
          }
          sfx('enemyHit');
        }
        break;
      }
      case 'heal': {
        const p = pointOf(e.target);
        floatText(p.x, p.y, `+${e.amount}`, 'heal');
        burst('heal', p.x, p.y, 16);
        sfx('heal');
        break;
      }
      case 'block': {
        const p = pointOf(e.target);
        floatText(p.x, p.y - 10, `+${e.amount}`, 'block');
        burst('block', p.x, p.y, 10);
        sfx('block');
        retrigger(e.target === 'hero' ? r.hBlock : r.eBlock, 'pop');
        break;
      }
      case 'status': {
        const def = STATUSES[e.id];
        const p = pointOf(e.target);
        floatText(p.x, p.y - 36, t(`status.${e.id}`), `status ${def.good ? 'good' : 'bad'}`);
        sfx(def.good ? 'status' : 'debuff');
        if (e.id === 'burn') burst('fire', p.x, p.y, 10);
        if (e.id === 'chill' || e.id === 'frozen') burst('ice', p.x, p.y, 14);
        break;
      }
      case 'text': {
        const p = pointOf(e.target);
        floatText(p.x, p.y - 50, t(e.key), 'text');
        break;
      }
      case 'cantAfford': {
        const ce = beltEls.get(e.card.uid) ?? sleeveEls.find((s) => s?.card.uid === e.card.uid);
        if (ce) retrigger(ce.el, 'nope');
        retrigger(r.manaRow, 'flash');
        toast(t('combat.noMana'));
        sfx('error');
        haptic(15);
        break;
      }
      case 'cardPlayed':
        removals.set(e.card.uid, 'played');
        sfx('cardPlay');
        break;
      case 'cardExpired':
        removals.set(e.card.uid, 'expired');
        sfx('cardExpire');
        break;
      case 'cardStolen': {
        removals.set(e.card.uid, 'stolen');
        const p = enemyPoint();
        floatText(p.x, p.y - 60, t('combat.stolen'), 'text');
        sfx('steal');
        break;
      }
      case 'cardStashed':
        removals.set(e.card.uid, 'stashed');
        sfx('stash');
        break;
      case 'cardSpawn':
        sfx('cardSpawn');
        break;
      case 'curseAdded': {
        discover([e.card.id]);
        const p = enemyPoint();
        burst('curse', p.x, p.y, 20);
        sfx('curse');
        break;
      }
      case 'reshuffle': {
        const p = centerOf(r.draw);
        floatText(p.x - 30, p.y, t('combat.reshuffle'), 'status good');
        sfx('reshuffle');
        break;
      }
      case 'enemyAct':
        if (e.move.dmg) retrigger(r.enemyArt, 'lunge');
        else if (e.move.intent !== 'flee') retrigger(r.enemyArt, 'cast');
        break;
      case 'mana': {
        const p = centerOf(r.manaNum);
        floatText(p.x, p.y - 10, `+${e.amount}`, 'mana');
        burst('mana', p.x, p.y, 10);
        sfx('mana');
        break;
      }
      case 'manaCrystal': {
        const p = centerOf(r.pips);
        floatText(p.x, p.y - 16, `+${e.amount} ${t('kw.crystal')}`, 'status good');
        burst('mana', p.x, p.y, 16);
        sfx('mana');
        break;
      }
      case 'manaDrain':
        retrigger(r.manaRow, 'flash');
        break;
      case 'ability': {
        const f = h('div', { class: 'ability-flash' });
        f.addEventListener('animationend', () => f.remove());
        el.append(f);
        banner(t(`hero.${heroId}.ability`));
        sfx('ability');
        haptic([20, 40, 20]);
        break;
      }
      case 'enrage': {
        const p = enemyPoint();
        floatText(p.x, p.y - 70, t('combat.enraged'), 'status bad');
        burst('blood', p.x, p.y, 30, 1.4);
        sfx('enrage');
        shake('big');
        break;
      }
      case 'minionSummon': {
        const d = MINIONS[e.id];
        const mEl = h('div', { class: 'minion', html: `${creature(d.art)}<div class="mtimer"><i></i></div><div class="mhp"></div>` });
        minionEls.set(e.uid, mEl);
        r.minions.append(mEl);
        const p = centerOf(mEl);
        burst('curse', p.x, p.y, 14);
        sfx('curse');
        break;
      }
      case 'minionAttack': {
        const mEl = minionEls.get(e.uid);
        if (mEl) retrigger(mEl, 'atk');
        break;
      }
      case 'minionHit': {
        const mEl = minionEls.get(e.uid);
        if (!mEl) break;
        retrigger(mEl, 'hurt');
        const p = centerOf(mEl);
        floatText(p.x, p.y - 20, `-${e.amount}`, 'hurt');
        burst('claw', p.x, p.y, 10);
        sfx('enemyHit');
        break;
      }
      case 'minionDied': {
        const mEl = minionEls.get(e.uid);
        if (!mEl) break;
        minionEls.delete(e.uid);
        mEl.classList.add('gone');
        setTimeout(() => mEl.remove(), 420);
        break;
      }
      case 'end':
        finish(e.result);
        break;
      default:
        break;
    }
  };
  const unsub = combat.events.on(onEvent);

  // ---------------------------------------------------------------- end of combat
  const finish = (result: 'win' | 'lose' | 'fled'): void => {
    if (ended) return;
    ended = true;
    cancelDrag();
    if (result === 'win') {
      r.enemyArt.classList.add('dead');
      const p = enemyPoint();
      burst('gold', p.x, p.y, 40, 1.5);
      banner(t('reward.victory'));
      sfx('victory');
    } else if (result === 'fled') {
      r.enemyArt.classList.add('fleeing');
      banner(t('reward.fled'), true);
      sfx('steal');
    } else {
      banner(t('end.defeat'), true);
      sfx('defeat');
      haptic([60, 60, 120]);
    }
    setTimeout(() => cb.onEnd(combat), 1500);
  };

  // ---------------------------------------------------------------- input
  const playUid = (uid: number): void => {
    if (paused || ended) return;
    combat.playCard(uid);
  };

  const slotAt = (x: number, y: number): number => {
    for (let i = 0; i < slotEls.length; i++) {
      const rc = slotEls[i].getBoundingClientRect();
      if (x >= rc.left - 14 && x <= rc.right + 14 && y >= rc.top - 20 && y <= rc.bottom + 14) return i;
    }
    return -1;
  };

  const cancelDrag = (): void => {
    if (!drag) return;
    clearTimeout(drag.timer);
    drag.el.classList.remove('dragging');
    if (drag.from === 'sleeve') drag.el.style.transform = '';
    slotEls.forEach((s) => s.classList.remove('target'));
    r.stage.classList.remove('drop-play');
    drag = null;
  };

  const onDown = (ev: PointerEvent, from: 'belt' | 'sleeve'): void => {
    if (paused || ended || drag) return;
    const cardEl = (ev.target as Element).closest<HTMLElement>('.card');
    if (!cardEl) return;
    const uid = Number(cardEl.dataset.uid);
    const rc = cardEl.getBoundingClientRect();
    cardEl.setPointerCapture(ev.pointerId);
    drag = {
      uid,
      el: cardEl,
      from,
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      offX: ev.clientX - rc.left,
      offY: ev.clientY - rc.top,
      moved: false,
      timer: window.setTimeout(() => {
        if (!drag || drag.moved) return;
        const card = findCard(uid);
        cancelDrag();
        if (!card) return;
        sfx('tap');
        setPaused(true);
        openCardDetail(card, () => setPaused(!!pauseModal));
      }, LONG_PRESS_MS),
    };
  };

  const onMove = (ev: PointerEvent): void => {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const dx = ev.clientX - drag.startX;
    const dy = ev.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      drag.moved = true;
      clearTimeout(drag.timer);
      drag.el.classList.add('dragging');
    }
    if (!drag.moved) return;
    if (drag.from === 'belt') {
      const base = r.beltCards.getBoundingClientRect();
      const tilt = Math.max(-8, Math.min(8, Math.round(ev.movementX)));
      drag.el.style.transform = `translate3d(${ev.clientX - base.left - drag.offX}px, ${ev.clientY - base.top - drag.offY}px, 0) rotate(${tilt}deg)`;
      const slot = slotAt(ev.clientX, ev.clientY);
      slotEls.forEach((s, i) => toggle(s, 'target', i === slot));
    } else {
      drag.el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.08)`;
    }
    toggle(r.stage, 'drop-play', ev.clientY < r.belt.getBoundingClientRect().top);
  };

  const onUp = (ev: PointerEvent): void => {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const d = drag;
    clearTimeout(d.timer);
    if (!d.moved) {
      cancelDrag();
      playUid(d.uid);
      return;
    }
    const slot = d.from === 'belt' ? slotAt(ev.clientX, ev.clientY) : -1;
    const toStage = ev.clientY < r.belt.getBoundingClientRect().top;
    cancelDrag();
    if (slot >= 0) combat.stash(d.uid, slot);
    else if (toStage) playUid(d.uid);
  };

  const findCard = (uid: number): CombatCard | null =>
    combat.belt.find((b) => b.card.uid === uid)?.card ?? combat.sleeve.find((c) => c?.uid === uid) ?? null;

  r.beltCards.addEventListener('pointerdown', (e) => onDown(e, 'belt'));
  r.sleeve.addEventListener('pointerdown', (e) => onDown(e, 'sleeve'));
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', () => cancelDrag());
  el.addEventListener('contextmenu', (e) => e.preventDefault());

  r.ability.addEventListener('click', () => {
    if (paused || ended) return;
    if (!combat.useAbility()) {
      sfx('error');
      toast(t(`hero.${heroId}.resourceDesc`));
    }
  });

  const renderSpeed = (): void => setText(r.speed, `${settings.speed}×`);
  r.speed.addEventListener('click', () => {
    const i = GAME_SPEEDS.indexOf(settings.speed as (typeof GAME_SPEEDS)[number]);
    settings.speed = GAME_SPEEDS[(i + 1) % GAME_SPEEDS.length];
    saveSettings();
    renderSpeed();
    sfx('tap');
  });

  const openPause = (): void => {
    if (pauseModal || ended) return;
    cancelDrag();
    setPaused(true);
    sfx('button');
    const body = h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
      h('div', { class: 'setting' }, h('span', null, t('settings.speed')), speedSelector(renderSpeed)),
    );
    pauseModal = openModal({
      title: t('combat.paused'),
      body,
      actions: [
        { label: t('combat.resume') },
        { label: t('menu.howTo'), cls: 'secondary', onClick: () => {
          openHowTo();
          return false;
        } },
        { label: t('menu.settings'), cls: 'secondary', onClick: () => {
          openSettings(renderSpeed);
          return false;
        } },
        {
          label: t('combat.quit'),
          cls: 'danger',
          onClick: () => {
            openModal({
              body: t('journey.abandonConfirm'),
              actions: [
                { label: t('common.confirm'), cls: 'danger', onClick: () => cb.onQuit() },
                { label: t('common.cancel'), cls: 'secondary' },
              ],
            });
            return false;
          },
        },
      ],
      onClose: () => {
        pauseModal = null;
        setPaused(false);
      },
    });
  };
  $('.js-pause', el).addEventListener('click', openPause);

  const onVisibility = (): void => {
    if (document.hidden) openPause();
  };

  // ---------------------------------------------------------------- render
  const renderBar = (bar: HTMLElement, chip: HTMLElement, f: Fighter): void => {
    const k = Math.max(0, f.hp / f.maxHp);
    const fill = bar.querySelector<HTMLElement>('.fill')!;
    const ghost = bar.querySelector<HTMLElement>('.ghost')!;
    const tr = `scaleX(${k})`;
    if (fill.style.transform !== tr) {
      fill.style.transform = tr;
      ghost.style.transform = tr;
    }
    setText(bar.querySelector('.txt')!, `${f.hp} / ${f.maxHp}`);
    toggle(chip, 'off', f.block <= 0);
    toggle(bar, 'has-block', f.block > 0);
    setText(chip.querySelector('b')!, f.block);
  };

  const renderStatuses = (side: Side, box: HTMLElement): void => {
    const f = combat.fighter(side);
    const list = STATUS_ORDER.filter((id) => f.statuses[id] && (STATUSES[id].kind === 'timed' ? f.statuses[id].t > 0 : f.statuses[id].v > 0));
    const vals = list.map((id) => {
      const s = f.statuses[id];
      if (STATUSES[id].kind !== 'timed') return String(s.v);
      return s.t > 999 ? '' : `${Math.ceil(s.t)}s`;
    });
    const sig = list.map((id, i) => id + vals[i]).join('|');
    if (sig === statusSig[side]) return;
    statusSig[side] = sig;
    box.replaceChildren(
      ...list.map((id, i) => {
        const def = STATUSES[id];
        const s = f.statuses[id];
        const b = h('button', { class: `status ${def.good ? 'good' : 'bad'}`, html: `${icon(def.icon)}<span>${vals[i]}</span>`, 'aria-label': t(`status.${id}`) });
        b.addEventListener('click', () => toast(`${t(`status.${id}`)}: ${t(`status.${id}.d`, { v: s.v })}`));
        return b;
      }),
    );
  };

  const intentValue = (m: MoveDef): string => {
    if (m.dmg) {
      const d = combat.intentDamage(m);
      return m.hits && m.hits > 1 ? `${d}×${m.hits}` : String(d);
    }
    if (m.block) return String(Math.round(m.block * combat.enemy.dmgScale));
    return '';
  };

  const renderIntent = (): void => {
    const e = combat.enemy;
    const m = e.move;
    if (m !== lastMove) {
      lastMove = m;
      r.intent.dataset.intent = m.intent;
      setHtml(r.intentIco, icon(INTENT_ICON[m.intent] ?? 'star'));
      setText(r.intentLbl, t(`move.${m.id}`));
      retrigger(r.intent, 'pop');
      if (m.intent === 'charge') {
        sfx('windup');
        toast(`${t(`enemy.${e.def.id}.name`)}: ${t('intent.charge')}`);
      }
    }
    setText(r.intentVal, intentValue(m));
    const p = Math.min(1, e.timer / m.windup);
    r.timer.style.transform = `scaleX(${p.toFixed(3)})`;
    const rate = combat.enemyTimeRate();
    const left = rate > 0 ? Math.max(0, (m.windup - e.timer) / rate) : Infinity;
    setText(r.intentTime, rate > 0 ? `${left.toFixed(1)}s` : '||');
    const hostile = !ended && (m.intent === 'attack' || m.intent === 'charge');
    toggle(r.intent, 'urgent', hostile && left < 1.1);

    // Preview how much HP the hit will take (after Block), and flash the screen edges just before it lands.
    const hs = combat.hero;
    const incoming = hostile && !combat.minions.length ? Math.max(0, combat.intentDamage(m) * (m.hits ?? 1) - hs.block) : 0;
    const shown = incoming > 0 && left < 2.2;
    const lost = Math.min(hs.hp, incoming);
    r.incoming.style.left = `${((hs.hp - lost) / hs.maxHp) * 100}%`;
    r.incoming.style.width = shown ? `${(lost / hs.maxHp) * 100}%` : '0';
    toggle(el, 'danger', shown && left < 0.8);
  };

  const renderEnemyState = (): void => {
    toggle(r.enemyArt, 'stunned', combat.has('enemy', 'stun'));
    toggle(r.enemyArt, 'frozen', combat.has('enemy', 'frozen'));
    toggle(r.enemyArt, 'chilled', combat.has('enemy', 'chill'));
    toggle(r.enemyArt, 'enraged', combat.has('enemy', 'haste') || combat.enemy.halfTriggered && !!enemyDef.onHalf);
  };

  const renderMana = (): void => {
    const hs = combat.hero;
    if (hs.maxMana !== lastMaxMana) {
      lastMaxMana = hs.maxMana;
      const had = r.pips.children.length;
      r.pips.replaceChildren(...Array.from({ length: hs.maxMana }, (_, i) => h('div', { class: `pip ${had && i >= had ? 'gain' : ''}` })));
    }
    const pips = r.pips.children;
    for (let i = 0; i < pips.length; i++) {
      const p = pips[i] as HTMLElement;
      const full = i < hs.mana;
      toggle(p, 'full', full);
      const partial = i === hs.mana;
      toggle(p, 'partial', partial);
      p.style.setProperty('--f', partial ? String(hs.manaTimer / hs.regen) : '0');
      if (full && i >= lastMana) retrigger(p, 'gain');
    }
    lastMana = hs.mana;
    r.manaNum.innerHTML = `${hs.mana}<small>/${hs.maxMana}</small>`;
  };

  const renderHeroExtras = (): void => {
    const hs = combat.hero;
    const k = hs.resource / hs.resourceMax;
    r.res.style.transform = `scaleX(${k})`;
    setText(r.resLbl, `${t(`hero.${heroId}.resource`)} ${hs.resource}/${hs.resourceMax}`);
    r.ability.style.setProperty('--p', String(k));
    toggle(r.ability, 'ready', combat.abilityReady());
    toggle(r.weave, 'off', hs.weave <= 0);
    if (hs.weave > 0) setText(r.weave, t('combat.weave', { n: hs.weave }));
    setText(r.draw, combat.draw.length);
    setText(r.discard, combat.discard.length);
  };

  const flyOut = (ce: CardEl, reason: Removal): void => {
    const def = CARDS[ce.card.id];
    const el2 = ce.el;
    const rc = el2.getBoundingClientRect();
    const target = reason === 'stolen' || def.type === 'attack' || def.type === 'spell' || (def.type === 'potion' && def.dmg) ? enemyPoint() : reason === 'expired' ? null : heroPoint();
    const base = (el2.style.transform || '').replace(/scale\([^)]*\)|rotate\([^)]*\)/g, '');
    if (reason === 'expired' || !target) {
      el2.classList.add('fall-out');
      el2.style.transform = `${base} translate3d(-40px, 60px, 0) rotate(-25deg)`;
    } else {
      const dx = target.x - (rc.left + rc.width / 2);
      const dy = target.y - (rc.top + rc.height / 2);
      el2.classList.add('fly-out');
      el2.style.transform = `${base} translate3d(${dx}px, ${dy}px, 0) scale(.35) rotate(${dx > 0 ? 20 : -20}deg)`;
      if (reason === 'played') setTimeout(() => burst(def.type === 'skill' ? 'block' : 'hit', target.x, target.y, 8), 300);
    }
    setTimeout(() => el2.remove(), 520);
  };

  const makeCardEl = (card: CombatCard): CardEl => {
    const cardEl = cardView(card, { combat });
    return { el: cardEl, card, desc: cardEl.querySelector('.c-face')! };
  };

  const renderBelt = (): void => {
    const onBelt = new Set<number>();
    const refreshText = frameNo % 8 === 0;
    for (const b of combat.belt) {
      onBelt.add(b.card.uid);
      let ce = beltEls.get(b.card.uid);
      if (!ce) {
        ce = makeCardEl(b.card);
        ce.el.classList.add(b.pos > 0.05 && frameNo > 1 ? 'dealt' : 'enter');
        beltEls.set(b.card.uid, ce);
        r.beltCards.append(ce.el);
      }
      toggle(ce.el, 'poor', !combat.canAfford(b.card) || !combat.isPlayable(b.card));
      toggle(ce.el, 'leaving', b.pos > 0.86);
      if (refreshText) setHtml(ce.desc, cardFace(b.card, combat));
      if (drag?.uid === b.card.uid && drag.moved) continue;
      // Snap to whole pixels: crisp pixel art and a slightly stepped, printed feel.
      const x = Math.round(beltW * (1 - b.pos));
      ce.el.style.transform = `translate3d(${x}px, 0, 0)`;
      ce.el.style.zIndex = String(Math.round(b.pos * 100));
    }
    for (const [uid, ce] of beltEls) {
      if (onBelt.has(uid)) continue;
      beltEls.delete(uid);
      if (drag?.uid === uid) cancelDrag();
      const reason = removals.get(uid) ?? 'expired';
      removals.delete(uid);
      if (reason === 'stashed') ce.el.remove();
      else flyOut(ce, reason);
    }
  };

  const renderSleeve = (): void => {
    combat.sleeve.forEach((card, i) => {
      const cur = sleeveEls[i];
      if (cur?.card.uid === card?.uid) {
        if (cur && card) {
          toggle(cur.el, 'poor', !combat.canAfford(card));
          if (frameNo % 8 === 0) setHtml(cur.desc, cardFace(card, combat));
        }
        return;
      }
      if (cur) {
        const reason = removals.get(cur.card.uid);
        removals.delete(cur.card.uid);
        if (drag?.uid === cur.card.uid) cancelDrag();
        if (reason === 'played') {
          // Detach so it can animate out while the slot re-renders.
          const rc = cur.el.getBoundingClientRect();
          const base = el.getBoundingClientRect();
          cur.el.style.position = 'absolute';
          cur.el.style.left = `${rc.left - base.left}px`;
          cur.el.style.top = `${rc.top - base.top}px`;
          cur.el.style.transform = '';
          el.append(cur.el);
          flyOut(cur, 'played');
        } else {
          cur.el.remove();
        }
      }
      if (card) {
        const ce = makeCardEl(card);
        slotEls[i].replaceChildren(ce.el);
        sleeveEls[i] = ce;
      } else {
        slotEls[i].innerHTML = slotHint;
        sleeveEls[i] = null;
      }
    });
  };

  const renderMinions = (): void => {
    for (const m of combat.minions) {
      const mEl = minionEls.get(m.uid);
      if (!mEl) continue;
      setText(mEl.querySelector('.mhp')!, m.hp);
      (mEl.querySelector('.mtimer i') as HTMLElement).style.transform = `scaleX(${Math.min(1, m.timer / MINIONS[m.id].interval).toFixed(2)})`;
    }
  };

  const render = (dt: number): void => {
    frameNo++;
    renderMinions();
    renderBar(r.eHp, r.eBlock, combat.enemy);
    renderBar(r.hHp, r.hBlock, combat.hero);
    renderStatuses('enemy', r.eStatus);
    renderStatuses('hero', r.hStatus);
    renderIntent();
    renderEnemyState();
    renderMana();
    renderHeroExtras();
    renderBelt();
    renderSleeve();
    if (!paused && !ended && combat.intro <= 0) {
      beltOffset -= (dt * settings.speed * combat.beltRate() * beltW) / CONFIG.beltTime;
      r.track.style.setProperty('--belt-x', `${Math.round(beltOffset % 26)}px`);
    }
  };

  // ---------------------------------------------------------------- lifecycle
  const STEP = 1 / 60;
  let acc = 0;
  const onResize = (): void => layout();

  return {
    el,
    enter() {
      layout();
      renderSpeed();
      addEventListener('resize', onResize);
      document.addEventListener('visibilitychange', onVisibility);
      render(0);
      const start = (): void => {
        banner(t('combat.fight'));
        setPaused(false);
      };
      if (!settings.seenTutorial) {
        setPaused(true);
        setTimeout(
          () =>
            openHowTo(() => {
              settings.seenTutorial = true;
              saveSettings();
              start();
            }, true),
          350,
        );
      } else {
        start();
      }
    },
    leave() {
      unsub();
      removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    },
    frame(dt) {
      if (!paused && !ended) {
        acc += dt * settings.speed;
        // Fixed-step simulation keeps the engine deterministic regardless of frame rate.
        let steps = 0;
        while (acc >= STEP && steps < 12) {
          combat.tick(STEP);
          acc -= STEP;
          steps++;
        }
        if (steps === 12) acc = 0;
      }
      render(dt);
    },
  };
}
