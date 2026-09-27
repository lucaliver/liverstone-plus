import { pixelIcon } from './riso';

/**
 * Silhouette icons on a 64×64 grid. They use `currentColor` so the context tints them;
 * a few parts use fixed colours for readability (potion liquids, eyes).
 * `el` picks the card art background (element theme).
 */
export type Element = 'steel' | 'fire' | 'ice' | 'arcane' | 'blood' | 'nature' | 'shadow' | 'holy' | 'curse' | 'necro';

const S = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
const HI = 'fill="#fff" opacity=".28"';

const sword = `<path d="M52 5h7v7L30 41l-7-7z"/><path ${HI} d="M55 6l3 1-26 26-2-2z"/><path d="M13 33l18 18-4 4L9 37z"/><path d="M17 45l4 4-9 9-4-4z"/><circle cx="7" cy="57" r="3.5"/>`;
const swordMirror = `<g transform="translate(64 0) scale(-1 1)">${sword}</g>`;
const shield = `<path d="M32 5l23 8c0 22-8 37-23 46C17 50 9 35 9 13z"/><path ${HI} d="M32 11l17 6c0 16-6 28-17 35z"/>`;
const flame = `<path d="M32 4c4 12 18 18 18 34a18 18 0 0 1-36 0c0-9 5-14 8-18 1 6 4 9 7 9-3-9 0-18 3-25z"/><path fill="#fff" opacity=".35" d="M32 32c3 5 8 7 8 14a8 8 0 0 1-16 0c0-4 3-6 4-8 1 2 2 3 3 3-1-4 0-6 1-9z"/>`;
const snowflake = `<g ${S} stroke-width="4.5"><path d="M32 6v52M9.5 19l45 26M9.5 45l45-26"/><path d="M26 10l6 6 6-6M26 54l6-6 6 6M8 27l8-2-2-8M56 37l-8 2 2 8M8 37l8 2-2 8M56 27l-8-2 2-8"/></g>`;
const skull = `<path d="M32 6C18 6 9 16 9 28c0 8 4 13 8 16v8c0 3 2 5 5 5h20c3 0 5-2 5-5v-8c4-3 8-8 8-16C55 16 46 6 32 6z"/><circle cx="23" cy="30" r="6" fill="#16121f"/><circle cx="41" cy="30" r="6" fill="#16121f"/><path d="M32 36l-4 7h8z" fill="#16121f"/><path d="M25 50v6M32 50v6M39 50v6" stroke="#16121f" stroke-width="2.5"/>`;
const heart = `<path d="M32 56C9 41 4 27 11 17c7-10 18-8 21 1 3-9 14-11 21-1 7 10 2 24-21 39z"/><path ${HI} d="M17 20c3-4 8-4 10 0-4 0-7 3-8 7-2-2-3-5-2-7z"/>`;
const potion = (liquid: string): string =>
  `<path d="M25 5h14v5h-2v11c9 3 15 11 15 20a20 20 0 0 1-40 0c0-9 6-17 15-20V10h-2z"/><path fill="${liquid}" d="M16 40h32a16 16 0 0 1-32 0z"/><circle cx="26" cy="44" r="2.5" fill="#fff" opacity=".6"/><circle cx="36" cy="49" r="1.8" fill="#fff" opacity=".5"/><path ${HI} d="M20 32c2-4 5-6 8-7v4c-3 1-5 3-6 6z"/>`;
const star4 = (cx: number, cy: number, r: number): string =>
  `<path d="M${cx} ${cy - r}Q${cx + r * 0.18} ${cy - r * 0.18} ${cx + r} ${cy}Q${cx + r * 0.18} ${cy + r * 0.18} ${cx} ${cy + r}Q${cx - r * 0.18} ${cy + r * 0.18} ${cx - r} ${cy}Q${cx - r * 0.18} ${cy - r * 0.18} ${cx} ${cy - r}z"/>`;
