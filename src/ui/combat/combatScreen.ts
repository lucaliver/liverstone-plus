import { t } from '../../core/i18n';
import { endTemporaryMusic, playTemporaryMusic } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { CONFIG, GAME_SPEEDS } from '../../data/config';
import type { Combat } from '../../game/combat';
import type { MoveDef } from '../../game/types';
import type { RunState } from '../../game/run';
import { saveSettings, settings } from '../../game/settings';
import { type ModalHandle, openModal, type Screen } from '../app';
import { type InfoOpts, openDeck, openHowTo, openInfo, openSettings, speedSelector } from '../components/modals';
import { icon, INTENT_ICON } from '../art/icons';
import { bindMoveDetails, enemyTraits, moveEffect, movePattern } from '../components/moveText';
import { h, onPress, onTapOrHold, setText } from '../dom';
import { burst, haptic } from '../fx/fx';
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
/** Pixels between the two rows of a two-row belt. */
const BELT_ROW_GAP = 10;

/** The combat screen: wires the view, HUD, card layer and FX together and owns pause and the game loop. */
export function combatScreen(run: RunState, combat: Combat, cb: CombatCallbacks): Screen {
  const v = createCombatView(run, combat);
  const { el, r, state } = v;
  let pauseModal: ModalHandle | null = null;
  let beltOffset = 0;
  let acc = 0;

  // The fight runs only while no window at all is open (card detail, status info, pause menu…) and Start was pressed.
  const syncPause = (opening = false): void => {
    state.paused = opening || state.waiting || !!document.querySelector('.modal-back');
  };
  v.inspect = syncPause;
  const cards = createCardLayer(v);
  const hud = createHud(v, () => passiveInfo());

  const finish = (result: 'win' | 'lose'): void => {
    if (state.ended) return;
    state.ended = true;
    cards.cancelDrag();
    if (result === 'win') {
      r.enemyArt.classList.add('dead');
      const p = v.enemyPoint();
      burst('gold', p.x, p.y, 40, 1.5);
      v.banner(t('reward.cleared'));
      sfx('victory');
    } else {
      v.banner(t('end.defeat'), true);
      sfx('defeat');
      haptic([60, 60, 120]);
    }
    setTimeout(() => cb.onEnd(combat), 1500);
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
    // Measure the enemy's room once (with the belt size applied) and lock the sprite size.
    requestAnimationFrame(() => {
      // The wrapper is flex: 1 with min-height 0, so its height is the free room, independent of the sprite.
      const size = Math.max(72, Math.min(256, r.enemyWrap.clientHeight));
      el.style.setProperty('--enemy-size', `${size}px`);
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
  const live = { dmg: (m: MoveDef) => combat.intentDamage(m), block: (m: MoveDef) => Math.round((m.block ?? 0) * combat.enemy.dmgScale) };
  /** The move being charged, then the enemy's whole pattern (the next special marked). */
  const moveInfo = (): void => {
    const e = combat.enemy;
    const special = combat.nextSpecial();
    const upcoming = special && e.move === e.def.main ? special : null;
    const sheet = info({
      icon: INTENT_ICON[e.move.intent] ?? 'star',
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
  onPress(r.manaRow, manaInfo);

  const renderSpeed = (): void => setText(r.speed, `${settings.speed}×`);
  r.speed.addEventListener('click', () => {
    const i = GAME_SPEEDS.indexOf(settings.speed as (typeof GAME_SPEEDS)[number]);
    settings.speed = GAME_SPEEDS[(i + 1) % GAME_SPEEDS.length];
    saveSettings();
    renderSpeed();
    sfx('tap');
  });

  const openPause = (): void => {
    if (pauseModal || state.ended) return;
    cards.cancelDrag();
    state.paused = true;
    sfx('button');
    playTemporaryMusic('pause');
    const body = h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
      h('div', { class: 'setting' }, h('span', null, t('settings.speed')), speedSelector(renderSpeed)),
    );
    pauseModal = openModal({
      title: t('combat.paused'),
      body,
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
            openSettings(renderSpeed);
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

  const onVisibility = (): void => {
    if (document.hidden) openPause();
  };
  const onResize = (): void => layout();

  // ------------------------------------------------------------------ loop
  const render = (dt: number): void => {
    state.frameNo++;
    hud.render();
    cards.render();
    if (!state.paused && !state.ended && combat.intro <= 0) {
      beltOffset -= (dt * settings.speed * combat.beltRate() * state.beltW) / CONFIG.beltTime;
      r.track.style.setProperty('--belt-x', `${Math.round(beltOffset % 26)}px`);
    }
  };

  return {
    el,
    enter() {
      layout();
      renderSpeed();
      addEventListener('resize', onResize);
      document.addEventListener('visibilitychange', onVisibility);
      render(0);
      if (combat.enemy.def.tier === 'boss') sfx('siren');
      // The fight waits for Start: meanwhile the player can hold anything to read what it does.
      const startWrap = h(
        'div',
        { class: 'start-wrap' },
        h('button', { class: 'btn cta start-btn js-start', html: `${t('combat.start')}<small>${t('combat.startHint')}</small>` }),
      );
      // Before the fight, the enemy's passives are spelled out above it, so the player knows what they're facing.
      const traits = enemyTraits(combat.enemy.def);
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
        v.banner(t('combat.fight'));
      });
      // Centred on the belt: the enemy, the threat bar and the hero stay readable.
      r.belt.append(startWrap);
      if (!settings.seenTutorial) {
        setTimeout(
          () =>
            openHowTo(() => {
              settings.seenTutorial = true;
              saveSettings();
            }, true),
          350,
        );
      }
    },
    leave() {
      unsubscribe();
      removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    },
    frame(dt) {
      if (!state.paused && !state.ended) {
        acc += dt * settings.speed;
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
