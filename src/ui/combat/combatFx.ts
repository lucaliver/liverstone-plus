import { t } from '../../core/i18n';
import { type SoundId, sfx } from '../../audio/sfx';
import { CARDS } from '../../data/cards';
import { HEXES } from '../../data/hexes';
import { STATUSES } from '../../data/statuses';
import { discover } from '../../game/meta';
import { settings } from '../../game/settings';
import type { CombatEvent } from '../../game/types';
import { icon } from '../art/icons';
import { centerOf, h } from '../dom';
import { burst, floatText, haptic, shake } from '../fx/fx';
import type { CardLayer } from './cardLayer';
import type { CombatView } from './view';

const SOUND_FOR_KIND: Record<string, SoundId> = {
  slash: 'slash',
  blunt: 'blunt',
  fire: 'fire',
  ice: 'ice',
  arcane: 'arcane',
  thorns: 'slash',
  claw: 'enemyHit',
};

/** Where the "-N" of each hit of a multi-hit lands around the enemy's centre (px). */
const HIT_OFFSETS: [number, number][] = [
  [0, 0],
  [-44, -30],
  [44, 26],
  [-40, 34],
  [40, -34],
];

/** Hit-stop (s) by damage dealt: the fight freezes for a beat on heavy hits, longer on huge ones. */
function hitStopFor(amount: number, target: 'hero' | 'enemy'): number {
  if (amount >= 30) return 0.14;
  return amount >= (target === 'hero' ? 12 : 15) ? 0.08 : 0;
}