const hourglass = `<path d="M14 5h36v6h-3c0 10-8 15-11 21 3 6 11 11 11 21h3v6H14v-6h3c0-10 8-15 11-21-3-6-11-11-11-21h-3z"/><path fill="#16121f" opacity=".55" d="M23 11h18c0 7-6 11-9 16-3-5-9-9-9-16zM25 53c1-6 5-9 7-12 2 3 6 6 7 12z"/>`;
const mirror = `<ellipse cx="32" cy="24" rx="16" ry="20"/><ellipse cx="32" cy="24" rx="11" ry="15" fill="#16121f" opacity=".45"/><path ${HI} d="M25 14c3-3 7-4 10-3-5 2-8 6-9 12-2-3-2-6-1-9z"/><rect x="29" y="43" width="6" height="16" rx="3"/>`;
const bolt = `<path d="M37 4L14 36h14l-5 24 25-34H33z"/>`;
/** Filled gem = mana (points to spend). */
const crystal = `<path d="M32 4l16 18-16 38-16-38z"/><path ${HI} d="M32 4l16 18H32z"/><path fill="#16121f" opacity=".3" d="M32 60L16 22h16z"/>`;
/** Hollow gem = an empty mana crystal (raises the max; fills over time), like an empty pip in the mana bar. */
const crystalSlot = `<path d="M32 4l16 18-16 38-16-38z"/><path fill="#16121f" d="M32 14l9 10-9 23-9-23z"/>`;
const cloud = `<path d="M18 40a10 10 0 0 1 2-20 13 13 0 0 1 25-2 11 11 0 0 1 3 22z"/>`;
const fist = `<path d="M18 28c0-5 3-7 6-7h20c4 0 6 3 6 6v3c3 0 5 2 5 5v8c0 9-7 16-16 16h-6c-9 0-15-7-15-16z"/><path fill="#16121f" opacity=".45" d="M24 22v11M32 21v12M40 21v12" stroke="#16121f" stroke-width="2"/><path d="M14 30c0-3 2-5 5-5h5v14h-5c-3 0-5-2-5-5z"/>`;
const wing = `<path d="M6 44C14 20 34 8 58 8c-6 6-8 10-9 14 3-1 6-1 9 0-5 5-10 8-15 9 3 1 6 2 8 4-9 4-19 6-28 5-6 0-12 2-17 4z"/>`;

