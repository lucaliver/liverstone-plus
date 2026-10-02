import { t } from '../../core/i18n';
import type { Screen } from '../app';
import { studioArt } from '../art/rooms';
import { dropLetters } from '../components/decor';
import { h } from '../dom';

/** How long the studio card stays up before the title (a tap skips it). */
const STUDIO_MS = 2600;

/** The developer's card, a beat before the title: the mark pops in, the name drops letter by letter. */
export function studioScreen(onDone: () => void): Screen {
  let timer = 0;
  let done = false;
  const finish = (): void => {
    if (done) return;
    done = true;
    onDone();
  };
  const el = h(
    'div',
    { class: 'screen studio', onclick: finish },
    h('div', { class: 'studio-mark', 'aria-hidden': 'true', html: studioArt() }),
    h('h1', { class: 'studio-name', 'aria-label': `${t('studio.name')} ${t('studio.tag')}`, html: dropLetters(t('studio.name')) }),
    h('p', { class: 'studio-tag' }, t('studio.tag')),
    h('p', { class: 'studio-presents' }, t('studio.presents')),
  );
  return {
    el,
    enter() {
      timer = window.setTimeout(finish, STUDIO_MS);
    },
    leave() {
      clearTimeout(timer);
    },
  };
}