/** Turns combat engine events into feedback: floating text, particles, sounds, haptics and small animations. */
export function bindCombatFx(v: CombatView, cards: CardLayer, onEnd: (result: 'win' | 'lose') => void): () => void {
  const { r } = v;

  /** Hexes (and Inflation) already explained this fight (one hint each). */
  const hexHinted = new Set<string>();

  const onEvent = (e: CombatEvent): void => {
    switch (e.type) {
      case 'damage': {
        const p = v.pointOf(e.target);
        const delay = e.hitIndex * 90;
        if (e.amount > 0) {
          const big = e.amount >= 15;
          // Enemy damage is printed on the middle of the sprite (the blood splat keeps it readable);
          // the hits of a multi-hit spread around it so they don't cover each other.
          const [ox, oy] = HIT_OFFSETS[e.hitIndex % HIT_OFFSETS.length];
          const mid = centerOf(r.enemyArt);
          const fx = e.target === 'enemy' ? mid.x + ox : p.x;
          const fy = e.target === 'enemy' ? mid.y + oy : p.y - 10;
          // The splat takes the colour of the damage: blood, poison (green) or burn (dark orange).
          const splat = e.kind === 'poison' || e.kind === 'burn' ? `k-${e.kind}` : '';
          floatText(fx, fy, `-${e.amount}`, `${e.target === 'hero' ? 'hurt' : 'dmg'} ${big ? 'big' : ''} ${splat}`, delay);
          setTimeout(() => burst(e.kind, p.x, p.y, e.source === 'dot' ? 8 : big ? 30 : 18), delay);
        }
        const stop = e.source === 'dot' || e.hitIndex > 0 ? 0 : hitStopFor(e.amount, e.target);
        if (stop) {
          v.state.stop = Math.max(v.state.stop, stop);
          if (!settings.reduceMotion) v.retrigger(r.stage, 'impact');
        }
        if (e.blocked > 0) {
          floatText(p.x + 30, p.y - 20, `${icon('shield')}${e.blocked}`, 'blocked', delay, true);
          sfx('blocked');
        }
        if (e.target === 'enemy') {
          if (e.amount > 0) v.retrigger(r.enemyArt, 'hit');
          if (e.source !== 'dot') sfx(SOUND_FOR_KIND[e.kind] ?? 'blunt');
          if (e.amount >= 15) shake('small');
        } else if (e.source !== 'dot' || e.amount > 0) {
          if (e.amount > 0) {
            v.retrigger(r.portrait, 'hurt');
            shake(e.amount >= 12 ? 'big' : 'small');
            haptic(e.amount >= 12 ? 'heavy' : 'hit');
          }
          sfx('enemyHit');
        }
        break;
      }
      case 'heal': {
        const p = v.pointOf(e.target);
        floatText(p.x, p.y, `+${e.amount}`, 'heal');
        burst('heal', p.x, p.y, 16);
        sfx('heal');
        break;
      }
      case 'block': {
        const p = v.pointOf(e.target);
        floatText(p.x, p.y - 10, `+${e.amount}`, 'block');
        burst('block', p.x, p.y, 10);
        sfx('block');
        v.retrigger(e.target === 'hero' ? r.hBlock : r.eBlock, 'pop');
        break;
      }
      case 'status': {
        const def = STATUSES[e.id];
        const p = v.pointOf(e.target);
        floatText(p.x, p.y - 36, t(`status.${e.id}`), `status ${def.good ? 'good' : 'bad'}`);
        sfx(def.good ? 'status' : 'debuff');
        if (e.id === 'burn') burst('fire', p.x, p.y, 10);
        if (e.id === 'chill' || e.id === 'frozen') burst('ice', p.x, p.y, 14);
        break;
      }
      case 'text': {
        const p = v.pointOf(e.target);
        floatText(p.x, p.y - 50, t(e.key), 'text');
        break;
      }
      case 'cantAfford': {
        const cardEl = cards.elementOf(e.card.uid);
        if (cardEl) v.retrigger(cardEl, 'nope');
        v.retrigger(r.manaRow, 'flash');
        v.toast(t('combat.noMana'));
        sfx('error');
        haptic('error');
        break;
      }
      case 'cardPlayed':
        cards.markRemoval(e.card.uid, 'played');
        sfx('cardPlay');
        haptic('play');
        break;
      case 'cardExpired':
        cards.markRemoval(e.card.uid, 'expired');
        sfx('cardExpire');
        break;
      case 'cardStolen': {
        cards.markRemoval(e.card.uid, 'stolen');
        const p = v.enemyPoint();
        floatText(p.x, p.y - 60, t('combat.stolen'), 'text');
        sfx('steal');
        break;
      }
      case 'cardStashed':
        cards.markRemoval(e.card.uid, 'stashed');
        sfx('stash');
        haptic('stash');
        break;
      case 'cardSpawn':
        sfx('cardSpawn');
        break;
      case 'cardAdded': {
        discover([e.card.id]);
        // Curses come from the enemy; anything else is the hero's own doing.
        if (CARDS[e.card.id].type === 'curse') {
          const p = v.enemyPoint();
          burst('curse', p.x, p.y, 20);
          sfx('curse');
        } else {
          const p = v.heroPoint();
          burst('mana', p.x, p.y, 10);
          sfx('stash');
        }
        break;
      }
      case 'cardDiscarded':
        cards.markRemoval(e.card.uid, 'expired');
        break;
      case 'hexed': {
        const el = cards.elementOf(e.card.uid);
        if (el) v.retrigger(el, 'hex-in');
        sfx('curse');
        const id = e.card.hex?.id;
        if (id && !hexHinted.has(id)) {
          hexHinted.add(id);
          v.toast(t(`hex.${id}.d`, { n: HEXES[id].taps }));
        }
        break;
      }
      case 'inflated': {
        const el = cards.elementOf(e.card.uid);
        if (el) v.retrigger(el, 'hex-in');
        if (!hexHinted.has('inflation')) {
          hexHinted.add('inflation');
          v.toast(t('combat.inflation'));
        }
        break;
      }
      case 'absorbed': {
        const p = v.enemyPoint();
        floatText(p.x, p.y - 30, `+${e.amount}`, 'copied');
        sfx('stash');
        break;
      }
      case 'hexTap': {
        const el = cards.elementOf(e.card.uid);
        if (el) {
          v.retrigger(el, 'hex-hit');
          const p = centerOf(el);
          burst('block', p.x, p.y, 5);
        }
        sfx('blunt');
        haptic('hexTap');
        break;
      }
      case 'hexBroken':
        sfx('stash');
        break;
      case 'reshuffle':
        sfx('reshuffle');
        break;
      case 'enemyAct':
        if (e.move.dmg) v.retrigger(r.enemyArt, 'lunge');
        else v.retrigger(r.enemyArt, 'cast');
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
        v.retrigger(r.manaRow, 'flash');
        break;
      case 'ability': {
        const f = h('div', { class: 'ability-flash' });
        f.addEventListener('animationend', () => f.remove());
        v.el.append(f);
        v.banner(t(`hero.${v.heroId}.ability`));
        sfx('ability');
        haptic('ability');
        break;
      }
      case 'enrage': {
        const p = v.enemyPoint();
        floatText(p.x, p.y - 70, t('combat.enraged'), 'status bad');
        // Spell out what its half-HP trait just did (the belt speeds up, it hits harder…).
        v.toast(t(`enemy.${v.combat.enemy.def.id}.half`), true);
        burst('blood', p.x, p.y, 30, 1.4);
        sfx('enrage');
        shake('big');
        break;
      }
      case 'end':
        onEnd(e.result);
        break;
      default:
        break;
    }
  };
  return v.combat.events.on(onEvent);
}
