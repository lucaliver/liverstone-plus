import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { HERO_LIST } from '../../data/heroes';
import type { HeroDef, HeroId } from '../../game/types';
import type { Screen } from '../app';
import { creature } from '../art/creatures';
import { icon } from '../art/icons';
import { ABILITY_ICON } from '../combat/view';
import { cardText } from '../components/cardView';
import { motes } from '../components/decor';
import { openDeck } from '../components/modals';
import { h } from '../dom';

const PASSIVE_ICON: Record<string, string> = { warrior: 'shield', mage: 'bolt2', necromancer: 'drop' };

const feature = (ic: string, name: string, kind: 'passive' | 'active' | 'special', desc: string): HTMLElement =>
  h('div', {
    class: 'hero-feature',
    html: `${icon(ic)}<div><b>${name} <span class="ftag ${kind}">${t(`hero.tag.${kind}`)}</span></b>${desc}</div>`,
  });

function slide(hero: HeroDef, index: number): HTMLElement {
  const id = hero.id;
  return h(
    'section',
    { class: 'hero-slide', 'data-hero': id, 'aria-roledescription': 'slide', 'aria-label': t(`hero.${id}.name`) },
    h('div', {
      class: 'hero-stage',
      html: `${motes(8)}<div class="pedestal"></div><div class="hero-sprite">${creature(id)}</div><div class="hero-num">${String(index + 1).padStart(2, '0')}</div>`,
    }),
    h('h2', { class: 'hero-name' }, t(`hero.${id}.name`)),
    h(
      'div',
      { class: 'hero-stats' },
      h('span', { class: 'stat hp', html: `${icon('heart')}${hero.hp}` }),
      h('span', { class: 'stat mana', html: `${icon('crystal')}${hero.maxMana}` }),
      h('button', {
        class: 'stat deck',
        'aria-label': t('hero.starterDeck'),
        onclick: () => {
          sfx('tap');
          openDeck(
            hero.startDeck.map((cid, i) => ({ uid: i + 1, id: cid, up: false })),
            { title: t('hero.starterDeck') },
          );
        },
        html: `${icon('cards')}${hero.startDeck.length}`,
      }),
    ),
    h(
      'div',
      { class: 'hero-features' },
      feature(PASSIVE_ICON[id], t(`hero.${id}.passiveName`), 'passive', t(`hero.${id}.passiveShort`)),
      feature(ABILITY_ICON[id], t(`hero.${id}.ability`), 'active', t(`hero.${id}.abilityShort`)),
      feature('star', t(`card.${hero.special}.name`), 'special', cardText({ uid: -1, id: hero.special, up: false })),
    ),
  );
}

/** Game-style hero select: one hero per screen, swipe or use the arrows; the hero in view is the one chosen. */
export function heroSelectScreen(onStart: (hero: HeroId) => void, onBack: () => void): Screen {
  let index = 0;
  const slides = HERO_LIST.map(slide);
  const track = h('div', { class: 'hero-track', role: 'region', 'aria-label': t('hero.select') }, ...slides);
  const dots = HERO_LIST.map((hd, i) =>
    h('button', {
      class: 'hero-dot',
      'data-hero': hd.id,
      'aria-label': t(`hero.${hd.id}.name`),
      onclick: () => goTo(i),
    }),
  );
  const prev = h('button', { class: 'hero-arrow prev', 'aria-label': t('common.back'), html: icon('left'), onclick: () => goTo(index - 1) });
  const next = h('button', { class: 'hero-arrow next', 'aria-label': t('common.next'), html: icon('left'), onclick: () => goTo(index + 1) });

  const sync = (): void => {
    const hero = HERO_LIST[index];
    el.dataset.hero = hero.id;
    slides.forEach((s, i) => {
      s.classList.toggle('current', i === index);
    });
    dots.forEach((d, i) => {
      d.setAttribute('aria-current', String(i === index));
    });
    prev.disabled = index === 0;
    next.disabled = index === HERO_LIST.length - 1;
  };

  function goTo(i: number): void {
    const target = Math.max(0, Math.min(HERO_LIST.length - 1, i));
    track.scrollTo({ left: target * track.clientWidth, behavior: 'smooth' });
  }

  // The hero in view is the selection; update as soon as the carousel settles on a new one.
  track.addEventListener(
    'scroll',
    () => {
      const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      if (i === index || i < 0 || i >= HERO_LIST.length) return;
      index = i;
      sfx('tap');
      sync();
    },
    { passive: true },
  );

  const el = h(
    'div',
    { class: 'screen hero-select' },
    h(
      'div',
      { class: 'topline' },
      h('button', {
        class: 'icon-btn',
        'aria-label': t('common.back'),
        onclick: () => {
          sfx('tap');
          onBack();
        },
        html: icon('left'),
      }),
      h('h1', { class: 'h1' }, t('hero.select')),
    ),
    h('div', { class: 'hero-carousel' }, track, prev, next),
    h('div', { class: 'hero-dots' }, ...dots),
    h(
      'button',
      {
        class: 'btn block',
        onclick: () => {
          sfx('button');
          onStart(HERO_LIST[index].id);
        },
      },
      t('hero.start'),
    ),
  );
  sync();
  return { el };
}
