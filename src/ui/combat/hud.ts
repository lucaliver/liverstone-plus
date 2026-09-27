import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { STATUS_ORDER, STATUSES } from '../../data/statuses';
import type { Fighter } from '../../game/combat';
import type { MoveDef, Side } from '../../game/types';
import { icon, INTENT_ICON } from '../art/icons';
import { openInfo } from '../components/modals';
import { h, onPress, setHtml, setText, toggle } from '../dom';
import type { CombatView } from './view';

/** Everything around the cards: HP bars, statuses, the threat bar, mana and hero extras. */
export function createHud(v: CombatView): { render(): void } {
  const { combat, r } = v;
  const statusSig: Record<Side, string> = { hero: '', enemy: '' };
  let lastMove: MoveDef | null = null;
  let lastMaxMana = -1;
  let lastMana = combat.hero.mana;

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

  const showStatus = (side: Side, id: string): void => {
    const def = STATUSES[id];
    const s = combat.fighter(side).statuses[id] ?? { v: 0, t: 0 };
    sfx('tap');
    v.inspect(true);
    const timed = def.kind === 'timed' && s.t < 999;
    // Colour by who benefits: a debuff on the enemy is good news for the player.
    const goodForPlayer = def.good === (side === 'hero');
    openInfo(
      {
        icon: def.icon,
        title: t(`status.${id}`),
        tag: t(side === 'hero' ? 'status.onYou' : 'status.onEnemy'),
        tagCls: goodForPlayer ? 'good' : 'bad',
        desc: t(`status.${id}.d`, { v: s.v }),
        extra: [timed ? t('status.timeLeft', { s: Math.ceil(s.t) }) : def.kind !== 'timed' ? t('status.stacks', { v: s.v }) : ''].filter(Boolean),
        ink: goodForPlayer ? 'good' : 'bad',
      },
      () => v.inspect(false),
    );
  };

  /** Status chips: rebuilt only when the set of statuses changes; values update in place (so presses aren't lost). */
  const renderStatuses = (side: Side, box: HTMLElement): void => {
    const f = combat.fighter(side);
    const list = STATUS_ORDER.filter((id) => f.statuses[id] && (STATUSES[id].kind === 'timed' ? f.statuses[id].t > 0 : f.statuses[id].v > 0));
    const ids = list.join('|');
    if (ids !== statusSig[side]) {
      statusSig[side] = ids;
      box.replaceChildren(
        ...list.map((id) => {
          const def = STATUSES[id];
          const b = h('button', {
            class: `status ${def.good ? 'good' : 'bad'}`,
            'data-status': id,
            html: `${icon(def.icon)}<span></span>`,
            'aria-label': t(`status.${id}`),
          });
          onPress(b, () => showStatus(side, id));
          return b;
        }),
      );
    }
    for (const b of box.children) {
      const id = (b as HTMLElement).dataset.status!;
      const s = f.statuses[id];
      if (!s) continue;
      const sd = STATUSES[id];
      const val = sd.kind !== 'timed' || sd.showStacks ? String(s.v) : s.t > 999 ? '' : `${Math.ceil(s.t)}s`;
      setText(b.querySelector('span')!, val);
    }
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
      v.retrigger(r.intent, 'pop');
      if (m.intent === 'charge') {
        sfx('windup');
        v.toast(`${t(`enemy.${e.def.id}.name`)}: ${t('intent.charge')}`);
      }
    }
    setText(r.intentVal, intentValue(m));
    // Countdown to the special move: its icon and how many main attacks until it comes.
    const special = combat.nextSpecial();
    const isMain = m === e.def.main && !!special;
    const nextSig = isMain && special ? `${special.id}|${e.mainsLeft + 1}` : '';
    if (r.intentNext.dataset.sig !== nextSig) {
      r.intentNext.dataset.sig = nextSig;
      r.intentNext.hidden = !isMain;
      if (isMain && special) {
        r.intentNext.dataset.intent = special.intent;
        r.intentNext.innerHTML = `${icon(INTENT_ICON[special.intent] ?? 'star')}<b>${e.mainsLeft + 1}</b>`;
        r.intentNext.title = `${t('combat.afterAttacks', { n: e.mainsLeft + 1 })} ${t(`move.${special.id}`)}`;
      }
    }
    const p = Math.min(1, e.timer / m.windup);
    r.timer.style.transform = `scaleX(${p.toFixed(3)})`;
    const rate = combat.enemyTimeRate();
    const left = rate > 0 ? Math.max(0, (m.windup - e.timer) / rate) : Infinity;
    // Stunned or frozen: the timer is on hold.
    setHtml(r.intentTime, rate > 0 ? `${left.toFixed(1)}s` : icon('pause'));
    const hostile = !v.state.ended && (m.intent === 'attack' || m.intent === 'charge');
    toggle(r.intent, 'urgent', hostile && left < 1.1);

    // Preview how much HP the hit will take (after Block), and flash the screen edges just before it lands.
    const hs = combat.hero;
    const incoming = hostile ? Math.max(0, combat.intentDamage(m) * (m.hits ?? 1) - hs.block) : 0;
    const shown = incoming > 0 && left < 2.2;
    const lost = Math.min(hs.hp, incoming);
    r.incoming.style.left = `${((hs.hp - lost) / hs.maxHp) * 100}%`;
    r.incoming.style.width = shown ? `${(lost / hs.maxHp) * 100}%` : '0';
    toggle(v.el, 'danger', shown && left < 0.8);
  };

  const renderEnemyState = (): void => {
    toggle(r.enemyArt, 'stunned', combat.has('enemy', 'stun'));
    toggle(r.enemyArt, 'frozen', combat.has('enemy', 'frozen'));
    toggle(r.enemyArt, 'chilled', combat.has('enemy', 'chill'));
    toggle(r.enemyArt, 'enraged', combat.has('enemy', 'haste') || (combat.enemy.halfTriggered && !!combat.enemy.def.onHalf));
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
      if (full && i >= lastMana) v.retrigger(p, 'gain');
    }
    lastMana = hs.mana;
    r.manaNum.innerHTML = `${hs.mana}<small>/${hs.maxMana}</small>`;
  };

  const renderHeroExtras = (): void => {
    const hs = combat.hero;
    // The ability charges with mana: it lights up once the hero can afford it.
    r.ability.style.setProperty('--p', String(Math.min(1, hs.mana / combat.abilityCost())));
    toggle(r.ability, 'ready', combat.abilityReady());
    setText(r.draw, combat.draw.length);
    setText(r.discard, combat.discard.length);
  };

  return {
    render() {
      renderBar(r.eHp, r.eBlock, combat.enemy);
      renderBar(r.hHp, r.hBlock, combat.hero);
      renderStatuses('enemy', r.eStatus);
      renderStatuses('hero', r.hStatus);
      renderIntent();
      renderEnemyState();
      renderMana();
      renderHeroExtras();
    },
  };
}
