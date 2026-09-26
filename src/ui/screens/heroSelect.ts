import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { HERO_LIST } from '../../data/heroes';
import type { HeroId } from '../../game/types';
import type { Screen } from '../app';
import { h } from '../dom';
import { creature } from '../art/creatures';
import { openDeck } from '../components/modals';

const md = (s: string): string => s.replace(/\[(\w+)\]/g, (_, k: string) => `<b class="kw">${t(`kw.${k}`)}</b>`);

export function heroSelectScreen(onStart: (hero: HeroId) => void, onBack: () => void): Screen {
  let selected: HeroId = 'warrior';
  const cards = HERO_LIST.map((hero) => {
    const id = hero.id;
    const card = h(
      'button',
      { class: 'hero-card', style: { '--hero-color': hero.color } as never, 'aria-pressed': String(id === selected) },
      h('div', { class: 'portrait', html: creature(id) }),
      h('h3', null, t(`hero.${id}.name`)),
      h('div', { class: 'htitle' }, t(`hero.${id}.title`)),
      h('div', { class: 'blurb' }, t(`hero.${id}.blurb`)),
      h(
        'div',
        { class: 'hero-stats' },
        h('div', { class: 'stat' }, h('b', null, hero.hp), h('span', null, t('hero.stat.hp'))),
        h('div', { class: 'stat' }, h('b', null, hero.maxMana), h('span', null, t('hero.stat.mana'))),
        h('div', { class: 'stat' }, h('b', null, `${hero.regen}s`), h('span', null, t('hero.stat.regen'))),
      ),
      h('div', { class: 'hero-feature', html: `<strong>${t('hero.passive')}:</strong> ${md(t(`hero.${id}.passive`))}` }),
      h(
        'div',
        { class: 'hero-feature', html: `<strong>${t('hero.ability')} · ${t(`hero.${id}.ability`)}:</strong> ${t(`hero.${id}.abilityDesc`)} <span style="color:var(--muted)">(${t(`hero.${id}.resource`)}: ${t(`hero.${id}.resourceDesc`)})</span>` },
      ),
      h(
        'span',
        {
          class: 'btn small secondary',
          role: 'button',
          style: { gridColumn: '1 / -1', marginTop: '4px' },
          onclick: (e: Event) => {
            e.stopPropagation();
            sfx('tap');
            openDeck(hero.startDeck.map((cid, i) => ({ uid: i + 1, id: cid, up: false })), { title: t('hero.starterDeck') });
          },
        },
        `${t('hero.starterDeck')} (${hero.startDeck.length})`,
      ),
    );
    card.addEventListener('click', () => {
      selected = id;
      sfx('tap');
      cards.forEach((c, i) => c.setAttribute('aria-pressed', String(HERO_LIST[i].id === selected)));
    });
    return card;
  });

  const el = h(
    'div',
    { class: 'screen' },
    h('div', { class: 'bg-dungeon' }),
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center' } },
      h('button', { class: 'icon-btn', 'aria-label': t('common.back'), onclick: () => (sfx('tap'), onBack()), html: '&#8592;' }),
      h('h1', { class: 'h1', style: { flex: '1', margin: '0 44px 0 0' } }, t('hero.select')),
    ),
    h('div', { class: 'hero-list scroll' }, ...cards),
    h('button', { class: 'btn block', onclick: () => (sfx('button'), onStart(selected)) }, t('hero.start')),
  );
  return { el };
}
