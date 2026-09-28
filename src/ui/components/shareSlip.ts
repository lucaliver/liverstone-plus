import { t } from '../../core/i18n';
import { CARDS } from '../../data/cards';
import type { CardInst, HeroId } from '../../game/types';
import { drawIcon, drawSprite } from '../art/riso';
import { h } from '../dom';
import { cardCostLabel, cardName } from './cardView';

/** One line of the payslip, shared by the end screen and the share image. */
export interface SlipRow {
  label: string;
  value: string;
  kind: 'row' | 'section' | 'net';
  /** A one-run record this run beat (stamped NEW RECORD). */
  record?: boolean;
}

export interface ShareSlip {
  hero: HeroId;
  title: string;
  employee: string;
  rows: SlipRow[];
  /** PAID (a won run, stamped blue) or VOID. */
  won: boolean;
  stamp: string;
  /** The final deck, identical copies grouped. */
  deck: { card: CardInst; n: number }[];
}

const W = 1080;
const H = 1350;
const PAD = 60;

/** Reads the design tokens so the image matches the game's inks. */
function tokens(): Record<'paper' | 'paper2' | 'k' | 'p' | 'b' | 'y' | 'bg' | 'bg2' | 'muted' | 'mutedD' | 'shadow', string> {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string): string => css.getPropertyValue(name).trim();
  return {
    paper: v('--paper'),
    paper2: v('--paper2'),
    k: v('--k'),
    p: v('--p'),
    b: v('--b'),
    y: v('--y'),
    bg: v('--bg'),
    bg2: v('--bg2'),
    muted: v('--muted'),
    mutedD: v('--muted-d'),
    shadow: v('--shadow'),
  };
}

/** A card's name band colours, as its class sets them in cards.css. */
function bandOf(cls: string): { band: string; text: string } {
  const probe = h('div', { class: 'card', 'data-cls': cls, style: { position: 'absolute', visibility: 'hidden' } });
  document.body.append(probe);
  const css = getComputedStyle(probe);
  const out = { band: css.getPropertyValue('--band').trim(), text: css.getPropertyValue('--band-text').trim() };
  probe.remove();
  return out;
}

/** Sets the largest font (down to `min`) that fits `text` in `width`. */
function fitFont(g: CanvasRenderingContext2D, text: string, width: number, size: number, family: string, min = 14): void {
  for (let s = size; s >= min; s -= 2) {
    g.font = `${s}px ${family}`;
    if (g.measureText(text).width <= width) return;
  }
}

/** A rubber stamp: bordered caps, tilted. */
function stamp(g: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, angle: number): void {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.font = `${size}px Silkscreen`;
  const w = g.measureText(text).width + size;
  g.strokeStyle = color;
  g.lineWidth = Math.max(3, size / 7);
  g.strokeRect(-w / 2, -size * 0.75, w, size * 1.5);
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 0, 2);
  g.restore();
}

