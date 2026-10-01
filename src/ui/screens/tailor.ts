import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { CONFIG } from '../../data/config';
import { RELICS } from '../../data/relics';
import { gainRelic, hasRelic, tailorVest, type RunState } from '../../game/run';
import type { Screen } from '../app';
import { h } from '../dom';
import { icon } from '../art/icons';
import { relicArt } from '../art/relics';
import { playHealing, HEAL_ANIM_MS } from './rest';
import { CARD_SHOW_MS, playRelic } from '../components/cardShow';
import { closeRoom, roomOption, roomScene } from '../components/room';
import { runHud } from './journey';

/** The relic the Tailor sells. */
const PANTS = 'cargoPants';

/** Tailor: cargo pants (a relic: another sleeve slot) or the uniform let out (max HP). */
export function tailorScreen(run: RunState, onDone: () => void): Screen {
  const pants = RELICS[PANTS];
  const owned = hasRelic(run, PANTS);
  const el = h(
    'div',
    { class: 'screen' },
    runHud(run),
    h('h1', { class: 'h1', style: { marginTop: '12px' } }, t('tailor.title')),
    h('p', { class: 'sub' }, t('tailor.desc')),
    roomScene('tailor'),
    h(
      'div',
      { class: 'rest-options' },
      roomOption(relicArt(PANTS), t(`relic.${PANTS}.name`), owned ? t('tailor.owned') : t(`relic.${PANTS}.d`, { n: pants.n }), owned, () => {
        sfx('tap');
        gainRelic(run, PANTS);
        playRelic(el, PANTS);
        closeRoom(el, onDone, CARD_SHOW_MS);
      }),
      roomOption(icon('heart'), t('tailor.vest'), t('tailor.vestDesc', { n: CONFIG.tailorMaxHp }), false, () => {
        tailorVest(run);
        playHealing(el, CONFIG.tailorMaxHp, t('tailor.fitted'));
        closeRoom(el, onDone, HEAL_ANIM_MS);
      }),
    ),
  );
  return { el };
}
