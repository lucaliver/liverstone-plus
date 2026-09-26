import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { HERO_LIST } from '../../data/heroes';
import type { HeroId } from '../../game/types';
import type { Screen } from '../app';
import { h } from '../dom';
import { creature } from '../art/creatures';
import { icon } from '../art/icons';
import { openDeck } from '../components/modals';
import { cardText } from '../components/cardView';
import { ABILITY_ICON } from './combat';

const PASSIVE_ICON: Record<string, string> = { warrior: 'shield', mage: 'bolt2', necromancer: 'drop' };

const feature = (ic: string, name: string, kind: 'passive' | 'active' | 'special', desc: string): HTMLElement =>
  h('div', {
    class: 'hero-feature',
    html: `${icon(ic)}<div><b>${name} <span class="ftag ${kind}">${t(`hero.tag.${kind}`)}</span></b>${desc}</div>`,
  });

export function heroSelectScreen(onStart: (hero: HeroId) => void, onBack: () => void): Screen {
  let selected: HeroId = 'warrior';
  const cards = HERO_LIST.map((hero) => {
    const id = hero.id;
    const card = h(
      'button',
      { class: 'hero-card', 'data-hero': id, 'aria-pressed': String(id === selected), 'aria-label': t(`hero.${id}.name`) },
      h('div', { class: 'portrait', html: creature(id) }),
      h(
        'div',
        { class: 'who' },
        h('h3', null, t(`hero.${id}.name`)),
        h(
          'div',
          { class: 'hero-stats' },
          h('span', { class: 'stat hp', html: `${icon('heart')}${hero.hp}` }),
          h('span', { class: 'stat mana', html: `${icon('crystal')}${hero.maxMana}` }),
          h(
            'span',
            {
              class: 'stat',
              role: 'button',
              'aria-label': t('hero.starterDeck'),
              onclick: (e: Event) => {
                e.stopPropagation();
                sfx('tap');
                openDeck(hero.startDeck.map((cid, i) => ({ uid: i + 1, id: cid, up: false })), { title: t('hero.starterDeck') });
              },
              html: `${icon('cards')}${hero.startDeck.length}`,
            },
          ),
        ),
      ),
      feature(PASSIVE_ICON[id], t(`hero.${id}.passiveName`), 'passive', t(`hero.${id}.passiveShort`)),
      feature(ABILITY_ICON[id], t(`hero.${id}.ability`), 'active', t(`hero.${id}.abilityShort`)),
      feature('star', t(`card.${hero.special}.name`), 'special', cardText({ uid: -1, id: hero.special, up: false })),
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
    h(
      'div',
      { class: 'topline' },
      h('button', { class: 'icon-btn', 'aria-label': t('common.back'), onclick: () => (sfx('tap'), onBack()), html: icon('left') }),
      h('h1', { class: 'h1' }, t('hero.select')),
    ),
    h('div', { class: 'hero-list scroll' }, ...cards),
    h('button', { class: 'btn block', onclick: () => (sfx('button'), onStart(selected)) }, t('hero.start')),
  );
  return { el };
}
