import { t } from '../../core/i18n';
import { endTemporaryMusic, playTemporaryMusic, setMusicTempo } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { CARDS } from '../../data/cards';
import { CONFIG } from '../../data/config';
import type { Combat } from '../../game/combat';
import type { MoveDef } from '../../game/types';
import { clockAt, currentNode, type RunState, totalFloors } from '../../game/run';
import { meetEnemy } from '../../game/meta';
import { saveSettings, settings } from '../../game/settings';
import { type ModalHandle, openModal, type Screen } from '../app';
import { debugButton, type InfoOpts, openDebugMenu, openDeck, openHowTo, openInfo, openSettings, speedRow } from '../components/modals';
import { creature } from '../art/creatures';
import { spriteBox } from '../art/riso';
import { icon } from '../art/icons';
import { coach } from '../components/coach';
import { bindMoveDetails, enemyTraits, moveEffect, moveIcon, movePattern } from '../components/moveText';
import { $, h, onPress, onTapOrHold } from '../dom';
import { burst, haptic, shake } from '../fx/fx';
import { clockText } from '../screens/journey';
import { createCardLayer } from './cardLayer';
import { bindCombatFx } from './combatFx';
import { createHud } from './hud';
import { ABILITY_ICON, createCombatView, PASSIVE_ICON } from './view';

export { ABILITY_ICON } from './view';

export interface CombatCallbacks {
  onEnd: (c: Combat) => void;
  /** Abandon the whole run. */
  onQuit: () => void;
  /** Back to the title keeping the run (this fight restarts on Continue). */
  onMenu: () => void;
}

/** Fixed simulation step: the engine stays deterministic regardless of frame rate. */
const STEP = 1 / 60;
/** How far along the belt (in belt widths) a card with a tip has come when the fight stops to explain it. */
const TIP_POS = 0.25;
/** Largest enemy sprite (px), and how far its drawing may be zoomed in to fill the room. */
const ENEMY_MAX = 256;
const ENEMY_ZOOM = 1.6;
/** Pixels between the two rows of a two-row belt. */
const BELT_ROW_GAP = 10;

