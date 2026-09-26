import { h } from './dom';

export interface Screen {
  el: HTMLElement;
  enter?(): void;
  leave?(): void;
  /** Called every animation frame while the screen is active. */
  frame?(dt: number): void;
}

let root: HTMLElement;
let current: Screen | null = null;

export function initApp(el: HTMLElement): void {
  root = el;
  let last = performance.now();
  const loop = (now: number): void => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    current?.frame?.(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

export function appRoot(): HTMLElement {
  return root;
}

export function show(screen: Screen): void {
  const prev = current;
  if (prev) {
    prev.leave?.();
    prev.el.classList.add('leaving');
    setTimeout(() => prev.el.remove(), 250);
  }
  // Close any modal left open by the previous screen.
  root.querySelectorAll('.modal-back').forEach((m) => m.remove());
  current = screen;
  root.append(screen.el);
  screen.enter?.();
}

export interface ModalAction {
  label: string;
  cls?: string;
  /** Return false to keep the modal open. */
  onClick?: () => void | boolean;
}

export interface ModalOpts {
  title?: string;
  body?: Node | string;
  actions?: ModalAction[];
  /** Tapping the backdrop closes the modal (defaults to true). */
  dismissable?: boolean;
  onClose?: () => void;
  cls?: string;
}

export interface ModalHandle {
  el: HTMLElement;
  close(): void;
}

export function openModal(opts: ModalOpts): ModalHandle {
  let closed = false;
  const close = (): void => {
    if (closed) return;
    closed = true;
    back.remove();
    document.removeEventListener('keydown', onKey);
    opts.onClose?.();
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && opts.dismissable !== false) close();
  };
  const body = typeof opts.body === 'string' ? h('p', null, opts.body) : opts.body;
  const modal = h(
    'div',
    { class: `modal ${opts.cls ?? ''}`, role: 'dialog', 'aria-modal': 'true' },
    opts.title ? h('h2', null, opts.title) : null,
    body ? h('div', { class: 'body scroll' }, body) : null,
    opts.actions?.length
      ? h(
          'div',
          { class: 'actions' },
          ...opts.actions.map((a) =>
            h('button', { class: `btn ${a.cls ?? ''}`, onclick: () => (a.onClick?.() === false ? undefined : close()) }, a.label),
          ),
        )
      : null,
  );
  const back = h('div', { class: 'modal-back' }, modal);
  back.addEventListener('pointerdown', (e) => {
    if (e.target === back && opts.dismissable !== false) close();
  });
  document.addEventListener('keydown', onKey);
  root.append(back);
  (modal.querySelector('button') as HTMLElement | null)?.focus({ preventScroll: true });
  return { el: modal, close };
}

export function confirmModal(text: string, confirmLabel: string, onConfirm: () => void, cancelLabel: string): void {
  openModal({
    body: text,
    actions: [
      { label: confirmLabel, cls: 'danger', onClick: onConfirm },
      { label: cancelLabel, cls: 'secondary' },
    ],
  });
}
