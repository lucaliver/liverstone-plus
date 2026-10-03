import { t } from '../../core/i18n';
import { type SoundId, sfx, voice } from '../../audio/sfx';
import { CARDS } from '../../data/cards';
import { CONFIG } from '../../data/config';
import { openModal } from '../app';
import { HEXES } from '../../data/hexes';
import { STATUSES } from '../../data/statuses';
import { discover } from '../../game/meta';
import { saveSettings, settings } from '../../game/settings';
import type { CombatEvent } from '../../game/types';
import { creature } from '../art/creatures';
import { icon } from '../art/icons';
import { centerOf, h } from '../dom';
import { burst, floatText, haptic, shake } from '../fx/fx';
import { keywordText } from '../components/cardView';
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

/** How long an enemy's speech bubble stays up (ms) before the note spelling out its half-HP trait (keep equal to `.speech` in CSS). */
const SPEECH_MS = 3000;
/** A passive's bubble (Paradigm Shift) is a short quip: its note waits for it the same way. */
const QUIP_MS = 1500;

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

  /** An enemy's speech bubble over the stage (one at a time); it lasts `ms`, then goes by itself. */
  const speak = (text: string, ms = SPEECH_MS): void => {
    r.stage.querySelector('.speech')?.remove();
    clearInterval(typing);
    // The line is typed out letter by letter (the unsaid part keeps the bubble's size) while the enemy's voice reads it, in a pitch of its own.
    const said = h('span', null);
    const unsaid = h('span', { class: 'unsaid' }, text);
    const bubble = h('div', { class: 'speech', style: { animationDuration: `${ms}ms` }, 'aria-label': text }, said, unsaid);
    bubble.addEventListener('animationend', () => bubble.remove());
    r.stage.append(bubble);
    const letters = [...text];
    const gap = Math.min(CONFIG.voiceMs, (ms * 0.7) / Math.max(1, letters.length));
    const [lo, hi] = CONFIG.voicePitch;
    const id = v.combat.enemy.def.id;
    voice(text, lo + ([...id].reduce((sum, c) => sum + c.charCodeAt(0) * 7, 0) % (hi - lo)), gap);
    let n = 0;
    typing = window.setInterval(() => {
      n++;
      said.textContent = letters.slice(0, n).join('');
      unsaid.textContent = letters.slice(n).join('');
      if (n >= letters.length) clearInterval(typing);
    }, gap);
  };
  let typing = 0;

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
        // On the Block indicator, where the number will show.
        const chip = e.target === 'hero' ? r.hBlock : r.eBlock;
        const p = centerOf(chip);
        floatText(p.x, p.y - 10, `+${e.amount}`, 'block');
        burst('block', p.x, p.y, 10, 0.5, 24);
        sfx('block');
        v.retrigger(chip, 'pop');
        break;
      }
      case 'status': {
        const def = STATUSES[e.id];
        const p = v.pointOf(e.target);
        floatText(p.x, p.y - 36, t(`status.${e.id}`), 'status').dataset.tone = def.tone;
        sfx(def.good ? 'status' : 'debuff');
        if (def.burst) burst(def.burst.kind, p.x, p.y, def.burst.n);
        break;
      }
      case 'text': {
        const p = v.pointOf(e.target);
        floatText(p.x, p.y - 50, t(e.key), 'text');
        break;
      }
      case 'cue': {
        const cue = STATUSES[e.id].cue;
        if (cue) sfx(cue);
        break;
      }
      case 'relic': {
        const p = v.pointOf('hero');
        floatText(p.x, p.y - 50, t(`relic.${e.id}.name`), 'status good');
        sfx('status');
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
          v.retrigger(r.portrait, 'gain');
          floatText(p.x, p.y - 34, `${icon('addCard')}+1`, 'deck', 0, true);
          sfx('deckAdd');
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
      case 'infected': {
        const el = cards.elementOf(e.card.uid);
        if (el) v.retrigger(el, 'hex-in');
        sfx('curse');
        if (!hexHinted.has('virus')) {
          hexHinted.add('virus');
          v.toast(t('combat.virus'));
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
        // The enemy speaks first (some have a line of their own, in a speech bubble), then a short note spells out
        // what its half-HP trait just did (the belt speeds up, it hits harder…).
        const def = v.combat.enemy.def;
        if (def.halfSpeech) speak(t(`enemy.${def.id}.speech`));
        v.toast(keywordText(t(`enemy.${def.id}.half`)), true, def.halfSpeech ? SPEECH_MS : 0);
        // Its true face: the sprite changes for good.
        const art = v.combat.enemy.def.halfArt;
        const riso = r.enemyArt.querySelector('.riso');
        if (art && riso) riso.outerHTML = creature(art);
        burst('blood', p.x, p.y, 30, 1.4);
        sfx('enrage');
        sfx('klaxon');
        haptic('alarm');
        shake('big');
        break;
      }
      case 'speech':
        speak(t(e.key), QUIP_MS);
        break;
      case 'rust':
        // Said once, ever: the Rusty Belt chip carries the rest.
        if (!settings.seenTips.includes('rust')) {
          settings.seenTips.push('rust');
          saveSettings();
          v.toast(t('combat.rust'));
        }
        break;
      case 'weakSpot':
        r.weakSpot.style.setProperty('--u', String(e.x));
        r.weakSpot.style.setProperty('--v', String(e.y));
        v.retrigger(r.weakSpot, 'appear');
        sfx('weakSpot');
        break;
      case 'popup':
        // A card held in a finger when the window opens is let go.
        if (e.phase === 'open') {
          cards.cancelDrag();
          sfx('popup');
          haptic('alarm');
        } else if (e.phase === 'close') sfx('status');
        break;
      case 'beltPinned':
        sfx('stash');
        haptic('stash');
        break;
      case 'beltReversed':
        // Every card keeps its place on screen and heads the other way (the engine mirrors the positions).
        v.state.ltr = !v.state.ltr;
        r.belt.classList.toggle('ltr', v.state.ltr);
        // The turn comes half a second into the bubble; the note follows once it has gone.
        v.toast(t('combat.beltReversed'), false, QUIP_MS - CONFIG.beltTurnPause * 1000);
        sfx('machinery');
        break;
      case 'lowerSink':
        // The mana bar rides down to the bottom edge; the sleeve and the ability go with the rest (see `.sunk` in combat-belt.css).
        cards.cancelDrag();
        v.el.classList.add('sunk');
        speak(t(`enemy.${v.combat.enemy.def.id}.speech`));
        sfx('machinery');
        break;
      case 'beltDead':
        // The belt stops for good; the crank knob comes up in the action row (see `.belt-dead`).
        cards.cancelDrag();
        v.el.classList.add('belt-dead');
        speak(t(`enemy.${v.combat.enemy.def.id}.speech`));
        sfx('machinery');
        break;
      case 'rowAdded':
        v.el.classList.add('deep');
        r.belt.style.setProperty('--rows', String(v.combat.beltRows));
        sfx('machinery');
        break;
      case 'rowsOpen':
      case 'rowsClose':
        r.belt.classList.remove('row-opening', 'row-closing');
        r.belt.classList.add(e.type === 'rowsOpen' ? 'row-opening' : 'row-closing');
        sfx('machinery');
        break;
      case 'beg': {
        // The fight waits on the answer.
        sfx('defeat');
        v.inspect(true);
        openModal({
          title: t('beg.title'),
          body: h('p', null, t('beg.body')),
          dismissable: false,
          actions: [
            { label: t('beg.yes'), icon: 'heart', cls: 'cta', onClick: () => v.combat.beg(true) },
            { label: t('beg.no'), cls: 'secondary', onClick: () => v.combat.beg(false) },
          ],
          onClose: () => v.inspect(false),
        });
        break;
      }
      case 'begged': {
        const p = v.pointOf('hero');
        floatText(p.x, p.y - 50, t('beg.done'), 'status good');
        burst('gold', p.x, p.y, 30, 1.3);
        sfx('levelUp');
        haptic('ability');
        break;
      }
      case 'end':
        onEnd(e.result);
        break;
      default:
        break;
    }
  };
  const unsubscribe = v.combat.events.on(onEvent);
  return () => {
    clearInterval(typing);
    unsubscribe();
  };
}
