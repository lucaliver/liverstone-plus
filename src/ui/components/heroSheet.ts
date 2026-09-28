import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { HEROES } from '../../data/heroes';
import type { RunState } from '../../game/run';
import type { HeroDef } from '../../game/types';
import { openModal } from '../app';
import { creature } from '../art/creatures';
import { icon } from '../art/icons';
import { ABILITY_ICON, PASSIVE_ICON } from '../combat/view';
import { h } from '../dom';
import { cardText } from './cardView';
import { openDeck } from './modals';

const feature = (ic: string, name: string, kind: 'passive' | 'active' | 'special', desc: string): HTMLElement =>
  h('div', {
    class: 'hero-feature',
    html: `${icon(ic)}<div><b>${name} <span class="ftag ${kind}">${t(`hero.tag.${kind}`)}</span></b>${desc}</div>`,
  });

/** Passive, ability and once-per-run special of a hero (hero select and the in-run hero sheet). */
export function heroFeatures(hero: HeroDef): HTMLElement {
  const id = hero.id;
  return h(
    'div',
    { class: 'hero-features' },
    feature(PASSIVE_ICON[id], t(`hero.${id}.passiveName`), 'passive', t(`hero.${id}.passiveShort`)),
    feature(
      ABILITY_ICON[id],
      t(`hero.${id}.ability`),
      'active',
      `${t(`hero.${id}.abilityShort`)} <span class="fcost">${icon('crystal')}${hero.ability.cost}</span>`,
    ),
    hero.special ? feature('star', t(`card.${hero.special}.name`), 'special', cardText({ uid: -1, id: hero.special, up: false })) : null,
  );
}

/** The hero's sheet during a run: portrait, current stats, deck, passive, ability and special (marked once used). */
export function openHeroSheet(run: RunState): void {
  const hero = HEROES[run.hero];
  sfx('tap');
  const features = heroFeatures(hero);
  if (hero.special && run.specialUsed) features.lastElementChild?.classList.add('used');
  const body = h(
    'div',
    { class: 'hero-sheet' },
    h('div', {
      class: 'sheet-head',
      html: `<div class="sheet-art">${creature(hero.id)}</div><div><h3>${t(`hero.${hero.id}.name`)}</h3><p>${t(`hero.${hero.id}.job`)}</p></div>`,
    }),
    h(
      'div',
      { class: 'hero-stats' },
      h('span', { class: 'stat hp', html: `${icon('heart')}${run.hp}/${run.maxHp}` }),
      h('span', { class: 'stat mana', html: `${icon('crystal')}${hero.maxMana}` }),
      h('span', { class: 'stat sleeve', 'aria-label': t('hero.sleeve', { n: hero.sleeve }), html: `${icon('hand')}${hero.sleeve}` }),
      h('button', {
        class: 'stat deck',
        'aria-label': t('common.deck'),
        onclick: () => {
          sfx('tap');
          openDeck(run.deck);
        },
        html: `${icon('cards')}${run.deck.length}`,
      }),
    ),
    features,
  );
  openModal({ body, actions: [{ label: t('common.close'), cls: 'secondary' }] });
}
