import { t } from '../../core/i18n';
import { sfx } from '../../audio/sfx';
import { MODIFIER_LIST } from '../../data/modifiers';
import { chosenMemos, setMemo } from '../../game/meta';
import { openModal } from '../app';
import { icon } from '../art/icons';
import { h } from '../dom';

/** The management memos a hero who has won a full day can pin up for the next run: one switch each. */
export function openMemos(onClose: () => void): void {
  const on = new Set(chosenMemos());
  const rows = MODIFIER_LIST.map((m) => {
    const sw = h('button', { class: 'switch', role: 'switch', 'aria-checked': String(on.has(m.id)), 'aria-label': t(`memo.${m.id}.name`) });
    sw.addEventListener('click', () => {
      const v = !on.has(m.id);
      if (v) on.add(m.id);
      else on.delete(m.id);
      setMemo(m.id, v);
      sw.setAttribute('aria-checked', String(v));
      sfx('tap');
    });
    return h(
      'div',
      { class: 'setting memo' },
      h('span', { class: 'memo-ico', html: icon(m.icon) }),
      h('div', { class: 'memo-text' }, h('b', null, t(`memo.${m.id}.name`)), h('small', null, t(`memo.${m.id}.d`, { n: m.n }))),
      sw,
    );
  });
  openModal({
    title: t('memo.title'),
    body: h('div', null, h('p', { class: 'setting-note' }, t('memo.intro')), ...rows),
    actions: [{ label: t('common.close'), cls: 'secondary' }],
    onClose,
  });
}
