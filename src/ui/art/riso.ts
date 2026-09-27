/**
 * Riso-pixel renderer.
 *
 * Vector art is rasterised at a low resolution, quantised to a small set of risograph inks
 * (with checkerboard dithering standing in for halftone mid-tones), outlined with a 1px ink edge,
 * then split into one image per ink. The UI stacks those layers with `mix-blend-mode: multiply`
 * and slight offsets, reproducing a misregistered riso print.
 */
import { CREATURES } from './creatures';
import { ICONS } from './icons';

export type Ink = 'Y' | 'P' | 'B' | 'K';
export const INK_ORDER: Ink[] = ['Y', 'P', 'B', 'K'];

export const INK_HEX: Record<Ink, string> = {
  Y: '#ffd900',
  P: '#ff3d9a',
  B: '#1c5fd0',
  K: '#1b1830',
};
const PAPER: [number, number, number] = [246, 240, 228];

const hex = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
const INK_RGB = Object.fromEntries(INK_ORDER.map((k) => [k, hex(INK_HEX[k])])) as Record<Ink, [number, number, number]>;

interface Swatch {
  /** Inks printed on every pixel. */
  full: Ink[];
  /** Inks printed on alternate pixels only (checkerboard halftone). */
  half: Ink[];
  rgb: [number, number, number];
}

function mix(inks: Ink[]): [number, number, number] {
  return inks.reduce<[number, number, number]>(
    (c, k) => [(c[0] * INK_RGB[k][0]) / 255, (c[1] * INK_RGB[k][1]) / 255, (c[2] * INK_RGB[k][2]) / 255],
    [...PAPER],
  );
}

const sw = (full: Ink[], half: Ink[] = []): Swatch => {
  const a = mix(full);
  const b = mix([...full, ...half]);
  return { full, half, rgb: half.length ? (a.map((v, i) => (v + b[i]) / 2) as [number, number, number]) : a };
};

const SWATCHES: Swatch[] = [
  // Solid inks and overprints.
  sw([]),
  sw(['Y']),
  sw(['P']),
  sw(['B']),
  sw(['K']),
  sw(['Y', 'P']),
  sw(['Y', 'B']),
  sw(['P', 'B']),
  sw(['Y', 'P', 'B']),
  sw(['P', 'K']),
  sw(['B', 'K']),
  // Halftones: a light tint of one ink, or a solid ink with a second ink screened over it.
  sw([], ['Y']),
  sw([], ['P']),
  sw([], ['B']),
  sw([], ['K']),
  sw([], ['Y', 'P']),
  sw([], ['P', 'B']),
  sw(['Y'], ['B']),
  sw(['Y'], ['P']),
  sw(['P'], ['B']),
  sw(['B'], ['P']),
  sw(['P'], ['Y']),
  sw(['B'], ['K']),
  sw(['P'], ['K']),
];