export const ICONS: Record<string, { el: Element; svg: string }> = {
  // ---- warrior
  sword: { el: 'steel', svg: sword },
  shield: { el: 'steel', svg: shield },
  hammer: {
    el: 'steel',
    svg: `<g transform="rotate(-38 32 32)"><rect x="29" y="20" width="6" height="42" rx="2"/><rect x="15" y="6" width="34" height="17" rx="3"/><rect ${HI} x="17" y="8" width="30" height="4" rx="2"/></g>`,
  },
  axe: {
    el: 'steel',
    svg: `<g transform="rotate(-32 32 32)"><rect x="29" y="6" width="5" height="56" rx="2"/><path d="M33 9c14-3 24 6 24 17s-10 17-24 13z"/><path ${HI} d="M36 12c9-1 16 4 18 10H36z"/></g>`,
  },
  wall: {
    el: 'steel',
    svg: `<path d="M6 12h24v10H6zM34 12h24v10H34zM6 26h12v10H6zM22 26h20v10H22zM46 26h12v10H46zM6 40h24v10H6zM34 40h24v10H34z"/><path ${HI} d="M6 12h52v3H6z"/>`,
  },
  shieldBash: {
    el: 'steel',
    svg: `<g transform="translate(6 2) scale(.85)">${shield}</g><g ${S} stroke-width="4"><path d="M4 22h8M2 32h9M4 42h8"/></g>`,
  },
  horn: {
    el: 'steel',
    svg: `<path d="M8 42c14-1 30-10 40-30l8 4c-6 24-24 38-46 38-3 0-5-5-2-12z"/><ellipse cx="8" cy="48" rx="4" ry="7"/><g ${S} stroke-width="3.5"><path d="M44 44l10 6M40 52l7 9M50 34l11 1"/></g>`,
  },
  maul: {
    el: 'steel',
    svg: `<g transform="rotate(-35 32 32)"><rect x="28.5" y="22" width="7" height="40" rx="2"/><rect x="10" y="3" width="44" height="22" rx="4"/><rect ${HI} x="12" y="5" width="40" height="5" rx="2"/><path fill="#16121f" opacity=".35" d="M10 18h44v7H10z"/></g>`,
  },
  blood: {
    el: 'blood',
    svg: `<path d="M32 5c8 14 17 24 17 36a17 17 0 0 1-34 0c0-12 9-22 17-36z"/><path ${HI} d="M24 38c0-5 3-10 6-14-1 6-1 11 1 16-3 2-7 1-7-2z"/>`,
  },
  crossed: { el: 'steel', svg: sword + swordMirror },
  drum: {
    el: 'blood',
    svg: `<ellipse cx="32" cy="24" rx="22" ry="8"/><path d="M10 24v20c0 5 10 9 22 9s22-4 22-9V24c0 5-10 9-22 9s-22-4-22-9z"/><path fill="#16121f" opacity=".35" d="M14 32l6 18M26 34l4 19M38 34l-4 19M50 32l-6 18" stroke="#16121f" stroke-width="2"/><g ${S} stroke-width="4"><path d="M20 4l10 16M46 4L36 20"/></g>`,
  },
  whirl: {
    el: 'steel',
    svg: `<g ${S} stroke-width="5.5"><path d="M32 32m-4 0a4 4 0 1 1 8 0 10 10 0 1 1-20 0 16 16 0 1 1 32 0 22 22 0 1 1-44 0"/></g><path d="M8 33l-4-9 11 2z"/>`,
  },
  heart: { el: 'nature', svg: heart },
  rampage: { el: 'blood', svg: `${fist}<g ${S} stroke-width="3.5"><path d="M6 12l7 6M20 4l2 9M58 12l-7 6M44 4l-2 9"/></g>` },
  fortress: {
    el: 'steel',
    svg: `<path d="M10 12h8v6h6v-6h6v6h4v-6h6v6h6v-6h8v46H10z"/><path fill="#16121f" opacity=".55" d="M26 58V44a6 6 0 0 1 12 0v14z"/><path ${HI} d="M10 22h44v3H10z"/>`,
  },
  execute: {
    el: 'blood',
    svg: `<g transform="rotate(-32 32 32)"><rect x="29" y="6" width="5" height="56" rx="2"/><path d="M33 7c16-4 26 7 26 19s-10 19-26 15z"/></g><path fill="#c52a2a" d="M50 44c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z"/>`,
  },
  fang: { el: 'blood', svg: `<path d="M6 12h52c0 6-3 9-8 10L42 58 34 22h-4l-8 36-8-36c-5-1-8-4-8-10z"/><path ${HI} d="M18 24l6 22 2-24z"/>` },
  quake: {
    el: 'steel',
    svg: `<path d="M4 44h56v14H4z"/><path fill="#16121f" d="M30 44l-4 6 5 3-3 5h5l3-6-5-3 3-5z"/><path d="M12 30l7-6 6 5-4 9zM40 26l8-4 5 8-8 5zM28 14l6-4 4 6-6 4z"/>`,
  },
  // ---- mage
  bolt: { el: 'arcane', svg: `<circle cx="32" cy="32" r="12"/><circle cx="32" cy="32" r="6" fill="#fff" opacity=".7"/>${star4(32, 32, 28)}` },
  ward: {
    el: 'arcane',
    svg: `<path d="M32 4l24 14v28L32 60 8 46V18z"/><path fill="#16121f" opacity=".4" d="M32 13l16 9v20l-16 9-16-9V22z"/><path d="M32 20l3 9h9l-7 6 3 9-8-5-8 5 3-9-7-6h9z"/>`,
  },
  frost: { el: 'ice', svg: `<path d="M6 58L40 24l6 6-34 34z" opacity=".5"/>${`<g transform="translate(20 -8) scale(.7)">${snowflake}</g>`}` },
  fireball: {
    el: 'fire',
    svg: `<path d="M4 58c8-16 16-26 26-32l8 8C32 44 22 52 4 58z" opacity=".55"/><circle cx="40" cy="24" r="17"/><circle cx="40" cy="24" r="9" fill="#fff" opacity=".45"/>`,
  },
  iceLance: { el: 'ice', svg: `<path d="M58 6L48 26 18 56l-8-2-2-8L38 16z"/><path ${HI} d="M58 6L40 18l-2-2z"/><path d="M8 46l10 10-8 4-6-6z"/>` },
  crystal: { el: 'arcane', svg: crystal },
  crystalSlot: { el: 'arcane', svg: crystalSlot },
  geode: {
    el: 'arcane',
    svg: `<g transform="translate(-2 18) scale(.62)">${crystalSlot}</g><g transform="translate(14 0) scale(.8)">${crystalSlot}</g><g transform="translate(34 22) scale(.55)">${crystalSlot}</g>`,
  },
  spark: { el: 'arcane', svg: star4(28, 30, 22) + star4(50, 14, 9) + star4(50, 50, 7) },
  frostArmor: { el: 'ice', svg: `${shield}<g transform="translate(17 13) scale(.47)" color="#16121f" opacity=".6">${snowflake}</g>` },
  flame: { el: 'fire', svg: flame },
  missiles: {
    el: 'arcane',
    svg: [8, 26, 44]
      .map(
        (y, i) =>
          `<path d="M${6 + i * 4} ${y + 12}c10-4 18-6 26-6l4 5c-8 3-18 4-30 1z" opacity=".5"/><circle cx="${44 + i * 3}" cy="${y + 7}" r="7"/>`,
      )
      .join(''),
  },
  hourglass: { el: 'arcane', svg: hourglass },
  mirror: { el: 'arcane', svg: mirror },
  combust: {
    el: 'fire',
    svg: `<path d="M32 2l6 16 16-8-8 16 16 6-16 6 8 16-16-8-6 16-6-16-16 8 8-16-16-6 16-6-8-16 16 8z"/><circle cx="32" cy="32" r="9" fill="#fff" opacity=".5"/>`,
  },
  sheep: {
    el: 'arcane',
    svg: `<g><circle cx="22" cy="30" r="10"/><circle cx="34" cy="24" r="11"/><circle cx="44" cy="32" r="10"/><circle cx="30" cy="38" r="11"/><rect x="20" y="42" width="5" height="14" rx="2"/><rect x="38" y="42" width="5" height="14" rx="2"/><ellipse cx="12" cy="30" rx="8" ry="7"/><circle cx="10" cy="29" r="1.6" fill="#16121f"/></g>`,
  },
  blizzard: {
    el: 'ice',
    svg: `${cloud}<g transform="translate(6 40) scale(.3)">${snowflake}</g><g transform="translate(24 44) scale(.3)">${snowflake}</g><g transform="translate(42 40) scale(.3)">${snowflake}</g>`,
  },
  evocation: {
    el: 'arcane',
    svg: `<g transform="translate(12 10) scale(.62)">${crystal}</g><g ${S} stroke-width="3.5"><path d="M8 32H2M62 32h-6M14 12l-4-4M50 12l4-4M14 52l-4 4M50 52l4 4"/></g>`,
  },
  pyro: {
    el: 'fire',
    svg: `<g transform="translate(-4 -2) scale(1.12)">${flame}</g><g transform="translate(20 34) scale(.38)" color="#16121f" opacity=".7">${skull}</g>`,
  },
  // ---- neutral
  potionRed: { el: 'nature', svg: potion('#e0404a') },
  potionOrange: { el: 'fire', svg: potion('#ff8a1f') },
  potionBlue: { el: 'arcane', svg: potion('#3f8cff') },
  bandage: {
    el: 'nature',
    svg: `<g transform="rotate(45 32 32)"><rect x="8" y="24" width="48" height="16" rx="8"/></g><g transform="rotate(-45 32 32)"><rect x="8" y="24" width="48" height="16" rx="8"/></g><g fill="#16121f" opacity=".4"><circle cx="29" cy="29" r="1.6"/><circle cx="35" cy="29" r="1.6"/><circle cx="29" cy="35" r="1.6"/><circle cx="35" cy="35" r="1.6"/></g>`,
  },
  dagger: {
    el: 'steel',
    svg: `<path d="M54 6l4 4-26 26-5-5z"/><path d="M22 30l12 12-3 3-12-12z"/><path d="M24 40l3 3-13 13a3 3 0 0 1-3-3z"/><g ${S} stroke-width="3" opacity=".7"><path d="M44 30l8 4M38 40l6 8"/></g>`,
  },
  smoke: {
    el: 'shadow',
    svg: `<circle cx="22" cy="40" r="14"/><circle cx="40" cy="36" r="16"/><circle cx="30" cy="22" r="12" opacity=".8"/><circle cx="48" cy="18" r="7" opacity=".6"/><circle cx="14" cy="18" r="5" opacity=".5"/>`,
  },
  // ---- curses
  slime: {
    el: 'curse',
    svg: `<path d="M10 52c0-18 10-34 22-34s22 16 22 34c0 4-3 6-6 6H16c-3 0-6-2-6-6z"/><circle cx="25" cy="38" r="5" fill="#16121f"/><circle cx="40" cy="38" r="5" fill="#16121f"/><circle cx="26" cy="36.5" r="1.6" fill="#fff"/><circle cx="41" cy="36.5" r="1.6" fill="#fff"/><path ${HI} d="M20 28c3-5 7-8 11-8-4 3-6 6-7 10z"/>`,
  },
  hex: { el: 'curse', svg: skull },

  // ---- statuses & intents
  fist: { el: 'blood', svg: fist },
  star: { el: 'arcane', svg: star4(32, 32, 28) },
  thorns: { el: 'nature', svg: `<path d="M32 4l5 16 14-8-6 15 15 5-15 5 6 15-14-8-5 16-5-16-14 8 6-15-15-5 15-5-6-15 14 8z"/>` },
  helm: { el: 'steel', svg: `<path d="M10 34C10 18 20 6 32 6s22 12 22 28v22H40V40H24v16H10z"/><path fill="#16121f" d="M18 30h28v6H18z"/>` },
  leaf: {
    el: 'nature',
    svg: `<path d="M10 54C10 26 26 10 56 8c0 30-16 46-44 46z"/><path d="M12 52L42 22" stroke="#16121f" stroke-width="3" opacity=".4"/>`,
  },
  rage: { el: 'blood', svg: flame },
  wing: { el: 'holy', svg: wing },
  drop: { el: 'nature', svg: `<path d="M32 5c8 14 17 24 17 36a17 17 0 0 1-34 0c0-12 9-22 17-36z"/>` },
  broken: {
    el: 'shadow',
    svg: `<path d="M52 5h7v7L44 27l-7-7z"/><path d="M34 23l7 7-11 11-3-6-4 1z"/><path d="M13 33l18 18-4 4L9 37z"/><path d="M17 45l4 4-9 9-4-4z"/>`,
  },
  crack: {
    el: 'shadow',
    svg: `${shield.replace(HI, 'fill="#16121f" opacity=".0"')}<path d="M34 6l-6 16 8 6-8 12 4 10" stroke="#16121f" stroke-width="4" fill="none"/>`,
  },
  snow: { el: 'ice', svg: snowflake },
  stars: { el: 'holy', svg: star4(16, 20, 12) + star4(44, 16, 10) + star4(32, 44, 14) },
  skull: { el: 'shadow', svg: skull },
  up: { el: 'holy', svg: `<path d="M32 4l24 26H42v28H22V30H8z"/>` },
  hand: {
    el: 'shadow',
    svg: `<path d="M18 58c-6-6-10-14-10-22V22c0-3 2-5 4-5s4 2 4 5v10h2V12c0-3 2-5 4-5s4 2 4 5v18h2V8c0-3 2-5 4-5s4 2 4 5v22h2V12c0-3 2-5 4-5s4 2 4 5v28c0 10-6 18-14 18z"/>`,
  },
  burst: { el: 'shadow', svg: `<path d="M32 2l6 16 16-8-8 16 16 6-16 6 8 16-16-8-6 16-6-16-16 8 8-16-16-6 16-6-8-16 16 8z"/>` },
  bolt2: { el: 'arcane', svg: bolt },
  cards: {
    el: 'steel',
    svg: `<rect x="20" y="6" width="28" height="40" rx="4" transform="rotate(12 34 26)" opacity=".55"/><rect x="14" y="14" width="28" height="40" rx="4"/>`,
  },
  pause: { el: 'steel', svg: `<rect x="16" y="10" width="11" height="44" rx="3"/><rect x="37" y="10" width="11" height="44" rx="3"/>` },
  gate: {
    el: 'curse',
    svg: `<rect x="4" y="8" width="56" height="9"/><rect x="4" y="47" width="56" height="9"/><path d="M8 17h7v30H8zM22 17h7v30h-7zM36 17h7v30h-7zM50 17h7v30h-7z"/><rect x="26" y="26" width="12" height="12" fill="#16121f"/>`,
  },
  coffee: {
    el: 'fire',
    svg: `<path d="M8 28h38v16c0 9-7 16-16 16h-6C15 60 8 53 8 44z"/><path d="M46 32h5c6 0 10 4 10 9s-4 9-10 9h-6v-7h6c2 0 3-1 3-2s-1-2-3-2h-5z"/><g ${S} stroke-width="4.5"><path d="M18 22c-4-5 4-8 0-14M28 22c-4-5 4-8 0-14M38 22c-4-5 4-8 0-14"/></g>`,
  },
  clipboard: {
    el: 'steel',
    svg: `<rect x="10" y="8" width="44" height="54" rx="4"/><rect x="21" y="3" width="22" height="12" rx="3" fill="#16121f"/><path d="M17 28l5 5 9-9M17 45l5 5 9-9M37 30h10M37 47h10" fill="none" stroke="#16121f" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  tophat: {
    el: 'shadow',
    svg: `<path d="M17 6h30v38H17z"/><rect x="17" y="32" width="30" height="6" fill="#16121f"/><path d="M3 44h58c0 8-6 13-13 13H16C9 57 3 52 3 44z"/>`,
  },
  // Candle flame animation: three frames (outer flame + bright core each).
  flameA: { el: 'fire', svg: `<path d="M32 4C40 18 50 28 50 42a18 18 0 0 1-36 0c0-12 10-24 18-38z"/>` },
  flameAc: { el: 'fire', svg: `<path d="M32 26c4 8 10 12 10 20a10 10 0 0 1-20 0c0-8 6-12 10-20z"/>` },
  flameB: { el: 'fire', svg: `<path d="M22 6c12 12 28 22 26 38a17 17 0 0 1-34 0c-1-12 4-22 8-38z"/>` },
  flameBc: { el: 'fire', svg: `<path d="M26 28c5 8 12 12 11 20a10 10 0 0 1-20-1c1-7 5-11 9-19z"/>` },
  flameC: { el: 'fire', svg: `<path d="M42 4c2 14 10 24 8 40a18 18 0 0 1-36-2c0-12 10-18 14-30 2 6 4 8 6 8 2-4 4-8 8-16z"/>` },
  flameCc: { el: 'fire', svg: `<path d="M36 28c3 8 9 12 8 20a10 10 0 0 1-20 0c0-8 7-12 12-20z"/>` },
  swap: {
    el: 'steel',
    svg: `<path d="M20 4l14 16h-9v26h-10V20H6zM44 60L30 44h9V18h10v26h9z"/>`,
  },
  // Innate: a starting flag ("this card comes first").
  flag: {
    el: 'holy',
    svg: `<rect x="12" y="4" width="7" height="56" rx="2"/><path d="M19 6h34l-9 12 9 12H19z"/><path fill="#fff" opacity=".35" d="M19 6h34l-3 4H19z"/>`,
  },
  bomb: {
    el: 'curse',
    svg: `<circle cx="28" cy="38" r="20"/><rect x="36" y="12" width="10" height="10" transform="rotate(45 41 17)"/><path d="M44 12c4-6 10-6 14-2" stroke="currentColor" stroke-width="4" fill="none"/><path ${HI} d="M16 32c2-6 7-10 12-10-2 4-2 8 0 12-5 1-9 0-12-2z"/>${star4(58, 8, 6)}`,
  },
  bone: {
    el: 'necro',
    svg: `<path d="M8 50l30-30-3-6a6 6 0 1 1 9-6 6 6 0 1 1 6 9l6 3-30 30 3 6a6 6 0 1 1-9 6 6 6 0 1 1-6-9z"/><path d="M52 4L40 22l4 4 18-12z"/>`,
  },
  tomb: {
    el: 'necro',
    svg: `<path d="M14 58V24c0-12 8-20 18-20s18 8 18 20v34z"/><path d="M29 16h6v8h8v6h-8v14h-6V30h-8v-6h8z" fill="#16121f"/><rect x="6" y="56" width="52" height="6"/>`,
  },
  gear: {
    el: 'steel',
    svg: `<path d="M27 4h10l2 8 6 3 7-4 7 7-4 7 3 6 8 2v10l-8 2-3 6 4 7-7 7-7-4-6 3-2 8H27l-2-8-6-3-7 4-7-7 4-7-3-6-8-2V27l8-2 3-6-4-7 7-7 7 4 6-3z"/><circle cx="32" cy="32" r="10" fill="#16121f"/>`,
  },
  left: { el: 'steel', svg: `<path d="M4 32L30 8v14h30v20H30v14z"/>` },
  cross: { el: 'shadow', svg: `<path d="M8 16l8-8 16 16 16-16 8 8-16 16 16 16-8 8-16-16-16 16-8-8 16-16z"/>` },
  crown: { el: 'holy', svg: `<path d="M6 20l14 12 12-22 12 22 14-12-6 32H12z"/><rect x="12" y="52" width="40" height="6" rx="2"/>` },
};

export const INTENT_ICON: Record<string, string> = {
  attack: 'sword',
  defend: 'shield',
  buff: 'up',
  debuff: 'broken',
  curse: 'skull',
  heal: 'heart',
  steal: 'hand',
  charge: 'burst',
  drain: 'crystal',
};

/** Animated pixel candle flame: three hand-drawn frames cycled slowly. */
export function candleFlame(): string {
  return `<span class="flame" aria-hidden="true">${['A', 'B', 'C'].map((f) => `<span class="ff">${pixelIcon(`flame${f}`, 'fo')}${pixelIcon(`flame${f}c`, 'fc')}</span>`).join('')}</span>`;
}

/** Pixel icon (see riso.ts). The vector source above is rasterised once at boot. */
export function icon(id: string, cls = ''): string {
  return pixelIcon(id, cls);
}
