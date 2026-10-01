import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { haptic } from '../fx/fx';
import { HERO_LIST, starterCards } from '../../data/heroes';
import { chosenMemos, heroFresh, heroUnlocked, markHeroSeen, memosOpen } from '../../game/meta';
import type { HeroDef, HeroId, HeroUnlock } from '../../game/types';
import type { Screen } from '../app';
import { creature } from '../art/creatures';
import { icon } from '../art/icons';
import { heroFeatures } from '../components/heroSheet';
import { dropLetters, motes } from '../components/decor';
import { openMemos } from '../components/memos';
import { openDeck, openStatInfo } from '../components/modals';
import { h, onPress, retrigger, stagger } from '../dom';

const unlockText = (u: HeroUnlock): string =>
  'finishRun' in u ? t('hero.unlock.finishRun', { hero: t(`hero.${u.finishRun}.name`) }) : t('hero.unlock.reachBoss', { n: u.reachBoss });

function slide(hero: HeroDef, index: number): HTMLElement {
  const id = hero.id;
  const locked = !heroUnlocked(id);
  // A locked hero shows as a dark silhouette with a padlock and, right under it, how to unlock it; its stats stay
  // readable, its features stay a secret.
  const badge =
    locked && hero.unlock
      ? `<button class="hero-lock" aria-label="${unlockText(hero.unlock)}">${icon('lock')}</button><p class="hero-unlock" aria-hidden="true">${unlockText(hero.unlock)}</p>`
      : heroFresh(id)
        ? `<div class="hero-new">${t('hero.new')}</div>`
        : '';
  const el = h(
    'section',
    {
      class: `hero-slide ${locked ? 'locked' : ''}`,
      'data-hero': id,
      style: { '--hero-ink': hero.ink } as never,
      'aria-roledescription': 'slide',
      'aria-label': t(`hero.${id}.name`),
    },
    h('div', {
      class: 'hero-stage',
      html: `${motes(8)}<div class="pedestal"></div><div class="hero-sprite">${creature(id)}</div><div class="hero-num">${String(index + 1).padStart(2, '0')}</div>${badge}`,
    }),
    h('h2', { class: 'hero-name', 'aria-label': t(`hero.${id}.name`), html: dropLetters(t(`hero.${id}.name`)) }),
    h('p', { class: 'hero-job' }, t(`hero.${id}.job`)),
    h(
      'div',
      { class: 'hero-stats' },
      ...stagger([
        h('button', { class: 'stat hp', 'data-stat': 'hp', html: `${icon('heart')}${hero.hp}` }),
        h('button', { class: 'stat mana', 'data-stat': 'mana', html: `${icon('crystal')}${hero.maxMana}` }),
        h('button', {
          class: 'stat sleeve',
          'data-stat': 'sleeve',
          'aria-label': t('hero.sleeve', { n: hero.sleeve }),
          html: `${icon('hand')}${hero.sleeve}`,
        }),
        h('button', { class: 'stat deck', 'aria-label': t('hero.starterDeck'), html: `${icon('cards')}${hero.startDeck.length}` }),
      ]),
    ),
    heroFeatures(hero, locked),
  );
  // Every stat explains itself on a tap or a hold; the deck opens the starter deck.
  for (const stat of ['hp', 'mana', 'sleeve'] as const)
    onPress(el.querySelector<HTMLElement>(`[data-stat='${stat}']`)!, () => openStatInfo(stat, hero.sleeve));
  onPress(el.querySelector<HTMLElement>('.stat.deck')!, () => {
    sfx('tap');
    openDeck(
      starterCards(hero).map((c, i) => ({ uid: i + 1, ...c })),
      { title: t('hero.starterDeck') },
    );
  });
  // Tapping the padlock rattles its chains.
  const lock = el.querySelector<HTMLElement>('.hero-lock');
  lock?.addEventListener('click', () => {
    sfx('chains');
    haptic('locked');
    retrigger(lock, 'rattle');
  });
  return el;
}

/** Game-style hero select: one hero per screen, swipe or use the arrows; the hero in view is the one chosen. */
export function heroSelectScreen(onStart: (hero: HeroId) => void, onBack: () => void, first?: HeroId): Screen {
  let index = Math.max(
    0,
    HERO_LIST.findIndex((hd) => hd.id === first),
  );
  const slides = HERO_LIST.map(slide);
  const track = h('div', { class: 'hero-track', role: 'region', 'aria-label': t('hero.select') }, ...slides);
  const dots = HERO_LIST.map((hd, i) =>
    h('button', {
      class: `hero-dot ${heroUnlocked(hd.id) ? '' : 'locked'}`,
      'data-hero': hd.id,
      'aria-label': t(`hero.${hd.id}.name`),
      onclick: () => goTo(i),
    }),
  );
  const prev = h('button', { class: 'hero-arrow prev', 'aria-label': t('common.back'), html: icon('left'), onclick: () => goTo(index - 1) });
  const next = h('button', { class: 'hero-arrow next', 'aria-label': t('common.next'), html: icon('left'), onclick: () => goTo(index + 1) });

  const startBtn = h(
    'button',
    {
      class: 'btn block',
      onclick: () => {
        if (!heroUnlocked(HERO_LIST[index].id)) return;
        sfx('button');
        haptic('tap');
        onStart(HERO_LIST[index].id);
      },
    },
    t('hero.start'),
  );

  // A hero who has won a full day can run under management memos: the button shows how many are pinned up.
  const memoBtn = h('button', {
    class: 'icon-btn memo-btn',
    'aria-label': t('memo.title'),
    onclick: () => {
      sfx('tap');
      openMemos(sync);
    },
  });

  const sync = (): void => {
    const hero = HERO_LIST[index];
    const memos = memosOpen(hero.id);
    memoBtn.hidden = !memos;
    memoBtn.innerHTML = `${icon('clipboard')}${memos && chosenMemos().length ? `<b>${chosenMemos().length}</b>` : ''}`;
    el.dataset.hero = hero.id;
    el.style.setProperty('--hero-ink', hero.ink);
    const locked = !heroUnlocked(hero.id);
    startBtn.disabled = locked;
    startBtn.textContent = locked ? t('hero.locked') : t('hero.start');
    if (!locked) markHeroSeen(hero.id);
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
        'aria-label': t('menu.home'),
        onclick: () => {
          sfx('tap');
          onBack();
        },
        html: icon('home'),
      }),
      h('h1', { class: 'h1' }, t('hero.select')),
    ),
    h('div', { class: 'hero-carousel' }, track, prev, next),
    h('div', { class: 'hero-dots' }, ...dots),
    h('div', { class: 'hero-start' }, memoBtn, startBtn),
  );
  sync();
  return {
    el,
    enter() {
      track.scrollTo({ left: index * track.clientWidth, behavior: 'instant' });
    },
  };
}
