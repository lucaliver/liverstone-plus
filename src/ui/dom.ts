type Child = Node | string | number | null | undefined | false;
type Attrs = Record<string, unknown>;

/** Tiny hyperscript: `h('div', { class: 'x', onclick: fn }, child…)`. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs | null = null, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'html') el.innerHTML = String(v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
      else if (k === 'style' && typeof v === 'object') {
        // Custom properties (`--x`) only take through setProperty.
        for (const [prop, val] of Object.entries(v as Record<string, string>)) {
          if (prop.startsWith('--')) el.style.setProperty(prop, val);
          else (el.style as unknown as Record<string, string>)[prop] = val;
        }
      } else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T => root.querySelector(sel) as T;

/** Sets text only when it changed (cheap per-frame updates). */
export function setText(el: Element, text: string | number): void {
  const s = String(text);
  if (el.textContent !== s) el.textContent = s;
}

export function setHtml(el: Element, html: string): void {
  if (el.innerHTML !== html) el.innerHTML = html;
}

export function toggle(el: Element, cls: string, on: boolean): void {
  if (el.classList.contains(cls) !== on) el.classList.toggle(cls, on);
}

/** A little longer than an animation, so its last frame is shown before the element is removed or the next step begins. */
export const SLACK_MS = 60;

/** A duration token of the stylesheet (`--dur-fly`) in milliseconds, so what waits for an animation to end waits as long as the CSS plays it. */
/** The production build writes `700ms` as `.7s`: both units are read. */
export const cssMs = (token: string): number => {
  const value = cssColor(token);
  return (Number.parseFloat(value) || 0) * (value.endsWith('ms') ? 1 : 1000);
};

/** A colour token of the stylesheet (`--shield`), so scripts paint with the same inks as the CSS. */
export const cssColor = (token: string): string => getComputedStyle(document.documentElement).getPropertyValue(token).trim();

/** Center of an element in viewport coordinates. */
export function centerOf(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * Calls `fn` on a tap/click and also on a long press (so holding a card does the same as tapping it),
 * without firing twice and without the browser's long-press context menu.
 */
/** How long a press must last to count as "hold to inspect" (shared by every screen). */
export const LONG_PRESS_MS = 350;

export function onPress(el: HTMLElement, fn: () => void, longMs = LONG_PRESS_MS): void {
  let timer = 0;
  let firedLong = false;
  el.addEventListener('pointerdown', () => {
    firedLong = false;
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      firedLong = true;
      fn();
    }, longMs);
  });
  const cancel = (): void => clearTimeout(timer);
  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointerleave', cancel);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('click', () => {
    if (firedLong) return;
    fn();
  });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

/** Different actions for a tap and a long press (the long press never triggers the tap). */
export function onTapOrHold(el: HTMLElement, onTap: () => void, onHold: () => void, longMs = LONG_PRESS_MS): void {
  let timer = 0;
  let held = false;
  el.addEventListener('pointerdown', () => {
    held = false;
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      held = true;
      onHold();
    }, longMs);
  });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) el.addEventListener(ev, () => clearTimeout(timer));
  el.addEventListener('click', () => {
    if (!held) onTap();
  });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

/**
 * Restarts a one-shot CSS animation class on an element (even if it's already running), and drops the class when its
 * own animation ends, so an idle animation it replaced (the enemy's bob) comes back.
 */
export function retrigger(target: Element, cls: string): void {
  target.classList.remove(cls);
  void (target as HTMLElement).offsetWidth;
  target.classList.add(cls);
  const done = (e: Event): void => {
    if (e.target !== target) return;
    target.classList.remove(cls);
    target.removeEventListener('animationend', done);
  };
  target.addEventListener('animationend', done);
}

/** Numbers a list of elements in `--i`, so a CSS animation delay can stagger them (the `.print` grids). */
export function stagger<T extends HTMLElement>(els: T[]): T[] {
  els.forEach((e, i) => {
    e.style.setProperty('--i', String(i));
  });
  return els;
}