/** A shareable portrait image of the run's payslip: the hero, the slip, the final deck and where to play. */
export async function payslipImage(s: ShareSlip): Promise<Blob | null> {
  await Promise.all(['64px Silkscreen', '40px "Pixel UI"', '600 30px "Space Grotesk"'].map((f) => document.fonts.load(f)));
  const c = tokens();
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  g.textBaseline = 'alphabetic';

  // The night, crossed by the poster's yellow band.
  g.fillStyle = c.bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = c.y;
  g.beginPath();
  g.moveTo(0, 150);
  g.lineTo(W, 30);
  g.lineTo(W, 190);
  g.lineTo(0, 310);
  g.fill();

  // The logo on a paper plate, tilted, printed pink under black.
  g.save();
  g.translate(W / 2, 150);
  g.rotate(-0.07);
  g.fillStyle = c.p;
  g.fillRect(-380 + 10, -70 + 10, 760, 140);
  g.fillStyle = c.paper;
  g.fillRect(-380, -70, 760, 140);
  g.lineWidth = 6;
  g.strokeStyle = c.k;
  g.strokeRect(-380, -70, 760, 140);
  g.font = '92px Silkscreen';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = c.p;
  g.fillText(t('app.title').toUpperCase(), 6, 6);
  g.fillStyle = c.k;
  g.fillText(t('app.title').toUpperCase(), 0, 0);
  g.restore();

  // The hero in a frame, its name and how the day went.
  const top = 280;
  g.fillStyle = c.shadow;
  g.fillRect(PAD + 8, top + 8, 250, 250);
  g.fillStyle = c.bg2;
  g.fillRect(PAD, top, 250, 250);
  g.lineWidth = 6;
  g.strokeStyle = c.k;
  g.strokeRect(PAD, top, 250, 250);
  await drawSprite(g, s.hero, PAD + 10, top + 10, 230);
  const tx = PAD + 290;
  g.textAlign = 'left';
  g.fillStyle = c.paper;
  fitFont(g, t(`hero.${s.hero}.name`).toUpperCase(), W - tx - PAD, 60, 'Silkscreen');
  g.fillText(t(`hero.${s.hero}.name`).toUpperCase(), tx, top + 80);
  g.fillStyle = c.mutedD;
  fitFont(g, t(`hero.${s.hero}.job`), W - tx - PAD, 38, '"Pixel UI"');
  g.fillText(t(`hero.${s.hero}.job`), tx, top + 130);
  g.fillStyle = c.p;
  fitFont(g, s.title.toUpperCase(), W - tx - PAD, 56, 'Silkscreen');
  g.fillText(s.title.toUpperCase(), tx, top + 215);

  // The payslip on paper: rows with dot leaders, NEW RECORD stamps, then the big stamp.
  const sy = top + 290;
  const sh = 150 + s.rows.length * 40;
  g.fillStyle = c.shadow;
  g.fillRect(PAD + 10, sy + 10, W - 2 * PAD, sh);
  g.fillStyle = c.paper;
  g.fillRect(PAD, sy, W - 2 * PAD, sh);
  g.strokeStyle = c.k;
  g.strokeRect(PAD, sy, W - 2 * PAD, sh);
  const lx = PAD + 40;
  const rx = W - PAD - 40;
  g.fillStyle = c.k;
  g.font = '40px Silkscreen';
  g.fillText(t('end.slip.title').toUpperCase(), lx, sy + 60);
  g.textAlign = 'right';
  g.fillStyle = c.muted;
  g.font = '32px "Pixel UI"';
  g.fillText(t('end.slip.company'), rx, sy + 58);
  g.textAlign = 'left';
  g.fillText(s.employee, lx, sy + 100);
  g.setLineDash([10, 8]);
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(lx, sy + 118);
  g.lineTo(rx, sy + 118);
  g.stroke();
  g.setLineDash([]);
  let y = sy + 160;
  for (const r of s.rows) {
    g.font = '34px "Pixel UI"';
    g.fillStyle = r.kind === 'section' ? c.p : c.k;
    const label = r.kind === 'section' ? r.label.toUpperCase() : r.label;
    g.textAlign = 'left';
    g.fillText(label, lx, y);
    g.textAlign = 'right';
    g.fillText(r.value, rx, y);
    if (r.kind === 'row') {
      const from = lx + g.measureText(label).width + 12;
      const to = rx - g.measureText(r.value).width - 12;
      g.fillStyle = c.paper2;
      for (let x = from; x < to; x += 10) g.fillRect(x, y - 6, 4, 4);
    }
    if (r.record) stamp(g, t('end.newRecord'), rx - 200, y - 12, 20, c.p, -0.08);
    y += 40;
  }
  stamp(g, s.stamp.toUpperCase(), W / 2 + 60, sy + sh - 90, 48, s.won ? c.b : c.p, -0.2);

  // The final deck: one ticket per card, copies counted.
  const dy = sy + sh + 50;
  g.textAlign = 'left';
  g.fillStyle = c.mutedD;
  g.font = '32px "Pixel UI"';
  g.fillText(t('common.deck').toUpperCase(), PAD, dy);
  const cols = 6;
  const gap = 12;
  const tw = (W - 2 * PAD - (cols - 1) * gap) / cols;
  const th = 100;
  const bands = new Map<string, { band: string; text: string }>();
  for (const [i, { card, n }] of s.deck.slice(0, cols * 2).entries()) {
    const x = PAD + (i % cols) * (tw + gap);
    const ty = dy + 20 + Math.floor(i / cols) * (th + gap);
    const def = CARDS[card.id];
    const cls = def.cls;
    if (!bands.has(cls)) bands.set(cls, bandOf(cls));
    const band = bands.get(cls)!;
    g.fillStyle = c.paper;
    g.fillRect(x, ty, tw, th);
    g.fillStyle = band.band;
    g.fillRect(x, ty, tw, 34);
    g.lineWidth = 3;
    g.strokeStyle = c.k;
    g.strokeRect(x, ty, tw, th);
    g.fillStyle = band.text;
    g.textAlign = 'left';
    fitFont(g, cardName(card), tw - 12, 24, '"Pixel UI"');
    g.fillText(cardName(card), x + 6, ty + 25);
    g.fillStyle = c.y;
    g.fillRect(x + 6, ty + 44, 40, 44);
    g.fillStyle = c.k;
    g.font = '36px "Pixel UI"';
    g.textAlign = 'center';
    g.fillText(cardCostLabel(card), x + 26, ty + 78);
    await drawIcon(g, def.art, x + 54, ty + 44, 44, c.k);
    if (n > 1) {
      g.textAlign = 'right';
      g.font = '30px "Pixel UI"';
      g.fillText(t('deck.copies', { n }), x + tw - 6, ty + 90);
    }
  }

  // Where to clock in.
  g.textAlign = 'center';
  g.fillStyle = c.mutedD;
  g.font = '30px "Pixel UI"';
  g.fillText(`${location.host}${location.pathname}`.replace(/\/$/, ''), W / 2, H - 30);

  return new Promise((resolve) => cv.toBlob(resolve, 'image/png'));
}

/** Shares the image through the system sheet where files can be shared; otherwise downloads it. */
export async function shareImage(blob: Blob, name: string, text: string): Promise<void> {
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
    } catch {
      /* the player closed the share sheet */
    }
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
