/**
 * The scene behind each act's title on the map: a flat pixel skyline, 96×24 cells drawn with rects (3px each on screen). Parts take their ink from the
 * map theme (`journey.css`): `a` is the solid silhouette, `b` thin lighter strokes (fences, bats, clouds, smoke), `c` wax and the moon, `l` lit windows, flames, stars and the sun, `w` the act's warm accent,
 * `d` the small birds that fly across the first act's morning. `tall` draws the act intro's version: the same scene plus a sky, and everything in it moves.
 */
type Rect = [x: number, y: number, w: number, h: number];

const parts = (cls: string, rects: Rect[]): string =>
  rects.map(([x, y, w, h]) => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('');

/** A pixel disc, one rect per row. */
const disc = (cx: number, cy: number, r: number): Rect[] =>
  Array.from({ length: 2 * r + 1 }, (_, i): Rect => {
    const dy = i - r;
    const half = Math.round(Math.sqrt(r * r + 0.5 - dy * dy));
    return [cx - half, cy + dy, 2 * half, 1];
  });

/** Act 1: a crypt at dawn: tombstones, crosses, an iron fence, bats and candles, with the sun coming up behind the stones on the right (on the intro it really rises). */
// biome-ignore format: pixel rects read best in rows
const crypt = (tall: boolean): string => {
  const sun = parts('l', [...disc(86, 21, 8), [86, 10, 1, 2], [78, 10, 1, 1], [94, 10, 1, 1]]);
  return (
    (tall ? `<g class="rise">${sun}</g>` : sun) +
    parts('w', [[0, 19, 28, 1], [0, 17, 14, 1], [64, 19, 32, 1]]) +
    parts('a', [
      [0, 21, 96, 3],
      [6, 15, 7, 6], [7, 14, 5, 1], [8, 13, 3, 1],
      [16, 17, 5, 4], [17, 16, 3, 1],
      [26, 11, 2, 10], [24, 13, 6, 2],
      [68, 12, 2, 9], [66, 14, 6, 2],
    ]) +
    parts('b', [
      [34, 18, 28, 1],
      ...[34, 38, 42, 46, 50, 54, 58].map((x): Rect => [x, 16, 1, 5]),
      ...(tall ? [] : ([[44, 5, 5, 1], [43, 4, 1, 1], [49, 4, 1, 1], [58, 8, 4, 1], [57, 7, 1, 1], [62, 7, 1, 1]] satisfies Rect[])),
    ]) +
    parts('c', [[3, 18, 2, 3], [22, 18, 2, 3], [74, 18, 2, 3]]) +
    (tall
      ? parts('l', [[3, 17, 2, 1], [22, 17, 2, 1], [74, 17, 2, 1]]) + [3, 22, 74].map((x, i) => twinkle(x, 16, 0.7 + i * 0.15, -i * 0.2, 'l', 2)).join('')
      : parts('l', [[3, 16, 2, 2], [22, 16, 2, 2], [74, 16, 2, 2]]))
  );
};

/** Act 2: the office towers, windows still lit, rooftop units in rust. */
// biome-ignore format: pixel rects read best in rows
const office = (): string =>
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
const factory = (tall: boolean): string =>
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
  parts('w', [[33, 2, 3, 1], [43, 7, 2, 1]]) +
  (tall ? twinkle(84, 1, 1, 0, 'w', 2, 2) : parts('w', [[84, 1, 2, 2]])) +
  parts('l', [[7, 15, 2, 2], [12, 15, 2, 2], [17, 15, 2, 2], [22, 15, 2, 2], [7, 18, 2, 2], [17, 18, 2, 2], [90, 16, 2, 2]]);

/**
 * Things that move on the map's banner, as groups the CSS animates (journey.css). `y` is a height in cells, `dur` seconds, `delay` seconds
 * (negative: already under way). `drift` crosses the banner from left to right in `n` steps (about a cell each at 116).
 */
const drift = (y: number, dur: number, delay: number, body: string, n = 52): string =>
  `<g class="drift" style="--y:${y}px;--d:${dur}s;--dl:${delay}s;--n:${n}">${body}</g>`;

/** A small bird, two frames (wings up, wings down) swapped by the CSS. */
const bird = (y: number, dur: number, delay: number): string =>
  drift(
    y,
    dur,
    delay,
    `<g class="up">${parts('d', [
      [0, 0, 1, 1],
      [1, 1, 1, 1],
      [2, 0, 1, 1],
    ])}</g><g class="down">${parts('d', [
      [0, 1, 1, 1],
      [1, 0, 1, 1],
      [2, 1, 1, 1],
    ])}</g>`,
  );

/** A slow cloud (`big`: a wider one). */
const cloud = (y: number, dur: number, delay: number, big = false): string =>
  drift(
    y,
    dur,
    delay,
    parts(
      'b',
      big
        ? [
            [3, 0, 5, 1],
            [1, 1, 9, 1],
            [0, 2, 11, 1],
          ]
        : [
            [2, 0, 4, 1],
            [0, 1, 8, 1],
          ],
    ),
    116,
  );

/** An advertising blimp. */
const blimp = (y: number, dur: number, delay: number): string =>
  drift(
    y,
    dur,
    delay,
    parts('b', [
      [2, 0, 8, 1],
      [0, 1, 12, 3],
      [2, 4, 8, 1],
      [5, 5, 2, 1],
      [11, 0, 2, 1],
    ]) + parts('w', [[3, 2, 6, 1]]),
    116,
  );

/** A plane with a blinking light. */
const plane = (y: number, dur: number, delay: number): string =>
  drift(
    y,
    dur,
    delay,
    parts('d', [
      [0, 0, 1, 1],
      [0, 1, 6, 1],
      [2, 2, 2, 1],
    ]) + twinkle(6, 1, 1.2, 0, 'w'),
    116,
  );

/** A window of the skyline going dark for a while (an overlay in the silhouette's colour, shown now and then). */
const lightsOut = (x: number, y: number, dur: number, delay: number): string =>
  `<g class="off" style="--d:${dur}s;--dl:${delay}s">${parts('a', [[x, y, 2, 2]])}</g>`;

/** A puff of smoke or steam rising from a chimney or a rooftop unit at (x, y). */
const puff = (x: number, y: number, delay: number): string =>
  `<g class="puff" style="--x:${x}px;--y:${y}px;--dl:${delay}s">${parts('b', [
    [0, 0, 2, 1],
    [1, -1, 1, 1],
  ])}</g>`;

/** A dot of light (`w`×`h` cells) that goes out now and then: a star, a candle's flame tip, a plane's or a crane's lamp (`cls` is its ink). */
const twinkle = (x: number, y: number, dur: number, delay: number, cls = 'l', w = 1, h = 1): string =>
  `<g class="twinkle" style="--d:${dur}s;--dl:${delay}s">${parts(cls, [[x, y, w, h]])}</g>`;

/** A bat of the first act's night, two frames (wings up, wings down) swapped by the CSS; it crosses the intro's sky. */
const bat = (y: number, dur: number, delay: number): string =>
  drift(
    y,
    dur,
    delay,
    `<g class="up">${parts('b', [
      [0, 0, 1, 1],
      [4, 0, 1, 1],
      [1, 1, 3, 1],
    ])}</g><g class="down">${parts('b', [
      [1, 0, 3, 1],
      [0, 1, 1, 1],
      [4, 1, 1, 1],
    ])}</g>`,
    116,
  );

/** The life of a scene that belongs to its buildings (smoke, steam, windows going dark): it moves on the map's banner and on the act intro alike, over the scene. */
const LIFE = [
  bat(4, 11, -5) + bat(8, 14, -9),
  puff(6, 7, 0) +
    puff(19, 3, -1.6) +
    puff(73, 2, -0.8) +
    puff(87, 6, -2.4) +
    lightsOut(9, 16, 9, 0) +
    lightsOut(22, 8, 13, -4) +
    lightsOut(76, 15, 11, -7) +
    lightsOut(84, 11, 15, -2),
  puff(33, 2, 0) +
    puff(35, 2, -1.7) +
    puff(43, 7, -0.9) +
    puff(44, 7, -2.6) +
    lightsOut(7, 18, 8, 0) +
    lightsOut(17, 15, 12, -5) +
    lightsOut(90, 16, 10, -3),
];

/** What moves over each scene on the map's banner (the act intro has its own sky, below). */
const MOVERS = [
  bird(3, 16, 0) + bird(8, 22, -7) + bird(12, 19, -13),
  cloud(2, 70, 0, true) + cloud(9, 52, -25) + blimp(5, 110, -50) + LIFE[1],
  twinkle(2, 2, 3.2, 0) +
    twinkle(14, 5, 4.4, -1.5) +
    twinkle(26, 3, 5.1, -3) +
    twinkle(52, 3, 3.8, -2) +
    twinkle(60, 6, 4.9, -4) +
    twinkle(76, 1, 3.5, -0.5) +
    twinkle(93, 6, 4.1, -2.5) +
    plane(6, 80, -30) +
    cloud(10, 90, -45, true) +
    LIFE[2],
];

/** A pixel crescent: the disc at (cx, cy) with another one, centred (cx2, cy2), cut out of it. */
const crescent = (cx: number, cy: number, r: number, cx2: number, cy2: number, r2: number): Rect[] => {
  const half = (rad: number, dy: number): number => Math.round(Math.sqrt(rad * rad + 0.5 - dy * dy));
  const out: Rect[] = [];
  for (let dy = -r; dy <= r; dy++) {
    const [from, to] = [cx - half(r, dy), cx + half(r, dy)];
    const dy2 = cy + dy - cy2;
    if (Math.abs(dy2) > r2) {
      out.push([from, cy + dy, to - from, 1]);
      continue;
    }
    const [cutFrom, cutTo] = [cx2 - half(r2, dy2), cx2 + half(r2, dy2)];
    if (cutFrom > from) out.push([from, cy + dy, Math.min(to, cutFrom) - from, 1]);
    if (cutTo < to) out.push([Math.max(from, cutTo), cy + dy, to - Math.max(from, cutTo), 1]);
  }
  return out;
};

/**
 * The sky above each scene (rows -16 to 0), drawn only on the act intro: a moon with bats flying by, a low sun with clouds and a blimp drifting, a crescent moon with
 * twinkling stars and a plane. Everything runs faster than on the map: the intro only lasts a few seconds.
 */
// biome-ignore format: pixel rects read best in rows
const SKIES = [
  parts('c', disc(78, -9, 6)) + parts('a', [[75, -11, 2, 2], [80, -8, 3, 2], [77, -6, 1, 1]]) + bat(-13, 9, -2) + bat(-8, 12, -7) + bat(-4, 10, -4.5),
  parts('w', disc(22, -7, 6)) + cloud(-13, 40, -12, true) + cloud(-8, 30, -22) + blimp(-5, 56, -30),
  parts('c', crescent(74, -9, 6, 78, -10, 5)) +
    [[8, -13], [20, -9], [30, -14], [42, -7], [52, -12], [60, -5], [14, -4], [88, -5], [90, -14]]
      .map(([x, y], i) => twinkle(x, y, 1.4 + (i % 3) * 0.5, -i * 0.7))
      .join('') +
    twinkle(2, 2, 1.8, 0) + twinkle(26, 3, 2.1, -1) + twinkle(52, 3, 1.6, -0.5) + twinkle(76, 1, 2.4, -1.4) + plane(-9, 40, -14),
];

const SCENES = [crypt, office, factory];

/** The scene of an act (1-based; later acts fall back to the last one, like `actDef`); `tall` adds its sky, for the act intro. */
export const actArt = (act: number, tall = false): string => {
  const i = Math.min(act, SCENES.length) - 1;
  return `<svg class="act-art${tall ? ' tall' : ''}" viewBox="0 ${tall ? -16 : 0} 96 ${tall ? 40 : 24}" shape-rendering="crispEdges" aria-hidden="true">${tall ? SKIES[i] : ''}${SCENES[i](tall)}${tall ? LIFE[i] : MOVERS[i]}</svg>`;
};
