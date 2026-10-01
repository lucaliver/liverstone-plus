/**
 * The scene behind each act's title on the map: a flat pixel skyline, 96×24 cells drawn with rects (3px each on screen). Parts take their ink from the
 * map theme (`journey.css`): `a` is the solid silhouette, `b` thin lighter strokes (fences, bats, stars, smoke), `c` candle wax, `l` lit windows and flames, `w` the act's warm accent.
 */
type Rect = [x: number, y: number, w: number, h: number];

const parts = (cls: string, rects: Rect[]): string =>
  rects.map(([x, y, w, h]) => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('');

/** Act 1: a crypt: tombstones, crosses, an iron fence, bats and candles. */
// biome-ignore format: pixel rects read best in rows
const crypt =
  parts('a', [
    [0, 21, 96, 3],
    [6, 15, 7, 6], [7, 14, 5, 1], [8, 13, 3, 1],
    [16, 17, 5, 4], [17, 16, 3, 1],
    [26, 11, 2, 10], [24, 13, 6, 2],
    [75, 17, 5, 4], [76, 16, 3, 1],
    [84, 15, 7, 6], [85, 14, 5, 1], [86, 13, 3, 1],
    [68, 12, 2, 9], [66, 14, 6, 2],
  ]) +
  parts('b', [
    [34, 18, 28, 1],
    ...[34, 38, 42, 46, 50, 54, 58].map((x): Rect => [x, 16, 1, 5]),
    [44, 5, 5, 1], [43, 4, 1, 1], [49, 4, 1, 1],
    [58, 8, 4, 1], [57, 7, 1, 1], [62, 7, 1, 1],
  ]) +
  parts('c', [[3, 18, 2, 3], [22, 18, 2, 3], [72, 18, 2, 3], [92, 18, 2, 3]]) +
  parts('l', [[3, 16, 2, 2], [22, 16, 2, 2], [72, 16, 2, 2], [92, 16, 2, 2]]);

/** Act 2: the office towers, windows still lit, rooftop units in rust. */
// biome-ignore format: pixel rects read best in rows
const office =
  parts('a', [
    [0, 21, 96, 3],
    [2, 10, 12, 11], [16, 6, 10, 15], [28, 12, 8, 9],
    [60, 12, 8, 9], [70, 5, 10, 16], [82, 9, 12, 12],
  ]) +
  parts('b', [[20, 3, 1, 3], [74, 2, 1, 3]]) +
  parts('w', [[5, 8, 4, 2], [86, 7, 4, 2], [18, 4, 3, 2], [72, 3, 3, 2]]) +
  parts('l', [
    [4, 12, 2, 2], [9, 12, 2, 2], [4, 16, 2, 2], [9, 16, 2, 2],
    [18, 8, 2, 2], [22, 8, 2, 2], [18, 12, 2, 2], [22, 16, 2, 2],
    [72, 7, 2, 2], [76, 7, 2, 2], [72, 11, 2, 2], [76, 15, 2, 2],
    [84, 11, 2, 2], [89, 15, 2, 2],
  ]);

/** Act 3: the night shift: a factory with smoking stacks, a crane and warning lights. */
// biome-ignore format: pixel rects read best in rows
const factory =
  parts('a', [
    [0, 21, 96, 3],
    [4, 12, 24, 9], [4, 9, 5, 3], [12, 9, 5, 3], [20, 9, 5, 3],
    [32, 3, 5, 18], [42, 8, 4, 13],
    [84, 3, 2, 18], [66, 3, 22, 2], [68, 5, 1, 7], [67, 12, 3, 2],
    [88, 14, 8, 7],
  ]) +
  parts('b', [
    [32, 0, 5, 2], [36, 1, 4, 2], [41, 5, 4, 2], [44, 3, 4, 2],
    [48, 2, 1, 1], [54, 4, 1, 1], [58, 1, 1, 1], [2, 3, 1, 1], [92, 2, 1, 1], [62, 9, 1, 1],
  ]) +
  parts('w', [[33, 2, 3, 1], [43, 7, 2, 1], [84, 1, 2, 2]]) +
  parts('l', [[7, 15, 2, 2], [12, 15, 2, 2], [17, 15, 2, 2], [22, 15, 2, 2], [7, 18, 2, 2], [17, 18, 2, 2], [90, 16, 2, 2]]);

const SCENES = [crypt, office, factory];

/** The scene of an act (1-based; later acts fall back to the last one, like `actDef`). */
export const actArt = (act: number): string =>
  `<svg class="act-art" viewBox="0 0 96 24" shape-rendering="crispEdges" aria-hidden="true">${SCENES[Math.min(act, SCENES.length) - 1]}</svg>`;
