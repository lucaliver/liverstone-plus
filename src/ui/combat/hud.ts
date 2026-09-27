import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { STATUS_ORDER, STATUSES } from '../../data/statuses';
import type { Fighter } from '../../game/combat';
import type { MoveDef, Side } from '../../game/types';
import { icon, INTENT_ICON } from '../art/icons';
import { h, setHtml, setText, toggle } from '../dom';
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
        const b = h('button', {
          class: `status ${def.good ? 'good' : 'bad'}`,
          html: `${icon(def.icon)}<span>${vals[i]}</span>`,
          'aria-label': t(`status.${id}`),
        });
        b.addEventListener('click', () => v.toast(`${t(`status.${id}`)}: ${t(`status.${id}.d`, { v: s.v })}`));
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
      v.retrigger(r.intent, 'pop');
      if (m.intent === 'charge') {
        sfx('windup');
        v.toast(`${t(`enemy.${e.def.id}.name`)}: ${t('intent.charge')}`);
      }
    }
    setText(r.intentVal, intentValue(m));
    const p = Math.min(1, e.timer / m.windup);
    r.timer.style.transform = `scaleX(${p.toFixed(3)})`;
    const rate = combat.enemyTimeRate();
    const left = rate > 0 ? Math.max(0, (m.windup - e.timer) / rate) : Infinity;
    setText(r.intentTime, rate > 0 ? `${left.toFixed(1)}s` : '||');
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
    const k = hs.resource / hs.resourceMax;
    r.res.style.transform = `scaleX(${k})`;
    setText(r.resLbl, `${t(`hero.${v.heroId}.resource`)} ${hs.resource}/${hs.resourceMax}`);
    r.ability.style.setProperty('--p', String(k));
    toggle(r.ability, 'ready', combat.abilityReady());
    toggle(r.weave, 'off', hs.weave <= 0);
    if (hs.weave > 0) setText(r.weave, t('combat.weave', { n: hs.weave }));
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