function nearest(r: number, g: number, b: number): Swatch {
  let best = SWATCHES[0];
  let bd = Infinity;
  for (const s of SWATCHES) {
    // Weighted RGB distance (cheap perceptual approximation).
    const dr = r - s.rgb[0];
    const dg = g - s.rgb[1];
    const db = b - s.rgb[2];
    // Dithered swatches only win when clearly closer, so sprites stay mostly solid ink.
    const d = (2 * dr * dr + 4 * dg * dg + 3 * db * db) * (s.half.length ? 1.9 : 1);
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return best;
}

export interface Sprite {
  w: number;
  h: number;
  /** Opaque paper-coloured silhouette printed under the inks, so paper areas hide the background. */
  base: string;
  layers: Partial<Record<Ink, string>>;
}

const sprites = new Map<string, Sprite>();
const masks = new Map<string, string>();

function loadSvg(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d', { willReadFrequently: true })!];
}

/** Nearest-neighbour upscale so browsers never smooth the pixels (masks ignore image-rendering). */
function upscale(src: HTMLCanvasElement, k: number): string {
  const [c, g] = canvas(src.width * k, src.height * k);
  g.imageSmoothingEnabled = false;
  g.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL();
}

/** Rasterises a 200×200 creature into per-ink pixel layers. */
async function buildSprite(svgBody: string, size: number): Promise<Sprite> {
  const img = await loadSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}">${svgBody}</svg>`);
  const [, g] = canvas(size, size);
  g.drawImage(img, 0, 0, size, size);
  const src = g.getImageData(0, 0, size, size).data;

  const on = new Uint8Array(size * size);
  const pix: (Swatch | null)[] = new Array(size * size).fill(null);
  for (let i = 0; i < size * size; i++) {
    const a = src[i * 4 + 3];
    if (a < 110) continue;
    // Un-premultiply against paper so soft edges don't turn muddy.
    const k = a / 255;
    const r = src[i * 4] * k + PAPER[0] * (1 - k);
    const gg = src[i * 4 + 1] * k + PAPER[1] * (1 - k);
    const b = src[i * 4 + 2] * k + PAPER[2] * (1 - k);
    pix[i] = nearest(r, gg, b);
    on[i] = 1;
  }

  const layers: Partial<Record<Ink, ImageData>> = {};
  const base = new ImageData(size, size);
  const putBase = (i: number): void => {
    base.data[i * 4] = PAPER[0];
    base.data[i * 4 + 1] = PAPER[1];
    base.data[i * 4 + 2] = PAPER[2];
    base.data[i * 4 + 3] = 255;
  };
  const layer = (ink: Ink): ImageData => (layers[ink] ??= new ImageData(size, size));
  const put = (ink: Ink, i: number): void => {
    const d = layer(ink).data;
    const [r, gg, b] = INK_RGB[ink];
    d[i * 4] = r;
    d[i * 4 + 1] = gg;
    d[i * 4 + 2] = b;
    d[i * 4 + 3] = 255;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const s = pix[i];
      if (s) {
        putBase(i);
        for (const ink of s.full) put(ink, i);
        if ((x + y) % 2 === 0) for (const ink of s.half) put(ink, i);
        continue;
      }
      // 1px outer outline in black ink.
      const n = (x > 0 && on[i - 1]) || (x < size - 1 && on[i + 1]) || (y > 0 && on[i - size]) || (y < size - 1 && on[i + size]);
      if (n) {
        putBase(i);
        put('K', i);
      }
    }
  }

  const [bc, bg] = canvas(size, size);
  bg.putImageData(base, 0, 0);
  const out: Sprite = { w: size, h: size, base: upscale(bc, 4), layers: {} };
  for (const ink of INK_ORDER) {
    const data = layers[ink];
    if (!data) continue;
    const [c, cg] = canvas(size, size);
    cg.putImageData(data, 0, 0);
    out.layers[ink] = upscale(c, 4);
  }
  return out;
}

/** Rasterises a 64×64 icon to a 1-bit alpha mask (light pixels on, dark details off). */
async function buildMask(svgBody: string, size: number): Promise<string> {
  const img = await loadSvg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" fill="#fff" color="#fff">${svgBody}</svg>`,
  );
  const [c, g] = canvas(size, size);
  g.drawImage(img, 0, 0, size, size);
  const im = g.getImageData(0, 0, size, size);
  const d = im.data;
  for (let i = 0; i < size * size; i++) {
    const lum = (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 3;
    const v = d[i * 4 + 3] > 100 && lum > 110 ? 255 : 0;
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 0;
    d[i * 4 + 3] = v;
  }
  g.putImageData(im, 0, 0);
  return upscale(c, 4);
}

export const SPRITE_RES = 64;
export const ICON_RES = 20;

/** Builds every sprite and icon once at boot; the UI then uses them synchronously. */
export async function preloadArt(): Promise<void> {
  const jobs: Promise<void>[] = [];
  for (const [id, body] of Object.entries(CREATURES)) {
    jobs.push(buildSprite(body, SPRITE_RES).then((s) => void sprites.set(id, s)));
  }
  for (const [id, ic] of Object.entries(ICONS)) {
    jobs.push(buildMask(ic.svg, ICON_RES).then((m) => void masks.set(id, m)));
  }
  await Promise.all(jobs);
}

/** HTML for a creature sprite (stack of ink layers). */
export function sprite(id: string, cls = ''): string {
  const s = sprites.get(id);
  if (!s) return `<div class="riso ${cls}"></div>`;
  // Ink layers stay in perfect register on sprites (misregistration is kept for icons and type only).
  const layers = INK_ORDER.filter((k) => s.layers[k])
    .map((k) => `<img class="ink ink-${k}" src="${s.layers[k]}" alt="" draggable="false">`)
    .join('');
  return `<div class="riso ${cls}" aria-hidden="true"><img class="ink ink-W" src="${s.base}" alt="" draggable="false">${layers}</div>`;
}

/** HTML for a pixel icon, tinted by CSS `color` (with a misregistered shadow in `--ink2`). */
export function pixelIcon(id: string, cls = ''): string {
  const m = masks.get(id) ?? masks.get('star');
  return `<i class="pico ${cls}" aria-hidden="true" style="--m:url('${m}')"></i>`;
}