/** The combat screen: wires the view, HUD, card layer and FX together and owns pause and the game loop. */
export function combatScreen(run: RunState, combat: Combat, cb: CombatCallbacks): Screen {
  const v = createCombatView(run, combat);
  const { el, r, state } = v;
  let pauseModal: ModalHandle | null = null;
  let beltOffset = 0;
  let lastTempo = 1;
  let acc = 0;

  // The fight runs only while no window at all is open (card detail, status info, pause menu…) and Start was pressed.
  const syncPause = (opening = false): void => {
    state.paused = opening || state.waiting || !!document.querySelector('.modal-back, .coach');
  };
  v.inspect = syncPause;
  const cards = createCardLayer(v);
  const hud = createHud(v, () => passiveInfo());

  /** The time card on the belt: stamped IN as the fight starts (then it leaves), OUT when it's won (it stays). */
  const timeCard = (kind: 'in' | 'out', time: string): void => {
    const card = h(
      'div',
      { class: `timecard ${kind}` },
      h('div', { class: 'tc-head' }, h('b', null, t('combat.timeCard')), h('span', null, t(`hero.${v.heroId}.name`))),
      h('div', { class: 'tc-lines' }),
      h('div', { class: 'tc-stamp' }, t(kind === 'in' ? 'combat.clockIn' : 'combat.clockOut', { time })),
    );
    card.addEventListener('animationend', (e) => {
      if (e.target === card && kind === 'in') card.remove();
    });
    r.belt.append(card);
    sfx('punchClock');
  };

  const finish = (result: 'win' | 'lose'): void => {
    if (state.ended) return;
    state.ended = true;
    cards.cancelDrag();
    const boss = combat.enemy.def.tier === 'boss';
    if (result === 'win') {
      // Death throes (it shakes, bleeds and sinks), then the print comes apart ink by ink. A boss gets stamped first.
      r.enemyArt.classList.add('dead');
      r.eStatus.classList.add('gone');
      const p = v.enemyPoint();
      burst('blood', p.x, p.y, 36, 1.4);
      for (let i = 1; i <= (boss ? 5 : 3); i++) setTimeout(() => burst('blood', p.x + (i % 2 ? -30 : 30), p.y + i * 6, 14), i * 200);
      setTimeout(() => burst('gold', p.x, p.y + 20, 40, 1.5), boss ? 1100 : 700);
      shake('big');
      haptic('kill');
      sfx('enemyDown');
      if (boss) {
        r.enemyArt.classList.add('boss');
        r.enemyArt.append(h('div', { class: 'boss-stamp' }, t('combat.bossDown')));
        sfx('blunt');
      } else v.banner(t('reward.cleared'));
      // Clocking out when the next floor starts (the end of the shift after a boss).
      timeCard('out', clockText(clockAt(run, { ...currentNode(run), floor: currentNode(run).floor + 1 })));
      sfx(boss ? 'bossVictory' : 'victory');
    } else {
      // Fired: the payslip on the end screen says the rest.
      sfx('defeat');
      haptic('defeat');
    }
    // A win waits for the enemy to finish dying (longer for a boss).
    setTimeout(() => cb.onEnd(combat), result === 'lose' ? 1500 : boss ? 3000 : 2200);
  };
  const unsubscribe = bindCombatFx(v, cards, finish);

  // ------------------------------------------------------------------ layout
  const layout = (): void => {
    state.beltW = r.belt.clientWidth || el.clientWidth;
    // Cards follow the belt width, but shrink on short screens so the layout always fits (more with two rows).
    const cw = Math.round(Math.min(state.beltW * CONFIG.cardWidth, el.clientHeight * (combat.beltRows > 1 ? 0.092 : 0.118)));
    state.cardW = cw;
    state.rowH = Math.round(cw * 1.4) + BELT_ROW_GAP;
    el.style.setProperty('--cw-belt', `${cw}px`);
    el.style.setProperty('--belt-row-h', `${state.rowH}px`);
    // Measure the enemy's room once (with the belt size applied) and lock the sprite size. The wrapper is flex: 1 with
    // min-height 0, so its box is the free room, independent of the sprite; the enemy stands lower, on its pixel shadow.
    requestAnimationFrame(() => {
      const wrap = r.enemyWrap.getBoundingClientRect();
      const shade = $('.shade', el).getBoundingClientRect();
      const ground = shade.top + shade.height / 2;
      const size = Math.max(72, Math.min(ENEMY_MAX, ground - wrap.top));
      // The drawing, not its square, fills the room: zoomed in (a little at most), centred, its feet on the ground.
      const [x0, y0, x1, y1] = spriteBox(combat.enemy.def.art);
      const k = Math.min(ENEMY_ZOOM, 1 / (y1 - y0), wrap.width / size / (x1 - x0));
      el.style.setProperty('--enemy-size', `${size}px`);
      el.style.setProperty('--enemy-drop', `${ground - wrap.bottom}px`);
      r.enemyArt.style.setProperty('--k', String(k));
      r.enemyArt.style.setProperty('--cx', String((x0 + x1) / 2));
      r.enemyArt.style.setProperty('--by', String(y1));
    });
  };

  // ------------------------------------------------------------------ controls
  // ------------------------------------------------------------------ inspectables (hold to learn)
  const info = (opts: InfoOpts): ModalHandle => {
    sfx('tap');
    v.inspect(true);
    return openInfo(opts, () => v.inspect(false));
  };
  const abilityInfo = (): void =>
    void info({
      icon: ABILITY_ICON[v.heroId],
      title: t(`hero.${v.heroId}.ability`),
      tag: t('hero.tag.active'),
      tagCls: 'active',
      desc: t(`hero.${v.heroId}.abilityShort`),
      extra: [t('hero.abilityCost', { n: combat.abilityCost() })],
    });
  const passiveInfo = (): void =>
    void info({
      icon: PASSIVE_ICON[v.heroId],
      title: t(`hero.${v.heroId}.passiveName`),
      tag: t('hero.tag.passive'),
      desc: t(`hero.${v.heroId}.passiveShort`),
    });
  // Live values: floor scaling, enemy Strength, Weak and Vulnerable, exactly as the threat bar shows them.
  const live = {
    dmg: (m: MoveDef) => combat.intentDamage(m),
    block: (m: MoveDef) => Math.round((m.block ?? 0) * combat.enemy.dmgScale),
    heal: (m: MoveDef) => Math.round((m.heal ?? 0) * combat.enemy.dmgScale),
  };
  /** The move being charged, then the enemy's whole pattern (the next special marked). */
  const moveInfo = (): void => {
    const e = combat.enemy;
    const special = combat.nextSpecial();
    const upcoming = special && e.move === e.def.main ? special : null;
    const sheet = info({
      icon: moveIcon(e.move),
      title: t(`move.${e.move.id}`),
      tag: t(`enemy.${e.def.id}.name`),
      tagCls: 'bad',
      desc: moveEffect(e.move, true, live) || t(`intent.${e.move.intent}`),
      extra: [movePattern(e.def, live, { now: e.move, next: upcoming })],
      ink: 'bad',
    });
    bindMoveDetails(sheet.el);
  };
  const manaInfo = (): void => void info({ icon: 'crystal', title: t('common.mana'), desc: t('howto.mana.d') });
  /** Every card in this fight that isn't gone for good: draw pile, belt, sleeve and discard pile (curses included). */
  const deckInfo = (): void => {
    sfx('tap');
    v.inspect(true);
    const inPlay = [...combat.draw, ...combat.belt.map((b) => b.card), ...combat.sleeve.filter((c) => c !== null), ...combat.discard];
    openDeck(inPlay, { title: t('combat.deck'), onClose: () => v.inspect(false) });
  };

  onTapOrHold(
    r.ability,
    () => {
      if (state.waiting) return abilityInfo();
      if (state.paused || state.ended) return;
      if (!combat.useAbility()) {
        sfx('error');
        v.toast(t('hero.abilityCost', { n: combat.abilityCost() }));
      }
    },
    abilityInfo,
  );
  onPress(r.portrait, deckInfo);
  onPress(r.intent, moveInfo);
  // The weak spot answers on touch-down, not on release: it only stays up for a couple of seconds.
  r.weakSpot.addEventListener('pointerdown', () => {
    if (state.paused || state.waiting || state.ended || !combat.hitWeakSpot()) return;
    haptic('hit');
  });
  // The mana bar explains itself only on a hold (it's right under the thumb while playing).
  onTapOrHold(r.manaRow, () => {}, manaInfo);

  const openPause = (): void => {
    if (pauseModal || state.ended) return;
    cards.cancelDrag();
    state.paused = true;
    sfx('button');
    haptic('tap');
    playTemporaryMusic('pause');
    pauseModal = openModal({
      title: t('combat.paused'),
      body: speedRow(),
      actions: [
        { label: t('combat.resume'), icon: 'play' },
        {
          label: t('menu.howTo'),
          icon: 'question',
          cls: 'secondary',
          onClick: () => {
            openHowTo();
            return false;
          },
        },
        {
          label: t('menu.settings'),
          icon: 'gear',
          cls: 'secondary',
          onClick: () => {
            openSettings();
            return false;
          },
        },
        {
          label: t('combat.toMenu'),
          icon: 'home',
          cls: 'secondary',
          onClick: () => {
            openModal({
              body: t('combat.toMenuConfirm'),
              actions: [
                { label: t('common.confirm'), onClick: () => cb.onMenu() },
                { label: t('common.cancel'), cls: 'secondary' },
              ],
            });
            return false;
          },
        },
        {
          label: t('combat.quit'),
          icon: 'door',
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
        syncPause();
        endTemporaryMusic();
      },
    });
  };
  r.pause.addEventListener('click', openPause);

  /** Temporary debug tool: cheats for the fight. The fight waits while the window is open. */
  const openDebug = (): void => {
    if (state.ended) return;
    cards.cancelDrag();
    v.inspect(true);
    const kill = (amount: number): void => void combat.damage('hero', 'enemy', amount, { raw: true, ignoreBlock: true }, 'hero');
    openDebugMenu(
      t('debug.fightMenu'),
      [
        {
          label: t('debug.kill'),
          icon: 'skull',
          // Some enemies get up again (Golden Parachute): hit until it stays down.
          run: () => {
            for (let i = 0; i < 3 && !combat.result; i++) kill(combat.enemy.hp + combat.enemy.block);
          },
        },
        { label: t('debug.half'), icon: 'crack', run: () => kill(combat.enemy.hp - Math.floor(combat.enemy.maxHp / 2)) },
        { label: t('debug.stun'), icon: 'stars', run: () => combat.applyStatus('enemy', 'stun', 1, 10) },
        { label: t('debug.heal'), icon: 'heart', run: () => void combat.heal('hero', combat.hero.maxHp) },
        { label: t('debug.mana'), icon: 'crystal', run: () => combat.gainMana(combat.hero.maxMana) },
        { label: t('debug.crystals'), icon: 'crystalSlot', run: () => combat.addManaCrystals(2) },
        { label: t('debug.lose'), icon: 'ko', run: () => combat.loseHp(combat.hero.hp) },
      ],
      () => v.inspect(false),
    );
  };
  el.append(debugButton(t('debug.menu'), openDebug));

  /** The very first fight: before Start, a tour of the board, one part at a time. */
  const firstFightTour = (): void => {
    // Clock in only comes up as the tour's last step.
    const startWrap = $('.start-wrap', el);
    startWrap.hidden = true;
    coach(
      el,
      [
        { target: [r.enemyWrap, r.eHp], text: t('coach.enemy') },
        { target: r.intent, text: t('coach.threat') },
        { target: $('.hero-row', el), text: t('coach.hero') },
        { target: r.belt, text: t('coach.belt') },
        { target: r.manaRow, text: t('coach.mana') },
        { target: r.sleeve, text: t('coach.sleeve') },
        { target: r.ability, text: t('coach.ability') },
        { target: $('.js-start', el), text: t('coach.start'), before: () => (startWrap.hidden = false) },
      ],
      () => {
        settings.seenTutorial = true;
        saveSettings();
      },
    );
  };

  /** A card with a tip, ridden far enough onto the belt to be seen: the first time ever, the fight stops to explain it. */
  const checkTip = (): void => {
    const b = combat.belt.find((x) => CARDS[x.card.id].tip && x.pos >= TIP_POS && !settings.seenTips.includes(x.card.id));
    const target = b && cards.elementOf(b.card.uid);
    if (!b || !target) return;
    settings.seenTips.push(b.card.id);
    saveSettings();
    cards.cancelDrag();
    coach(el, [{ target, text: t(`card.${b.card.id}.tip`) }], () => syncPause());
    syncPause();
  };

  const onVisibility = (): void => {
    if (document.hidden) openPause();
  };
  const onResize = (): void => layout();

  // ------------------------------------------------------------------ loop
  const render = (dt: number): void => {
    state.frameNo++;
    // The music follows the belt a little: faster while it rushes, slower while it drags.
    const tempo = Math.max(CONFIG.beltSlow, 1 + (combat.beltBoost() - 1) * CONFIG.musicFollowsBelt);
    if (tempo !== lastTempo) {
      lastTempo = tempo;
      setMusicTempo(tempo);
    }
    hud.render();
    cards.render();
    if (!state.paused && !state.ended && state.stop <= 0 && combat.intro <= 0) {
      beltOffset -= (dt * settings.speed * combat.beltRate() * state.beltW) / CONFIG.beltTime;
      r.track.style.setProperty('--belt-x', `${Math.round(beltOffset % 26)}px`);
    }
  };

  return {
    el,
    enter() {
      layout();
      // The way in: seen from the corridor, an office double door with the enemy's portrait and name on the glass;
      // three knocks, the latch, the doors swing open on their hinges onto the lit room, and we walk through into the fight.
      const node = currentNode(run);
      const door = h(
        'div',
        { class: 'office-door', 'aria-hidden': 'true' },
        h(
          'div',
          { class: 'door-frame' },
          h('div', { class: 'door-light' }),
          h(
            'div',
            { class: 'door-half l' },
            h(
              'div',
              { class: 'door-glass' },
              h('div', { class: 'door-portrait', html: creature(combat.enemy.def.art) }),
              h('b', null, t(`enemy.${combat.enemy.def.id}.name`)),
              h('span', null, t('common.floorOf', { a: node.act, n: node.floor, total: totalFloors(run) })),
            ),
          ),
          h('div', { class: 'door-half r' }, h('div', { class: 'door-glass' })),
        ),
      );
      door.addEventListener('animationend', (e) => {
        if (e.target !== door) return;
        door.remove();
        if (!settings.seenTutorial) firstFightTour();
      });
      el.append(door);
      sfx('door');
      addEventListener('resize', onResize);
      document.addEventListener('visibilitychange', onVisibility);
      render(0);
      meetEnemy(combat.enemy.def.id);
      if (combat.enemy.def.tier === 'boss') sfx('siren');
      // The fight waits for Start: meanwhile the player can hold anything to read what it does.
      const startWrap = h(
        'div',
        { class: 'start-wrap' },
        h('button', { class: 'btn cta start-btn js-start', html: `${t('combat.start')}<small>${t('combat.startHint')}</small>` }),
      );
      // Before the fight, the enemy's passives are spelled out above it, so the player knows what they're facing.
      const traits = enemyTraits(combat.enemy.def, !combat.enemy.def.halfSecret);
      const traitsEl = traits.length
        ? h(
            'div',
            { class: 'foe-traits' },
            ...traits.map((x) => h('div', { class: 'trait', html: `${icon(x.icon)}<p>${x.name ? `<b>${x.name}</b>` : ''}${x.desc}</p>` })),
          )
        : null;
      if (traitsEl) r.stage.append(traitsEl);
      startWrap.querySelector('button')!.addEventListener('click', () => {
        startWrap.remove();
        traitsEl?.remove();
        state.waiting = false;
        syncPause();
        sfx('button');
        haptic('tap');
        v.banner(t('combat.fight'));
        timeCard('in', clockText(clockAt(run, currentNode(run))));
      });
      // Centred on the belt: the enemy, the threat bar and the hero stay readable.
      r.belt.append(startWrap);
    },
    leave() {
      setMusicTempo(1);
      unsubscribe();
      removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    },
    frame(dt) {
      if (state.stop > 0) state.stop -= dt;
      else if (!state.paused && !state.ended) {
        acc += dt * settings.speed;
        let steps = 0;
        while (acc >= STEP && steps < 12) {
          combat.tick(STEP);
          acc -= STEP;
          steps++;
        }
        if (steps === 12) acc = 0;
        checkTip();
      }
      render(dt);
    },
  };
}
