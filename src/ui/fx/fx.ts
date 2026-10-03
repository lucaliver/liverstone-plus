import { settings } from '../../game/settings';
import { cssColor } from '../dom';

/** Canvas particle bursts + DOM floating numbers + screen shake + haptics. */
interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  g: number;
  shape: 'dot' | 'spark' | 'ring';
  /** How far a ring grows beyond its starting size. */
  reach?: number;
}

let canvas: HTMLCanvasElement;
let g: CanvasRenderingContext2D;
let layer: HTMLElement;
let shakeTarget: HTMLElement;
const ps: P[] = [];
let dpr = 1;

export function initFx(root: HTMLElement): void {
  canvas = document.createElement('canvas');
  canvas.className = 'fx-canvas';
  layer = document.createElement('div');
  layer.className = 'fx-layer';
  root.append(canvas, layer);
  shakeTarget = root;
  g = canvas.getContext('2d')!;
  const resize = (): void => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
  };
  resize();
  addEventListener('resize', resize);
  // A pattern still running when the page goes to the background stops.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && 'vibrate' in navigator) navigator.vibrate(0);
  });
  requestAnimationFrame(loop);
}

/** Particle colours by effect, taken from the stylesheet's tokens the first time they are needed. */
let palettes: Record<string, string[]> | null = null;
function paletteOf(kind: string): string[] {
  if (!palettes) {
    const [Y, P, B, K, red, green, purple, muted, shield, shieldHi, ice] = [
      '--y',
      '--p',
      '--b',
      '--k',
      '--red',
      '--green',
      '--purple',
      '--muted',
      '--shield',
      '--shield-hi',
      '--ice',
    ].map(cssColor);
    palettes = {
      slash: [K, P, Y],
      blunt: [K, Y],
      claw: [P, K],
      fire: [Y, P, red],
      burn: [Y, P],
      ice: [B, ice],
      arcane: [P, B],
      heal: [P, Y],
      block: [shield, shieldHi, K],
      mana: [B, P],
      blood: [P, K],
      poison: [green, Y],
      thorns: [green, K],
      curse: [K, P, purple],
      ash: [K, muted, P],
      gold: [Y, P, B],
      hit: [K, Y],
    };
  }
  return palettes[kind] ?? palettes.hit;
}

/** Chunky square "ink" pixels, snapped to a 4px grid; the ring around them grows `reach` px. */
export function burst(kind: string, x: number, y: number, n = 16, spread = 1, reach = 70): void {
  if (settings.reduceMotion) n = Math.ceil(n / 3);
  const pal = paletteOf(kind);
  const up = kind === 'heal' || kind === 'mana' || kind === 'fire' || kind === 'burn' || kind === 'ash';
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = (80 + Math.random() * 240) * spread;
    ps.push({
      x,
      y,
      vx: Math.cos(a) * sp * (up ? 0.4 : 1),
      vy: Math.sin(a) * sp * (up ? 0.3 : 1) - (up ? 140 + Math.random() * 100 : 0),
      life: 0,
      max: 0.3 + Math.random() * 0.4,
      size: 4 * (1 + ((Math.random() * 3) | 0)),
      color: pal[(Math.random() * pal.length) | 0],
      g: up ? -80 : 520,
      shape: 'dot',
    });
  }
  if (kind !== 'heal' && kind !== 'mana') ps.push({ x, y, vx: 0, vy: 0, life: 0, max: 0.24, size: 12, color: pal[0], g: 0, shape: 'ring', reach });
}

let last = performance.now();
let dirty = false;
function loop(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // Nothing to draw: skip the full-screen clear (it only needs to happen once after the last particle).
  if (!ps.length && !dirty) {
    requestAnimationFrame(loop);
    return;
  }
  dirty = ps.length > 0;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    p.life += dt;
    if (p.life >= p.max) {
      ps.splice(i, 1);
      continue;
    }
    p.vx *= 1 - 2.5 * dt;
    p.vy = p.vy * (1 - 2.5 * dt) + p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const k = 1 - p.life / p.max;
    g.fillStyle = g.strokeStyle = p.color;
    const sx = Math.round(p.x / 4) * 4;
    const sy = Math.round(p.y / 4) * 4;
    if (p.shape === 'ring') {
      // Expanding square outline, stepped.
      const r = Math.round((p.size + (1 - k) * (p.reach ?? 70)) / 4) * 4;
      g.lineWidth = 4;
      g.strokeRect(sx - r, sy - r, r * 2, r * 2);
    } else {
      const s = Math.max(4, Math.round((p.size * (0.4 + k * 0.6)) / 4) * 4);
      g.fillRect(sx - s / 2, sy - s / 2, s, s);
    }
  }
  requestAnimationFrame(loop);
}

/** Floating combat text at a viewport point. */
export function floatText(x: number, y: number, text: string, cls: string, delay = 0, html = false): HTMLElement {
  const el = document.createElement('div');
  el.className = `floater ${cls}`;
  if (html) el.innerHTML = text;
  else el.textContent = text;
  el.style.top = `${y}px`;
  if (delay) el.style.animationDelay = `${delay}ms`;
  el.addEventListener('animationend', () => el.remove());
  layer.append(el);
  // Keep long texts on screen: the floater is centred on x, so clamp it by half its (untransformed) width.
  const bounds = layer.getBoundingClientRect();
  const half = el.offsetWidth / 2 + 8;
  const jitter = x + (Math.random() * 30 - 15);
  el.style.left = `${Math.min(Math.max(jitter, bounds.left + half), bounds.right - half)}px`;
  return el;
}

/** Jolts the combat stage (never the whole screen, which would make the layout jump). */
export function shake(strength: 'small' | 'big' = 'small'): void {
  if (settings.reduceMotion) return;
  const target = shakeTarget.querySelector<HTMLElement>('.screen:not(.leaving) .stage .enemy-wrap');
  if (!target) return;
  target.classList.remove('shake-small', 'shake-big');
  void target.offsetWidth;
  target.classList.add(`shake-${strength}`);
}

/**
 * Vibration patterns (ms): short and sparse, so a strong one still means something. Buttons and picks get a tick,
 * hits a knock, big moments a pattern.
 */
const HAPTICS = {
  tap: 8,
  play: 10,
  stash: [6, 40, 6],
  belt: 6,
  error: 15,
  hexTap: 8,
  /** The mop over rust: a weak, half-hearted buzz. */
  scrub: 4,
  hit: 25,
  heavy: 60,
  alarm: [30, 60, 30],
  ability: [20, 40, 20],
  locked: [10, 30, 10, 30, 10],
  kill: [40, 60, 40],
  defeat: [60, 60, 120],
} satisfies Record<string, number | number[]>;
export type HapticId = keyof typeof HAPTICS;

let lastHaptic = 0;
/** Vibrates (if the player allows it, the page is visible and the player has already touched it; never twice within 50ms). */
export function haptic(id: HapticId): void {
  if (!settings.haptics || !('vibrate' in navigator) || document.hidden) return;
  // Before the first gesture browsers block (and warn about) vibration.
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  const now = performance.now();
  if (now - lastHaptic < 50) return;
  lastHaptic = now;
  try {
    navigator.vibrate(HAPTICS[id]);
  } catch {
    /* unsupported */
  }
}
