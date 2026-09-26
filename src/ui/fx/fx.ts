import { settings } from '../../game/settings';

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
  requestAnimationFrame(loop);
}

const PALETTES: Record<string, string[]> = {
  slash: ['#ffffff', '#ffe6b0', '#ffd27a'],
  blunt: ['#ffffff', '#ffd8a0', '#c9a36a'],
  claw: ['#ff6a5a', '#ffb0a0', '#ffffff'],
  fire: ['#ffdf6a', '#ff8a2a', '#ff4a1a'],
  burn: ['#ffb347', '#ff6a1a'],
  ice: ['#e6fbff', '#8fe0ff', '#5ab0ff'],
  arcane: ['#f0d8ff', '#b77bff', '#6ab8ff'],
  heal: ['#b6ffb0', '#5ae07a', '#ffffff'],
  block: ['#d6ecff', '#7ab8ff'],
  mana: ['#b8d4ff', '#4f8dff'],
  blood: ['#ff5a5a', '#a01a2a'],
  poison: ['#b6ff5a', '#4fbf3a'],
  thorns: ['#b6ff8a', '#ffffff'],
  curse: ['#b35aff', '#4a1a6a', '#8aff6a'],
  gold: ['#ffe08a', '#ffb73a'],
  hit: ['#ffffff', '#ffd27a'],
};

export function burst(kind: string, x: number, y: number, n = 18, spread = 1): void {
  if (settings.reduceMotion) n = Math.ceil(n / 3);
  const pal = PALETTES[kind] ?? PALETTES.hit;
  const up = kind === 'heal' || kind === 'mana' || kind === 'fire' || kind === 'burn';
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = (60 + Math.random() * 260) * spread;
    ps.push({
      x,
      y,
      vx: Math.cos(a) * sp * (up ? 0.4 : 1),
      vy: Math.sin(a) * sp * (up ? 0.3 : 1) - (up ? 120 + Math.random() * 120 : 0),
      life: 0,
      max: 0.35 + Math.random() * 0.45,
      size: 1.5 + Math.random() * 3.5,
      color: pal[(Math.random() * pal.length) | 0],
      g: up ? -60 : 420,
      shape: kind === 'slash' || kind === 'claw' || kind === 'ice' ? 'spark' : 'dot',
    });
  }
  if (kind !== 'heal' && kind !== 'mana') ps.push({ x, y, vx: 0, vy: 0, life: 0, max: 0.3, size: 10, color: pal[0], g: 0, shape: 'ring' });
}

let last = performance.now();
function loop(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.globalCompositeOperation = 'lighter';
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
    g.globalAlpha = k;
    g.fillStyle = g.strokeStyle = p.color;
    if (p.shape === 'ring') {
      g.lineWidth = 3 * k;
      g.beginPath();
      g.arc(p.x, p.y, p.size + (1 - k) * 60, 0, Math.PI * 2);
      g.stroke();
    } else if (p.shape === 'spark') {
      g.lineWidth = p.size * 0.7;
      g.beginPath();
      g.moveTo(p.x, p.y);
      g.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
      g.stroke();
    } else {
      g.beginPath();
      g.arc(p.x, p.y, p.size * k + 0.5, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
  requestAnimationFrame(loop);
}

/** Floating combat text at a viewport point. */
export function floatText(x: number, y: number, text: string, cls: string, delay = 0): void {
  const el = document.createElement('div');
  el.className = `floater ${cls}`;
  el.textContent = text;
  el.style.left = `${x + (Math.random() * 30 - 15)}px`;
  el.style.top = `${y}px`;
  if (delay) el.style.animationDelay = `${delay}ms`;
  el.addEventListener('animationend', () => el.remove());
  layer.append(el);
}

export function shake(strength: 'small' | 'big' = 'small'): void {
  if (settings.reduceMotion) return;
  shakeTarget.classList.remove('shake-small', 'shake-big');
  void shakeTarget.offsetWidth;
  shakeTarget.classList.add(`shake-${strength}`);
}

export function haptic(ms: number | number[]): void {
  if (settings.haptics && 'vibrate' in navigator) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* unsupported */
    }
  }
}
