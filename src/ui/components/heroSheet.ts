import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { HEROES } from '../../data/heroes';
import { RELICS, relicSum } from '../../data/relics';
import type { RunState } from '../../game/run';
import type { HeroDef } from '../../game/types';
import { openModal } from '../app';
import { creature } from '../art/creatures';
import { icon } from '../art/icons';
import { relicArt } from '../art/relics';
import { ABILITY_ICON, PASSIVE_ICON } from '../combat/view';
import { h } from '../dom';
import { UNKNOWN } from './cardView';
import { openDeck } from './modals';

const feature = (ic: string, name: string, kind: 'passive' | 'active', desc: string): HTMLElement =>
  h('div', {
    class: 'hero-feature',
    html: `${icon(ic)}<div><b>${name} <span class="ftag ${kind}">${t(`hero.tag.${kind}`)}</span></b>${desc}</div>`,
  });

/**
 * Passive and ability of a hero (hero select and the in-run hero sheet). `hidden`: a locked hero
 * shows only what kind of features it has, their names and texts replaced by question marks.
 */
export function heroFeatures(hero: HeroDef, hidden = false): HTMLElement {
  const id = hero.id;
  const say = (text: string): string => (hidden ? UNKNOWN : text);
  return h(
    'div',
    { class: 'hero-features' },
    feature(PASSIVE_ICON[id], say(t(`hero.${id}.passiveName`)), 'passive', say(t(`hero.${id}.passiveShort`))),
    feature(
      ABILITY_ICON[id],
      say(t(`hero.${id}.ability`)),
      'active',
      `${say(t(`hero.${id}.abilityShort`))} <span class="fcost">${icon('crystal')}${hero.ability.cost}</span>`,
    ),
  );
}

/** The hero's sheet during a run: portrait, current stats, deck, passive and ability. */
export function openHeroSheet(run: RunState): void {
  const hero = HEROES[run.hero];
  sfx('tap');
  const features = heroFeatures(hero);
  const sleeve = hero.sleeve + relicSum(run.relics, 'sleeve');
  const mana = hero.maxMana + relicSum(run.relics, 'maxMana');
  const relics = run.relics.map((id) =>
    h('div', {
      class: 'hero-feature',
      html: `${relicArt(id)}<div><b>${t(`relic.${id}.name`)}</b>${t(`relic.${id}.d`, { n: RELICS[id].n })}</div>`,
    }),
  );
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
      h('span', { class: 'stat mana', html: `${icon('crystal')}${mana}` }),
      h('span', { class: 'stat sleeve', 'aria-label': t('hero.sleeve', { n: sleeve }), html: `${icon('hand')}${sleeve}` }),
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
    ...(relics.length ? [h('h4', { class: 'sheet-relics' }, t('hero.relics')), h('div', { class: 'hero-features' }, ...relics)] : []),
  );
  openModal({ body, actions: [{ label: t('common.close'), cls: 'secondary' }] });
}
