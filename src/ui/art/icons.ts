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
const muscle = `<path d="M4 56V46C4 36 12 26 22 25c8-1 14 3 18 11V20h-4V10c0-4 3-6 7-6h10c4 0 7 2 7 6v10h-4v22c0 9-4 14-10 14z"/><path fill="none" stroke="#16121f" stroke-width="2" opacity=".45" d="M42 4v10M48 4v10M54 4v10M12 46c4-7 12-8 18-4"/>`;
const wing = `<path d="M6 44C14 20 34 8 58 8c-6 6-8 10-9 14 3-1 6-1 9 0-5 5-10 8-15 9 3 1 6 2 8 4-9 4-19 6-28 5-6 0-12 2-17 4z"/>`;

export const ICONS: Record<string, { el: Element; svg: string }> = {
  // ---- warrior
  sword: { el: 'steel', svg: sword },
  shield: { el: 'steel', svg: shield },
  hammer: {
    el: 'steel',
    svg: `<g transform="rotate(-38 32 32)"><rect x="29" y="20" width="6" height="42" rx="2"/><rect x="15" y="6" width="34" height="17" rx="3"/><rect ${HI} x="17" y="8" width="30" height="4" rx="2"/></g>`,
  },
  wall: {
    el: 'steel',
    svg: `<path d="M6 12h24v10H6zM34 12h24v10H34zM6 26h12v10H6zM22 26h20v10H22zM46 26h12v10H46zM6 40h24v10H6zM34 40h24v10H34z"/><path ${HI} d="M6 12h52v3H6z"/>`,
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
  bankrupt: {
    el: 'steel',
    svg: `<path d="M4 26h48v32H4z"/><path d="M6 26l32-14 6 14z"/><rect x="38" y="34" width="22" height="14" rx="2"/><circle cx="46" cy="41" r="3" fill="#16121f"/><path d="M12 4l6 8 6-8-2 12h-8zM30 2l4 5 4-5-1 8h-6z"/>`,
  },
  heart: { el: 'nature', svg: heart },
  fortress: {
    el: 'steel',
    svg: `<path d="M10 12h8v6h6v-6h6v6h4v-6h6v6h6v-6h8v46H10z"/><path fill="#16121f" opacity=".55" d="M26 58V44a6 6 0 0 1 12 0v14z"/><path ${HI} d="M10 22h44v3H10z"/>`,
  },
  picketSign: {
    el: 'blood',
    svg: `<path d="M3.2 3.2h57.6v3.2h-57.6zM3.2 6.4h57.6v3.2h-57.6zM3.2 9.6h25.6v3.2h-25.6zM35.2 9.6h25.6v3.2h-25.6zM3.2 12.8h25.6v3.2h-25.6zM35.2 12.8h25.6v3.2h-25.6zM3.2 16h25.6v3.2h-25.6zM35.2 16h25.6v3.2h-25.6zM3.2 19.2h25.6v3.2h-25.6zM35.2 19.2h25.6v3.2h-25.6zM3.2 22.4h25.6v3.2h-25.6zM35.2 22.4h25.6v3.2h-25.6zM3.2 25.6h57.6v3.2h-57.6zM3.2 28.8h25.6v3.2h-25.6zM35.2 28.8h25.6v3.2h-25.6zM3.2 32h25.6v3.2h-25.6zM35.2 32h25.6v3.2h-25.6zM3.2 35.2h57.6v3.2h-57.6zM3.2 38.4h57.6v3.2h-57.6zM28.8 41.6h6.4v3.2h-6.4zM28.8 44.8h6.4v3.2h-6.4zM28.8 48h6.4v3.2h-6.4zM28.8 51.2h6.4v3.2h-6.4zM28.8 54.4h6.4v3.2h-6.4zM28.8 57.6h6.4v3.2h-6.4zM28.8 60.8h6.4v3.2h-6.4z"/>`,
  },
  fang: { el: 'blood', svg: `<path d="M6 12h52c0 6-3 9-8 10L42 58 34 22h-4l-8 36-8-36c-5-1-8-4-8-10z"/><path ${HI} d="M18 24l6 22 2-24z"/>` },
  quake: {
    el: 'steel',
    svg: `<path d="M4 44h56v14H4z"/><path fill="#16121f" d="M30 44l-4 6 5 3-3 5h5l3-6-5-3 3-5z"/><path d="M12 30l7-6 6 5-4 9zM40 26l8-4 5 8-8 5zM28 14l6-4 4 6-6 4z"/>`,
  },
  // ---- mage
  clippy: {
    el: 'arcane',
    svg: `<path d="M19.2 0h25.6v3.2h-25.6zM12.8 3.2h38.4v3.2h-38.4zM6.4 6.4h22.4v3.2h-22.4zM35.2 6.4h22.4v3.2h-22.4zM6.4 9.6h6.4v3.2h-6.4zM51.2 9.6h6.4v3.2h-6.4zM6.4 12.8h6.4v3.2h-6.4zM16 12.8h9.6v3.2h-9.6zM38.4 12.8h9.6v3.2h-9.6zM51.2 12.8h6.4v3.2h-6.4zM6.4 16h6.4v3.2h-6.4zM16 16h9.6v3.2h-9.6zM38.4 16h9.6v3.2h-9.6zM51.2 16h6.4v3.2h-6.4zM6.4 19.2h6.4v3.2h-6.4zM16 19.2h3.2v3.2h-3.2zM22.4 19.2h3.2v3.2h-3.2zM38.4 19.2h3.2v3.2h-3.2zM44.8 19.2h3.2v3.2h-3.2zM51.2 19.2h6.4v3.2h-6.4zM6.4 22.4h6.4v3.2h-6.4zM16 22.4h9.6v3.2h-9.6zM38.4 22.4h9.6v3.2h-9.6zM51.2 22.4h6.4v3.2h-6.4zM6.4 25.6h6.4v3.2h-6.4zM51.2 25.6h6.4v3.2h-6.4zM6.4 28.8h6.4v3.2h-6.4zM51.2 28.8h6.4v3.2h-6.4zM6.4 32h6.4v3.2h-6.4zM19.2 32h25.6v3.2h-25.6zM51.2 32h6.4v3.2h-6.4zM6.4 35.2h6.4v3.2h-6.4zM19.2 35.2h6.4v3.2h-6.4zM38.4 35.2h6.4v3.2h-6.4zM51.2 35.2h6.4v3.2h-6.4zM6.4 38.4h6.4v3.2h-6.4zM19.2 38.4h6.4v3.2h-6.4zM38.4 38.4h6.4v3.2h-6.4zM51.2 38.4h6.4v3.2h-6.4zM6.4 41.6h6.4v3.2h-6.4zM19.2 41.6h6.4v3.2h-6.4zM38.4 41.6h6.4v3.2h-6.4zM51.2 41.6h6.4v3.2h-6.4zM6.4 44.8h6.4v3.2h-6.4zM19.2 44.8h6.4v3.2h-6.4zM38.4 44.8h6.4v3.2h-6.4zM6.4 48h6.4v3.2h-6.4zM38.4 48h6.4v3.2h-6.4zM6.4 51.2h6.4v3.2h-6.4zM38.4 51.2h6.4v3.2h-6.4zM6.4 54.4h6.4v3.2h-6.4zM38.4 54.4h6.4v3.2h-6.4zM6.4 57.6h38.4v3.2h-38.4zM12.8 60.8h25.6v3.2h-25.6z"/>`,
  },
  ward: {
    el: 'arcane',
    svg: `<path d="M32 4l24 14v28L32 60 8 46V18z"/><path fill="#16121f" opacity=".4" d="M32 13l16 9v20l-16 9-16-9V22z"/><path d="M32 20l3 9h9l-7 6 3 9-8-5-8 5 3-9-7-6h9z"/>`,
  },
  fireball: {
    el: 'fire',
    svg: `<path d="M4 58c8-16 16-26 26-32l8 8C32 44 22 52 4 58z" opacity=".55"/><circle cx="40" cy="24" r="17"/><circle cx="40" cy="24" r="9" fill="#fff" opacity=".45"/>`,
  },
  iceLance: { el: 'ice', svg: `<path d="M58 6L48 26 18 56l-8-2-2-8L38 16z"/><path ${HI} d="M58 6L40 18l-2-2z"/><path d="M8 46l10 10-8 4-6-6z"/>` },
  crystal: { el: 'arcane', svg: crystal },
  crystalSlot: { el: 'arcane', svg: crystalSlot },
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
  beetle: {
    el: 'arcane',
    svg: `<ellipse cx="32" cy="38" rx="15" ry="19"/><circle cx="32" cy="15" r="8"/><path d="M32 22v34" stroke="#16121f" stroke-width="3"/><g ${S} stroke-width="4"><path d="M18 28L7 22M17 39H5M18 50L7 57M46 28l11-6M47 39h12M46 50l11 7M28 9l-5-6M36 9l5-6"/></g>`,
  },
  blizzard: {
    el: 'ice',
    svg: `${cloud}<g transform="translate(6 40) scale(.3)">${snowflake}</g><g transform="translate(24 44) scale(.3)">${snowflake}</g><g transform="translate(42 40) scale(.3)">${snowflake}</g>`,
  },
  // ---- neutral
  medkit: {
    el: 'nature',
    svg: `<path d="M19.2 6.4h25.6v3.2h-25.6zM19.2 9.6h6.4v3.2h-6.4zM38.4 9.6h6.4v3.2h-6.4zM19.2 12.8h6.4v3.2h-6.4zM38.4 12.8h6.4v3.2h-6.4zM6.4 16h51.2v3.2h-51.2zM3.2 19.2h57.6v3.2h-57.6zM3.2 22.4h22.4v3.2h-22.4zM38.4 22.4h22.4v3.2h-22.4zM3.2 25.6h22.4v3.2h-22.4zM38.4 25.6h22.4v3.2h-22.4zM3.2 28.8h22.4v3.2h-22.4zM38.4 28.8h22.4v3.2h-22.4zM3.2 32h12.8v3.2h-12.8zM48 32h12.8v3.2h-12.8zM3.2 35.2h12.8v3.2h-12.8zM48 35.2h12.8v3.2h-12.8zM3.2 38.4h12.8v3.2h-12.8zM48 38.4h12.8v3.2h-12.8zM3.2 41.6h12.8v3.2h-12.8zM48 41.6h12.8v3.2h-12.8zM3.2 44.8h22.4v3.2h-22.4zM38.4 44.8h22.4v3.2h-22.4zM3.2 48h22.4v3.2h-22.4zM38.4 48h22.4v3.2h-22.4zM3.2 51.2h22.4v3.2h-22.4zM38.4 51.2h22.4v3.2h-22.4zM3.2 54.4h57.6v3.2h-57.6zM6.4 57.6h51.2v3.2h-51.2z"/>`,
  },
  potionOrange: { el: 'fire', svg: potion('#ff8a1f') },
  energyCan: {
    el: 'arcane',
    svg: `<path d="M32 0h9.6v3.2h-9.6zM19.2 3.2h25.6v3.2h-25.6zM16 6.4h32v3.2h-32zM19.2 9.6h25.6v3.2h-25.6zM19.2 12.8h25.6v3.2h-25.6zM19.2 16h12.8v3.2h-12.8zM41.6 16h3.2v3.2h-3.2zM19.2 19.2h9.6v3.2h-9.6zM38.4 19.2h6.4v3.2h-6.4zM19.2 22.4h6.4v3.2h-6.4zM35.2 22.4h9.6v3.2h-9.6zM19.2 25.6h3.2v3.2h-3.2zM41.6 25.6h3.2v3.2h-3.2zM19.2 28.8h12.8v3.2h-12.8zM38.4 28.8h6.4v3.2h-6.4zM19.2 32h9.6v3.2h-9.6zM35.2 32h9.6v3.2h-9.6zM19.2 35.2h6.4v3.2h-6.4zM32 35.2h12.8v3.2h-12.8zM19.2 38.4h6.4v3.2h-6.4zM28.8 38.4h16v3.2h-16zM19.2 41.6h3.2v3.2h-3.2zM25.6 41.6h19.2v3.2h-19.2zM19.2 44.8h25.6v3.2h-25.6zM19.2 48h25.6v3.2h-25.6zM16 51.2h32v3.2h-32zM19.2 54.4h25.6v3.2h-25.6z"/>`,
  },
  bandage: {
    el: 'nature',
    svg: `<g transform="rotate(45 32 32)"><rect x="8" y="24" width="48" height="16" rx="8"/></g><g transform="rotate(-45 32 32)"><rect x="8" y="24" width="48" height="16" rx="8"/></g><g fill="#16121f" opacity=".4"><circle cx="29" cy="29" r="1.6"/><circle cx="35" cy="29" r="1.6"/><circle cx="29" cy="35" r="1.6"/><circle cx="35" cy="35" r="1.6"/></g>`,
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

  // ---- statuses & intents
  muscle: { el: 'blood', svg: muscle },
  star: { el: 'arcane', svg: star4(32, 32, 28) },
  thorns: { el: 'nature', svg: `<path d="M32 4l5 16 14-8-6 15 15 5-15 5 6 15-14-8-5 16-5-16-14 8 6-15-15-5 15-5-6-15 14 8z"/>` },
  helm: { el: 'steel', svg: `<path d="M10 34C10 18 20 6 32 6s22 12 22 28v22H40V40H24v16H10z"/><path fill="#16121f" d="M18 30h28v6H18z"/>` },
  leaf: {
    el: 'nature',
    svg: `<path d="M10 54C10 26 26 10 56 8c0 30-16 46-44 46z"/><path d="M12 52L42 22" stroke="#16121f" stroke-width="3" opacity=".4"/>`,
  },
  // Enraged (an enemy at half HP): the comic anger vein.
  rage: {
    el: 'blood',
    svg: `<path d="M6 22c10 0 14-4 14-14h9c0 15-8 23-23 23zM58 22c-10 0-14-4-14-14h-9c0 15 8 23 23 23zM6 42c10 0 14 4 14 14h9c0-15-8-23-23-23zM58 42c-10 0-14 4-14 14h-9c0-15 8-23 23-23z"/>`,
  },
  wing: { el: 'holy', svg: wing },
  // A Power: lasts for the rest of the fight.
  infinity: {
    el: 'holy',
    svg: `<ellipse cx="19" cy="32" rx="16" ry="14"/><ellipse cx="45" cy="32" rx="16" ry="14"/><ellipse cx="19" cy="32" rx="7" ry="5" fill="#16121f"/><ellipse cx="45" cy="32" rx="7" ry="5" fill="#16121f"/>`,
  },
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
  target: {
    el: 'fire',
    svg: `<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="15" fill="#16121f"/><circle cx="32" cy="32" r="8"/><g ${S} stroke-width="5"><path d="M32 2v14M32 48v14M2 32h14M48 32h14"/></g>`,
  },
  swap: {
    el: 'steel',
    svg: `<path d="M20 4l14 16h-9v26h-10V20H6zM44 60L30 44h9V18h10v26h9z"/>`,
  },
  // Innate: a starting flag ("this card comes first").
  flag: {
    el: 'holy',
    svg: `<rect x="12" y="4" width="7" height="56" rx="2"/><path d="M19 6h34l-9 12 9 12H19z"/><path fill="#fff" opacity=".35" d="M19 6h34l-3 4H19z"/>`,
  },
  skullBomb: {
    el: 'curse',
    svg: `<circle cx="30" cy="38" r="22"/><rect x="38" y="10" width="10" height="10" transform="rotate(45 43 15)"/><path d="M46 10c4-6 10-6 14-2" stroke="currentColor" stroke-width="4" fill="none"/><g fill="#16121f"><path d="M18 32h9v9h-9zM33 32h9v9h-9zM27 45h6v5h-6z"/><path d="M20 52h20v3H20z"/></g>${star4(58, 6, 6)}`,
  },
  bomb: {
    el: 'curse',
    svg: `<circle cx="28" cy="38" r="20"/><rect x="36" y="12" width="10" height="10" transform="rotate(45 41 17)"/><path d="M44 12c4-6 10-6 14-2" stroke="currentColor" stroke-width="4" fill="none"/><path ${HI} d="M16 32c2-6 7-10 12-10-2 4-2 8 0 12-5 1-9 0-12-2z"/>${star4(58, 8, 6)}`,
  },
  bone: {
    el: 'necro',
    svg: `<path d="M8 50l30-30-3-6a6 6 0 1 1 9-6 6 6 0 1 1 6 9l6 3-30 30 3 6a6 6 0 1 1-9 6 6 6 0 1 1-6-9z"/><path d="M52 4L40 22l4 4 18-12z"/>`,
  },
  dasKapital: {
    el: 'necro',
    svg: `<path d="M9.6 3.2h6.4v3.2h-6.4zM19.2 3.2h32v3.2h-32zM9.6 6.4h6.4v3.2h-6.4zM19.2 6.4h32v3.2h-32zM54.4 6.4h6.4v3.2h-6.4zM9.6 9.6h6.4v3.2h-6.4zM19.2 9.6h3.2v3.2h-3.2zM48 9.6h3.2v3.2h-3.2zM54.4 9.6h6.4v3.2h-6.4zM9.6 12.8h6.4v3.2h-6.4zM19.2 12.8h3.2v3.2h-3.2zM48 12.8h3.2v3.2h-3.2zM54.4 12.8h6.4v3.2h-6.4zM9.6 16h6.4v3.2h-6.4zM19.2 16h32v3.2h-32zM54.4 16h6.4v3.2h-6.4zM9.6 19.2h6.4v3.2h-6.4zM19.2 19.2h32v3.2h-32zM54.4 19.2h6.4v3.2h-6.4zM9.6 22.4h6.4v3.2h-6.4zM19.2 22.4h12.8v3.2h-12.8zM38.4 22.4h12.8v3.2h-12.8zM54.4 22.4h6.4v3.2h-6.4zM9.6 25.6h6.4v3.2h-6.4zM19.2 25.6h12.8v3.2h-12.8zM38.4 25.6h12.8v3.2h-12.8zM54.4 25.6h6.4v3.2h-6.4zM9.6 28.8h6.4v3.2h-6.4zM19.2 28.8h3.2v3.2h-3.2zM48 28.8h3.2v3.2h-3.2zM54.4 28.8h6.4v3.2h-6.4zM9.6 32h6.4v3.2h-6.4zM19.2 32h6.4v3.2h-6.4zM44.8 32h6.4v3.2h-6.4zM54.4 32h6.4v3.2h-6.4zM9.6 35.2h6.4v3.2h-6.4zM19.2 35.2h9.6v3.2h-9.6zM41.6 35.2h9.6v3.2h-9.6zM54.4 35.2h6.4v3.2h-6.4zM9.6 38.4h6.4v3.2h-6.4zM19.2 38.4h9.6v3.2h-9.6zM41.6 38.4h9.6v3.2h-9.6zM54.4 38.4h6.4v3.2h-6.4zM9.6 41.6h6.4v3.2h-6.4zM19.2 41.6h6.4v3.2h-6.4zM32 41.6h6.4v3.2h-6.4zM44.8 41.6h6.4v3.2h-6.4zM54.4 41.6h6.4v3.2h-6.4zM9.6 44.8h6.4v3.2h-6.4zM19.2 44.8h6.4v3.2h-6.4zM28.8 44.8h12.8v3.2h-12.8zM44.8 44.8h6.4v3.2h-6.4zM54.4 44.8h6.4v3.2h-6.4zM9.6 48h6.4v3.2h-6.4zM19.2 48h32v3.2h-32zM54.4 48h6.4v3.2h-6.4zM9.6 51.2h6.4v3.2h-6.4zM19.2 51.2h32v3.2h-32zM54.4 51.2h6.4v3.2h-6.4zM9.6 54.4h6.4v3.2h-6.4zM19.2 54.4h32v3.2h-32zM38.4 57.6h6.4v3.2h-6.4zM38.4 60.8h6.4v3.2h-6.4z"/>`,
  },
  gear: {
    el: 'steel',
    // Eight square teeth and a wide hole: it has to read at 20 px.
    svg: `<circle cx="32" cy="32" r="21"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="26.5" y="4" width="11" height="12" transform="rotate(${a} 32 32)"/>`).join('')}<circle cx="32" cy="32" r="10" fill="#16121f"/>`,
  },
  left: { el: 'steel', svg: `<path d="M4 32L30 8v14h30v20H30v14z"/>` },
  cross: { el: 'shadow', svg: `<path d="M8 16l8-8 16 16 16-16 8 8-16 16 16 16-8 8-16-16-16 16-8-8 16-16z"/>` },
  crown: { el: 'holy', svg: `<path d="M6 20l14 12 12-22 12 22 14-12-6 32H12z"/><rect x="12" y="52" width="40" height="6" rx="2"/>` },
  // ---- Card art: one drawing per card, never shared with a rule icon (see content test).
  punchCard: {
    el: 'steel',
    svg: `<path d="M10 6h36l10 10v42H10z"/><g fill="#16121f"><rect x="18" y="16" width="6" height="10"/><rect x="30" y="24" width="6" height="10"/><rect x="42" y="18" width="6" height="10"/><rect x="18" y="38" width="6" height="10"/><rect x="36" y="42" width="6" height="10"/></g>`,
  },
  hardHat: {
    el: 'steel',
    svg: `<path d="M10 42c0-16 10-28 22-28s22 12 22 28z"/><rect x="4" y="42" width="56" height="9" rx="2"/><rect x="29" y="16" width="6" height="26" fill="#16121f"/>`,
  },
  movingBox: {
    el: 'curse',
    svg: `<path d="M6 24l26-10 26 10v30L32 62 6 54z"/><g fill="#16121f"><path d="M32 30v32h-3V30zM6 24l26 8 26-8-26-8zM12 36h8v3h-8z"/></g><path d="M2 20l24-8 6 6-24 8zM62 20l-24-8-6 6 24 8z"/>`,
  },
  liftingWorker: {
    el: 'steel',
    svg: `<path d="M6.4 3.2h51.2v3.2h-51.2zM6.4 6.4h51.2v3.2h-51.2zM6.4 9.6h6.4v3.2h-6.4zM51.2 9.6h6.4v3.2h-6.4zM6.4 12.8h51.2v3.2h-51.2zM6.4 16h51.2v3.2h-51.2zM12.8 19.2h6.4v3.2h-6.4zM44.8 19.2h6.4v3.2h-6.4zM12.8 22.4h6.4v3.2h-6.4zM25.6 22.4h12.8v3.2h-12.8zM44.8 22.4h6.4v3.2h-6.4zM16 25.6h6.4v3.2h-6.4zM25.6 25.6h12.8v3.2h-12.8zM41.6 25.6h6.4v3.2h-6.4zM16 28.8h6.4v3.2h-6.4zM25.6 28.8h12.8v3.2h-12.8zM41.6 28.8h6.4v3.2h-6.4zM19.2 32h25.6v3.2h-25.6zM22.4 35.2h19.2v3.2h-19.2zM22.4 38.4h19.2v3.2h-19.2zM22.4 41.6h19.2v3.2h-19.2zM22.4 44.8h19.2v3.2h-19.2zM22.4 48h6.4v3.2h-6.4zM35.2 48h6.4v3.2h-6.4zM22.4 51.2h6.4v3.2h-6.4zM35.2 51.2h6.4v3.2h-6.4zM22.4 54.4h6.4v3.2h-6.4zM35.2 54.4h6.4v3.2h-6.4zM22.4 57.6h6.4v3.2h-6.4zM35.2 57.6h6.4v3.2h-6.4zM19.2 60.8h9.6v3.2h-9.6zM35.2 60.8h9.6v3.2h-9.6z"/>`,
  },
  doubleClock: {
    el: 'blood',
    svg: `<circle cx="22" cy="28" r="18"/><circle cx="42" cy="38" r="18"/><path d="M42 38V26M42 38l8 5" stroke="#16121f" stroke-width="4.5" stroke-linecap="round" fill="none"/>`,
  },
  grievance: {
    el: 'steel',
    svg: `<path d="M12 4h30l10 10v46H12z"/><rect x="28" y="16" width="8" height="22" fill="#16121f"/><rect x="28" y="44" width="8" height="8" fill="#16121f"/>`,
  },
  pushback: { el: 'steel', svg: `<path d="M6 10l22 22L6 54V40l8-8-8-8zM32 10l22 22-22 22V40l8-8-8-8z"/>` },
  virus: {
    el: 'nature',
    svg: `<circle cx="32" cy="32" r="16"/><g ${S} stroke-width="5"><path d="M32 4v12M32 48v12M4 32h12M48 32h12M12 12l9 9M43 43l9 9M52 12l-9 9M21 43l-9 9"/></g><g fill="#16121f"><rect x="25" y="26" width="5" height="5"/><rect x="35" y="35" width="5" height="5"/><rect x="34" y="24" width="4" height="4"/></g>`,
  },
  rust: {
    el: 'fire',
    svg: `<path d="M20 6h24l16 26-16 26H20L4 32z"/><circle cx="32" cy="32" r="9" fill="#16121f"/><g fill="#16121f"><rect x="8" y="26" width="6" height="6"/><rect x="48" y="14" width="6" height="6"/><rect x="40" y="46" width="8" height="6"/><rect x="22" y="12" width="5" height="5"/></g>`,
  },
  mop: {
    el: 'steel',
    svg: `<path d="M48 2l8 4-24 36-8-4z"/><path d="M6 42l22 6 8 14H2z"/><g fill="#16121f"><rect x="9" y="54" width="3" height="8"/><rect x="17" y="54" width="3" height="8"/><rect x="25" y="54" width="3" height="8"/></g>`,
  },
  windUp: {
    el: 'steel',
    svg: `<rect x="14" y="6" width="28" height="22"/><g fill="#16121f"><rect x="20" y="13" width="6" height="6"/><rect x="30" y="13" width="6" height="6"/><rect x="22" y="22" width="12" height="3"/></g><rect x="12" y="30" width="32" height="22"/><rect x="14" y="52" width="10" height="10"/><rect x="32" y="52" width="10" height="10"/><rect x="44" y="38" width="6" height="4"/><rect x="50" y="32" width="12" height="16"/><rect x="54" y="38" width="4" height="4" fill="#16121f"/>`,
  },
  windKey: {
    el: 'steel',
    svg: `<circle cx="20" cy="32" r="16"/><circle cx="20" cy="32" r="6" fill="#16121f"/><rect x="32" y="29" width="28" height="7"/><rect x="48" y="36" width="6" height="12"/><rect x="38" y="36" width="5" height="8"/>`,
  },
  sandwich: {
    el: 'nature',
    svg: `<path d="M4 32L32 8l28 24z"/><rect x="4" y="34" width="56" height="8"/><rect x="4" y="46" width="56" height="10"/><path d="M8 42h48l-4 4H12z" fill="#16121f"/>`,
  },
  employeeOfTheMonth: {
    el: 'holy',
    svg: `<rect x="4" y="8" width="46" height="54"/><rect x="10" y="14" width="34" height="32" fill="#16121f"/><circle cx="27" cy="26" r="8.5"/><path d="M14 46c0-9 6-14 13-14s13 5 13 14z"/><rect x="11" y="51" width="32" height="6" fill="#16121f"/><path d="M16 54h6M28 54h10" stroke="#fff" stroke-width="2.5"/><path stroke="#16121f" stroke-width="4" stroke-linejoin="round" d="M50 1l4.4 9.5 10.3 1.2-7.6 7 2 10.2L50 23l-9.1 5 2-10.2-7.6-7 10.3-1.2z"/><path d="M50 1l4.4 9.5 10.3 1.2-7.6 7 2 10.2L50 23l-9.1 5 2-10.2-7.6-7 10.3-1.2z"/>`,
  },
  safetySign: {
    el: 'holy',
    svg: `<path d="M32 4l30 54H2z"/><rect x="28" y="20" width="8" height="20" fill="#16121f"/><rect x="28" y="44" width="8" height="8" fill="#16121f"/>`,
  },
  forklift: {
    el: 'steel',
    svg: `<path d="M6 20h22l8 18v12H6z"/><rect x="40" y="4" width="6" height="48"/><path d="M46 44h16v6H46z"/><circle cx="14" cy="54" r="7"/><circle cx="30" cy="54" r="7"/><rect x="10" y="24" width="14" height="10" fill="#16121f"/>`,
  },
  hazardCoin: {
    el: 'holy',
    svg: `<circle cx="32" cy="32" r="27"/><g fill="#16121f"><path d="M12 24l6-8 30 30-6 8zM26 10l8-3 22 22-3 8z"/><path d="M8 40l3-8 22 22-8 3z"/></g>`,
  },
  megaphone: {
    el: 'blood',
    svg: `<path d="M4 24h12l30-16v48L16 40H4z"/><path d="M14 40l4 18h9l-4-18z"/><g ${S} stroke-width="4.5"><path d="M52 22c6 5 6 15 0 20"/></g>`,
  },
  shoulderCheck: {
    el: 'steel',
    svg: `<circle cx="22" cy="12" r="9"/><path d="M8 26h24l16 10-5 8-11-6v24H14V44l-6 6-6-6z"/><g ${S} stroke-width="4.5"><path d="M52 24l9-6M54 38h9"/></g>`,
  },
  crowbar: {
    el: 'steel',
    svg: `<path d="M44 4h8c6 0 10 4 10 10v4h-6v-4c0-3-1-4-4-4h-4z"/><path d="M50 16l6 4L14 60l-6-4z"/><path d="M8 56l-6-6 4-4 6 6z"/>`,
  },
  stonks: {
    el: 'blood',
    svg: `<rect x="4" y="4" width="5" height="56"/><rect x="4" y="55" width="56" height="5"/><g ${S} stroke-width="6"><path d="M15 46l11-12 8 8 16-20"/></g><path d="M42 12h18v18z"/>`,
  },
  // Mage
  echo: {
    el: 'arcane',
    svg: `<circle cx="14" cy="32" r="9"/><g ${S} stroke-width="5"><path d="M28 18c8 8 8 20 0 28M38 10c13 12 13 32 0 44M48 4c17 16 17 40 0 56"/></g>`,
  },
  keyboard: {
    el: 'arcane',
    svg: `<rect x="4" y="16" width="56" height="32" rx="3"/><g fill="#16121f"><rect x="10" y="22" width="8" height="7"/><rect x="22" y="22" width="8" height="7"/><rect x="34" y="22" width="8" height="7"/><rect x="46" y="22" width="8" height="7"/><rect x="10" y="33" width="8" height="7"/><rect x="46" y="33" width="8" height="7"/><rect x="22" y="36" width="20" height="5"/></g>`,
  },
  meltdown: {
    el: 'fire',
    svg: `<path d="M12 6h40v28c0 6-4 4-4 12s-6 10-6 2-4-10-8-2-2 16-6 16-4-12-6-6-6 4-6-2-6-6-4-10z"/><rect x="20" y="14" width="24" height="6" fill="#16121f"/>`,
  },
  fireWall: {
    el: 'fire',
    svg: `<path d="M6 34h52v24H6z"/><path d="M10 34c0-10 8-14 6-26 8 6 10 16 8 26zM28 34c0-8 6-12 4-24 10 8 10 18 8 24zM44 34c0-6 4-10 4-18 6 6 7 12 5 18z"/><g fill="#16121f"><rect x="6" y="45" width="52" height="3"/><rect x="22" y="34" width="3" height="11"/><rect x="40" y="34" width="3" height="11"/><rect x="30" y="48" width="3" height="10"/></g>`,
  },
  match: {
    el: 'fire',
    svg: `<rect x="28" y="26" width="8" height="36" rx="2"/><path d="M32 2c7 7 11 11 11 18a11 11 0 0 1-22 0c0-7 4-11 11-18z"/><ellipse cx="32" cy="24" rx="5" ry="6" fill="#16121f"/>`,
  },
  coffeePot: {
    el: 'arcane',
    svg: `<path d="M16 18h28l6 40H10z"/><path d="M44 22h8c4 0 6 4 6 8v8c0 4-4 6-8 6h-4v-6h4V28h-6z"/><rect x="20" y="8" width="20" height="10"/><rect x="14" y="36" width="34" height="5" fill="#16121f"/>`,
  },
  papers: {
    el: 'arcane',
    svg: `<path d="M8 20h34v40H8z"/><path d="M16 12h34v40h-5V17H16z"/><path d="M24 4h34v40h-5V9H24z"/><g fill="#16121f"><rect x="13" y="28" width="24" height="3"/><rect x="13" y="36" width="24" height="3"/><rect x="13" y="44" width="16" height="3"/></g>`,
  },
  blueScreen: {
    el: 'ice',
    svg: `<rect x="4" y="6" width="56" height="40" rx="3"/><rect x="26" y="46" width="12" height="8"/><rect x="14" y="54" width="36" height="5"/><g fill="#16121f"><rect x="14" y="15" width="5" height="5"/><rect x="14" y="27" width="5" height="5"/><rect x="14" y="38" width="32" height="3"/></g><path d="M34 12c-7 5-7 17 0 22" stroke="#16121f" stroke-width="4" fill="none"/>`,
  },
  kanban: {
    el: 'arcane',
    svg: `<rect x="4" y="8" width="56" height="48" rx="2"/><g fill="#16121f"><rect x="10" y="14" width="12" height="10"/><rect x="26" y="14" width="12" height="10"/><rect x="42" y="14" width="12" height="10"/><rect x="10" y="28" width="12" height="10"/><rect x="26" y="28" width="12" height="10"/><rect x="10" y="42" width="12" height="10"/></g>`,
  },
  thermostat: {
    el: 'ice',
    svg: `<circle cx="32" cy="32" r="27"/><circle cx="32" cy="32" r="17" fill="#16121f"/><circle cx="32" cy="32" r="12"/><path d="M32 32l8-8" stroke="#16121f" stroke-width="4.5"/>`,
  },
  gears: {
    el: 'arcane',
    svg: `<circle cx="22" cy="40" r="13"/><rect x="19.0" y="22" width="6" height="6" transform="rotate(0 22 40)"/><rect x="19.0" y="22" width="6" height="6" transform="rotate(45 22 40)"/><rect x="19.0" y="22" width="6" height="6" transform="rotate(90 22 40)"/><rect x="19.0" y="22" width="6" height="6" transform="rotate(135 22 40)"/><rect x="19.0" y="22" width="6" height="6" transform="rotate(180 22 40)"/><rect x="19.0" y="22" width="6" height="6" transform="rotate(225 22 40)"/><rect x="19.0" y="22" width="6" height="6" transform="rotate(270 22 40)"/><rect x="19.0" y="22" width="6" height="6" transform="rotate(315 22 40)"/><circle cx="22" cy="40" r="5" fill="#16121f"/><circle cx="45" cy="19" r="10"/><rect x="42.5" y="5" width="5" height="5" transform="rotate(0 45 19)"/><rect x="42.5" y="5" width="5" height="5" transform="rotate(51 45 19)"/><rect x="42.5" y="5" width="5" height="5" transform="rotate(103 45 19)"/><rect x="42.5" y="5" width="5" height="5" transform="rotate(154 45 19)"/><rect x="42.5" y="5" width="5" height="5" transform="rotate(206 45 19)"/><rect x="42.5" y="5" width="5" height="5" transform="rotate(257 45 19)"/><rect x="42.5" y="5" width="5" height="5" transform="rotate(309 45 19)"/><circle cx="45" cy="19" r="4" fill="#16121f"/>`,
  },
  coldStorage: {
    el: 'ice',
    svg: `<rect x="14" y="4" width="36" height="56" rx="3"/><rect x="14" y="24" width="36" height="4" fill="#16121f"/><rect x="40" y="10" width="4" height="10" fill="#16121f"/><rect x="40" y="32" width="4" height="14" fill="#16121f"/>`,
  },
  coldCall: {
    el: 'ice',
    svg: `<path d="M8 16c0-6 4-10 10-10h4l4 12-8 4c2 10 10 18 20 20l4-8 12 4v4c0 6-4 10-10 10C24 52 8 36 8 16z"/><g ${S} stroke-width="4"><path d="M44 6v16M36 14h16M38 8l12 12M50 8L38 20"/></g>`,
  },
  powerNap: {
    el: 'arcane',
    svg: `<path d="M4 30c6-6 50-6 56 0 3 8 3 18 0 26-6 6-50 6-56 0-3-8-3-18 0-26z"/><path d="M38 2h18v5L45 18h11v5H38v-5l11-11H38z"/>`,
  },
  blastFurnace: {
    el: 'fire',
    svg: `<path d="M14 60V24l8-8h20l8 8v36z"/><rect x="26" y="2" width="12" height="14"/><path d="M22 60V44c0-6 4-10 10-10s10 4 10 10v16z" fill="#16121f"/><path d="M32 40c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z"/>`,
  },
  plug: {
    el: 'arcane',
    svg: `<rect x="16" y="20" width="32" height="24" rx="4"/><rect x="22" y="4" width="6" height="16"/><rect x="36" y="4" width="6" height="16"/><path d="M28 44h8v8c0 4 4 6 8 6h12v6H44c-8 0-16-4-16-12z"/>`,
  },
  // Necromancer
  cart: {
    el: 'necro',
    svg: `<g ${S} stroke-width="6"><path d="M2 10h10l8 30h32l6-22H15"/></g><path d="M16 18h42l-6 22H20z"/><circle cx="24" cy="52" r="6"/><circle cx="46" cy="52" r="6"/>`,
  },
  pipeLeak: {
    el: 'necro',
    svg: `<path d="M4 10h34c8 0 14 6 14 14v12H40V24c0-2-2-2-2-2H4z"/><path d="M36 36h20v8H36z"/><path d="M46 48c4 6 5 8 5 10a5 5 0 0 1-10 0c0-2 1-4 5-10z"/><path d="M20 26c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z"/>`,
  },
  barricade: {
    el: 'steel',
    svg: `<rect x="4" y="14" width="56" height="16"/><rect x="4" y="34" width="56" height="10"/><path d="M10 44v16h6V44zM48 44v16h6V44z"/><g fill="#16121f"><path d="M12 14l10 16h7L19 14zM32 14l10 16h7L39 14z"/></g>`,
  },
  speech: {
    el: 'necro',
    svg: `<path d="M6 8h52v34H26L12 56V42H6z"/><g fill="#16121f"><circle cx="20" cy="25" r="4"/><circle cx="32" cy="25" r="4"/><circle cx="44" cy="25" r="4"/></g>`,
  },
  kettlebell: {
    el: 'steel',
    svg: `<path d="M18 22c0-11 6-16 14-16s14 5 14 16h-7c0-6-2-9-7-9s-7 3-7 9z"/><circle cx="32" cy="40" r="20"/><rect x="18" y="56" width="28" height="5"/>`,
  },
  envelope: {
    el: 'necro',
    svg: `<rect x="4" y="14" width="56" height="38"/><path d="M4 14l28 22 28-22" stroke="#16121f" stroke-width="4" fill="none"/><path d="M42 46l6-6 6 6-6 6z" fill="#16121f"/>`,
  },
  walkout: {
    el: 'necro',
    svg: `<path d="M4 4h30v56H4z"/><rect x="10" y="10" width="18" height="44" fill="#16121f"/><path d="M24 26h18V16l18 16-18 16V38H24z"/>`,
  },
  pillBottle: {
    el: 'necro',
    svg: `<rect x="14" y="4" width="36" height="12" rx="2"/><path d="M16 18h32v40H16z"/><rect x="16" y="28" width="32" height="20" fill="#16121f"/><path d="M28 31h8v5h5v7h-5v5h-8v-5h-5v-7h5z"/>`,
  },
  whistle: {
    el: 'necro',
    svg: `<path d="M4 26h30a16 16 0 1 1-10 28A16 16 0 0 1 4 38z"/><circle cx="36" cy="40" r="7" fill="#16121f"/><g ${S} stroke-width="5"><path d="M34 26V12h14"/></g>`,
  },
  zombieHand: {
    el: 'necro',
    svg: `<path d="M20 60V34l-6-8V10h6v14h4V6h6v18h4V8h6v18h4v-8h6v16l-4 10v26z"/><rect x="8" y="58" width="48" height="5"/><g fill="#16121f"><rect x="26" y="40" width="7" height="3"/><rect x="34" y="48" width="7" height="3"/></g>`,
  },
  moon: {
    el: 'necro',
    svg: `<path d="M38 4a28 28 0 1 0 22 42A24 24 0 0 1 38 4z"/><path d="M50 10l2 5 5 1-4 3 1 5-4-3-5 3 2-5-4-3h5z"/>`,
  },
  chainSmoking: {
    el: 'necro',
    svg: `<rect x="2" y="40" width="16" height="14"/><rect x="21" y="40" width="30" height="14"/><rect x="52" y="40" width="10" height="14"/><rect x="56" y="44" width="4" height="4" fill="#16121f"/><g ${S} stroke-width="5"><path d="M42 36l-6-7 6-7-6-7M56 36l-6-7 6-7-6-7"/></g>`,
  },
  sabot: {
    el: 'necro',
    svg: `<path d="M4 46c0-10 8-16 20-18l8-14h20c6 0 8 4 8 10v28c0 4-2 6-6 6H12c-6 0-8-4-8-12z"/><rect x="34" y="20" width="18" height="8" fill="#16121f"/>`,
  },
  nail: {
    el: 'necro',
    svg: `<rect x="10" y="4" width="44" height="10" rx="2"/><path d="M27 14h10v34l-5 14-5-14z"/><g fill="#16121f"><rect x="28" y="22" width="4" height="5"/><rect x="32" y="34" width="4" height="5"/></g>`,
  },
  mangioni: {
    el: 'nature',
    svg: `<path d="M12 42c0-19 8-30 20-30s20 11 20 30z"/><path d="M16 34q5-6 10 0t10 0t10 0M21 25q5-5 9 0t9 0M28 18q4-3 8 0" stroke="#16121f" stroke-width="4" fill="none"/><path d="M4 44h56" stroke="#16121f" stroke-width="3"/><path d="M4 46h56c-1 10-12 16-28 16S5 56 4 46z"/><path d="M16 52q16 5 32 0" stroke="#16121f" stroke-width="3" fill="none"/><g transform="rotate(30 52 18)"><rect x="49" y="0" width="6" height="22" rx="3"/><path d="M43 20h18v4c0 5-4 8-9 8s-9-3-9-8z"/><path d="M45 26v12M50 28v12M55 28v12M60 26v12" stroke="currentColor" stroke-width="3.5" fill="none"/></g>`,
  },
  toxicMemo: {
    el: 'necro',
    svg: `<path d="M8 8h48v34L42 56H8z"/><path d="M42 56V42h14z" fill="#16121f"/><path d="M28 14c7 9 10 13 10 17a10 10 0 0 1-20 0c0-4 3-8 10-17z" fill="#16121f"/>`,
  },
  bloodMoney: {
    el: 'necro',
    svg: `<rect x="2" y="16" width="52" height="30" rx="2"/><circle cx="28" cy="31" r="9" fill="#16121f"/><circle cx="28" cy="31" r="4"/><path d="M52 34c5 8 8 12 8 16a8 8 0 0 1-16 0c0-4 3-8 8-16z"/>`,
  },
  smiley: {
    el: 'nature',
    svg: `<circle cx="32" cy="32" r="27"/><g fill="#16121f"><rect x="20" y="18" width="7" height="11"/><rect x="37" y="18" width="7" height="11"/><path d="M16 36h32c-2 9-8 14-16 14s-14-5-16-14z"/></g>`,
  },
  unionCard: {
    el: 'necro',
    svg: `<rect x="10" y="12" width="44" height="48" rx="3"/><rect x="26" y="4" width="12" height="12"/><g fill="#16121f"><circle cx="32" cy="30" r="7"/><path d="M19 50c2-9 7-11 13-11s11 2 13 11z"/></g>`,
  },
  snail: {
    el: 'necro',
    svg: `<circle cx="36" cy="30" r="19"/><path d="M2 58c0-8 6-10 14-8h44v8z"/><path d="M6 50V34l-4-8h5l5 6v18z"/><circle cx="36" cy="30" r="10" fill="#16121f"/><circle cx="36" cy="30" r="4"/>`,
  },
  // Neutral
  bean: {
    el: 'arcane',
    svg: `<ellipse cx="32" cy="32" rx="19" ry="27" transform="rotate(30 32 32)"/><path d="M20 12c14 10 8 30 22 40" stroke="#16121f" stroke-width="5" fill="none"/>`,
  },
  espresso: {
    el: 'arcane',
    svg: `<path d="M3 28h24v14c0 7-5 12-12 12S3 49 3 42z"/><path d="M35 28h24v14c0 7-5 12-12 12s-12-5-12-12z"/><rect x="1" y="56" width="62" height="5"/><g ${S} stroke-width="4"><path d="M13 22c-3-4 3-6 0-11M45 22c-3-4 3-6 0-11"/></g>`,
  },
  donut: {
    el: 'nature',
    svg: `<circle cx="32" cy="34" r="27"/><circle cx="32" cy="34" r="9" fill="#16121f"/><g fill="#16121f"><rect x="14" y="20" width="7" height="3"/><rect x="42" y="18" width="7" height="3"/><rect x="45" y="42" width="7" height="3"/><rect x="16" y="45" width="7" height="3"/><rect x="30" y="12" width="7" height="3"/></g>`,
  },
  stapler: {
    el: 'steel',
    svg: `<path d="M4 44h56v12H4z"/><path d="M6 40l40-22c6-3 14 0 14 8v10H6z"/><rect x="10" y="47" width="30" height="4" fill="#16121f"/>`,
  },
  // Sleeve cards
  toolBelt: {
    el: 'steel',
    svg: `<rect x="2" y="22" width="60" height="12"/><rect x="26" y="20" width="12" height="16" fill="#16121f"/><rect x="29" y="23" width="6" height="10"/><path d="M8 34h12v20H8zM44 34h12v16H44z"/><path d="M12 34V14h4v20zM48 34V8l6 6-2 2v18z"/>`,
  },
  floppy: {
    el: 'arcane',
    svg: `<path d="M6 6h44l8 8v44H6z"/><rect x="16" y="6" width="26" height="18" fill="#16121f"/><rect x="32" y="9" width="6" height="12"/><rect x="14" y="34" width="36" height="22" fill="#16121f" opacity=".35"/><rect x="18" y="40" width="28" height="3" fill="#16121f"/><rect x="18" y="47" width="20" height="3" fill="#16121f"/>`,
  },
  burnBook: {
    el: 'necro',
    svg: `<path d="M8 8h40c4 0 8 4 8 8v42H16c-4 0-8-4-8-8z"/><path d="M8 50c0-4 4-8 8-8h40" stroke="#16121f" stroke-width="3" fill="none"/><path d="M32 14c-7 0-12 5-12 11 0 4 2 6 4 8v4h16v-4c2-2 4-4 4-8 0-6-5-11-12-11z" fill="#16121f"/><g fill="currentColor"><rect x="25" y="23" width="5" height="5"/><rect x="34" y="23" width="5" height="5"/></g>`,
  },
  // Time on the belt
  lateClock: {
    el: 'blood',
    svg: `<circle cx="30" cy="34" r="26"/><circle cx="30" cy="34" r="19" fill="#16121f" opacity=".35"/><path d="M30 34V18M30 34l-10 6" stroke="#16121f" stroke-width="5" fill="none"/><path d="M54 4a12 12 0 1 0 8 18 10 10 0 1 1-8-18z"/>`,
  },
  queueTicket: {
    el: 'steel',
    svg: `<path d="M10 8h44v48H10v-8a6 6 0 0 0 0-12v-8a6 6 0 0 0 0-12z"/><g fill="#16121f"><rect x="18" y="16" width="28" height="4"/><path d="M22 28h8v20h-6V34h-2zM34 28h12v5h-7v3h7v12H34v-5h7v-3h-7z"/></g>`,
  },
  scales: {
    el: 'holy',
    svg: `<rect x="30" y="8" width="4" height="46"/><rect x="18" y="54" width="28" height="6"/><rect x="8" y="12" width="48" height="4"/><path d="M4 36h20c0 6-4 10-10 10S4 42 4 36zM40 30h20c0 6-4 10-10 10s-10-4-10-10z"/><path d="M14 16L6 36h2l6-16 6 16h2zM50 16l-8 14h2l6-10 6 10h2z"/><g fill="#16121f"><rect x="9" y="30" width="10" height="5"/><path d="M45 26h10v4H45z"/></g>`,
  },
  complaintBox: {
    el: 'blood',
    svg: `<rect x="8" y="20" width="48" height="40"/><rect x="4" y="14" width="56" height="8"/><rect x="18" y="16" width="28" height="4" fill="#16121f"/><path d="M26 2h14l2 12H24z" fill="#fff" opacity=".85"/><g fill="#16121f"><rect x="16" y="32" width="32" height="4"/><rect x="16" y="40" width="24" height="4"/><rect x="16" y="48" width="28" height="4"/></g>`,
  },
  // Pop culture
  powerOff: {
    el: 'arcane',
    svg: `<g ${S} stroke-width="7"><path d="M20 16a22 22 0 1 0 24 0"/><path d="M32 6v24"/></g>`,
  },
  powerOn: {
    el: 'arcane',
    svg: `<g ${S} stroke-width="7"><path d="M20 20a18 18 0 1 0 24 0"/><path d="M32 12v20"/></g><g ${S} stroke-width="4"><path d="M8 8l6 6M56 8l-6 6M2 34h6M56 34h6"/></g>`,
  },
  rootKey: {
    el: 'arcane',
    svg: `<circle cx="18" cy="22" r="14"/><circle cx="18" cy="22" r="5" fill="#16121f"/><path d="M28 30l28 28-6 5-4-4-4 4-4-4 4-4-4-4-4 4-4-4 4-4-10-10z"/>`,
  },
  ctrlZ: {
    el: 'steel',
    svg: `<rect x="6" y="8" width="52" height="48" rx="6"/><rect x="6" y="46" width="52" height="10" rx="4" fill="#16121f" opacity=".35"/><path d="M20 16h24v6L28 38h16v6H20v-6l16-16H20z" fill="#16121f"/>`,
  },
  harold: {
    el: 'steel',
    svg: `<circle cx="30" cy="28" r="22"/><g fill="#16121f"><rect x="18" y="22" width="6" height="5"/><rect x="36" y="22" width="6" height="5"/><path d="M15 17l11 3v-4l-10-3zM45 17l-11 3v-4l10-3z"/><path d="M18 34h24c0 7-5 11-12 11s-12-4-12-11z"/></g><rect x="20" y="35" width="20" height="4" fill="#fff" opacity=".7"/><path d="M48 44h12v14H48z"/><path d="M60 46c4 0 4 10 0 10" stroke="currentColor" stroke-width="3" fill="none"/>`,
  },
  scissors: {
    el: 'steel',
    svg: `<circle cx="14" cy="48" r="10"/><circle cx="14" cy="48" r="4" fill="#16121f"/><circle cx="50" cy="48" r="10"/><circle cx="50" cy="48" r="4" fill="#16121f"/><path d="M20 40L50 4l4 4-26 38zM44 40L14 4l-4 4 26 38z"/><path d="M2 28h14M48 28h14" stroke="currentColor" stroke-width="4" stroke-dasharray="4 4"/>`,
  },
  suitcase: {
    el: 'nature',
    svg: `<rect x="4" y="18" width="56" height="38" rx="4"/><path d="M22 18v-8h20v8h-5v-3H27v3z"/><g fill="#16121f"><rect x="16" y="18" width="5" height="38"/><rect x="43" y="18" width="5" height="38"/></g><circle cx="52" cy="10" r="6"/>`,
  },
  // Curses
  calendar: {
    el: 'curse',
    svg: `<rect x="6" y="10" width="52" height="48" rx="3"/><rect x="14" y="2" width="7" height="14"/><rect x="43" y="2" width="7" height="14"/><rect x="6" y="20" width="52" height="4" fill="#16121f"/><path d="M20 30l24 22M44 30L20 52" stroke="#16121f" stroke-width="6"/>`,
  },
  turnstile: {
    el: 'curse',
    svg: `<rect x="4" y="20" width="20" height="42"/><rect x="24" y="28" width="36" height="8"/><path d="M22 28l20-22 6 5-20 22z"/><rect x="8" y="26" width="12" height="8" fill="#16121f"/>`,
  },
  partyHat: {
    el: 'curse',
    svg: `<path d="M32 8L54 60H10z"/><circle cx="32" cy="7" r="6"/><g fill="#16121f"><path d="M25 24h14l3 8H22zM18 42h28l3 8H15z"/></g>`,
  },
  tpsReport: {
    el: 'curse',
    svg: `<path d="M16 2h44v54H16z"/><path d="M3 8h44v54H3z" stroke="#16121f" stroke-width="4" stroke-linejoin="round"/><path d="M3 8h44v54H3z"/><rect x="8" y="13" width="34" height="11" fill="#16121f"/><path d="M12 18.5h10" stroke="#fff" stroke-width="4"/><path d="M8 32h34M8 39h34M8 46h20" stroke="#16121f" stroke-width="4"/><rect x="31" y="47" width="11" height="11" fill="#16121f"/><path d="M33 52l3 3 4-6" stroke="#fff" stroke-width="2.5" fill="none"/>`,
  },
  meeting: {
    el: 'curse',
    svg: `<ellipse cx="32" cy="38" rx="28" ry="12"/><circle cx="10" cy="18" r="7"/><circle cx="32" cy="11" r="7"/><circle cx="54" cy="18" r="7"/><rect x="28" y="48" width="8" height="14"/>`,
  },
  papersPlease: {
    el: 'curse',
    svg: `<circle cx="32" cy="9" r="8"/><rect x="26" y="15" width="12" height="16"/><rect x="10" y="30" width="44" height="10" rx="2"/><path d="M4 44h56v16H4z"/><path d="M12 50h40v4H12z" fill="#16121f"/><path d="M16 52h10M32 52h16" stroke="#fff" stroke-width="2"/>`,
  },
  dramaMask: {
    el: 'curse',
    svg: `<path d="M34 24h26v18c0 10-6 18-13 18s-11-6-13-12z"/><path d="M4 6h38v24c0 12-8 20-19 20S4 42 4 30z"/><g fill="#16121f"><path d="M10 16l9 4-9 4zM36 16l-9 4 9 4z"/><path d="M12 38c5-7 17-7 22 0-7-3-15-3-22 0z"/></g>`,
  },
  lips: {
    el: 'curse',
    svg: `<path d="M2 32c8-14 16-18 22-14 5-2 11-2 16 0 6-4 14 0 22 14-8 13-18 19-30 19S10 45 2 32z"/><path d="M6 32c12 5 40 5 52 0" stroke="#16121f" stroke-width="4" fill="none"/>`,
  },
  writeUp: {
    el: 'curse',
    svg: `<path d="M4 6h38v52H4z"/><g fill="#16121f"><rect x="10" y="14" width="26" height="4"/><rect x="10" y="24" width="26" height="4"/><rect x="10" y="34" width="16" height="4"/></g><path d="M38 54l18-36 6 3-18 36-7 3z"/>`,
  },

  // ---- Rule icons: one concept each.
  overtime: {
    el: 'blood',
    svg: `<circle cx="28" cy="36" r="24"/><path d="M28 36V20M28 36h12" stroke="#16121f" stroke-width="5" fill="none"/><path d="M48 2h6v9h9v6h-9v9h-6v-9h-9v-6h9z"/>`,
  },
  thickSkin: {
    el: 'steel',
    svg: `<path d="M8 8h48v14H8zM8 26h48v14H8zM8 44h48v14H8z"/><g fill="#16121f"><rect x="13" y="13" width="5" height="4"/><rect x="46" y="13" width="5" height="4"/><rect x="13" y="31" width="5" height="4"/><rect x="46" y="31" width="5" height="4"/><rect x="13" y="49" width="5" height="4"/><rect x="46" y="49" width="5" height="4"/></g>`,
  },
  priceTag: {
    el: 'holy',
    svg: `<path d="M4 32L32 4h28v28L32 60z"/><circle cx="46" cy="18" r="6" fill="#16121f"/><path d="M18 40l14-14" stroke="#16121f" stroke-width="7"/>`,
  },
  zzz: { el: 'arcane', svg: `<path d="M4 34h24v7L15 53h13v7H4v-7l13-12H4zM32 6h28v7L45 29h15v7H32v-7l15-16H32z"/>` },
  stolenClock: {
    el: 'arcane',
    svg: `<path d="M32 6a26 26 0 1 0 26 26H32z"/><path d="M32 32V16M32 32H20" stroke="#16121f" stroke-width="5"/><path d="M38 2l24 24H38z"/>`,
  },
  wrench: { el: 'steel', svg: `<path d="M50 4a12 12 0 0 0-15 16L6 49l9 9 29-29A12 12 0 0 0 60 14l-8 8-7-7z"/>` },
  wrenchWhack: {
    el: 'steel',
    svg: `<path d="M48 0h3.2v3.2h-3.2zM57.6 0h3.2v3.2h-3.2zM54.4 3.2h3.2v3.2h-3.2zM25.6 6.4h16v3.2h-16zM25.6 9.6h16v3.2h-16zM25.6 12.8h16v3.2h-16zM48 12.8h9.6v3.2h-9.6zM25.6 16h16v3.2h-16zM48 16h9.6v3.2h-9.6zM25.6 19.2h32v3.2h-32zM22.4 22.4h35.2v3.2h-35.2zM22.4 25.6h32v3.2h-32zM22.4 28.8h25.6v3.2h-25.6zM22.4 32h12.8v3.2h-12.8zM19.2 35.2h12.8v3.2h-12.8zM16 38.4h12.8v3.2h-12.8zM12.8 41.6h12.8v3.2h-12.8zM9.6 44.8h12.8v3.2h-12.8zM6.4 48h12.8v3.2h-12.8zM3.2 51.2h12.8v3.2h-12.8zM3.2 54.4h9.6v3.2h-9.6z"/>`,
  },
  biohazard: {
    el: 'necro',
    svg: `<circle cx="32" cy="18" r="14"/><circle cx="17" cy="43" r="14"/><circle cx="47" cy="43" r="14"/><circle cx="32" cy="35" r="7" fill="#16121f"/><g fill="#16121f"><circle cx="32" cy="11" r="6"/><circle cx="11" cy="47" r="6"/><circle cx="53" cy="47" r="6"/></g>`,
  },
  stone: {
    el: 'steel',
    svg: `<path d="M6 52l6-26 16-18 20 6 10 22-6 18H12z"/><path d="M26 22l6 14-10 8M42 26l-4 12 12 6" stroke="#16121f" stroke-width="4" fill="none"/>`,
  },
  down: { el: 'shadow', svg: `<path d="M32 60L8 34h14V4h20v30h14z"/>` },
  shutdown: {
    el: 'necro',
    svg: `<g ${S} stroke-width="9"><path d="M20 14a24 24 0 1 0 24 0"/></g><rect x="27" y="2" width="10" height="30" rx="3"/>`,
  },
  snatch: {
    el: 'steel',
    svg: `<rect x="32" y="2" width="24" height="32" rx="2" transform="rotate(15 44 18)"/><path d="M4 44c0-8 6-14 14-14h14l-6 8h12c4 0 6 2 6 6s-2 6-6 6H22l-6 10H4z"/>`,
  },
  speedCards: {
    el: 'arcane',
    svg: `<rect x="28" y="8" width="30" height="44" rx="3"/><g ${S} stroke-width="5.5"><path d="M4 18h18M10 30h14M4 42h18"/></g>`,
  },
  toolbox: {
    el: 'steel',
    svg: `<rect x="4" y="24" width="56" height="34" rx="3"/><path d="M20 24V12h24v12h-7v-5H27v5z"/><rect x="4" y="36" width="56" height="5" fill="#16121f"/><rect x="28" y="31" width="8" height="14" fill="#16121f"/>`,
  },
  rulebook: {
    el: 'curse',
    svg: `<path d="M4 8h24c2 0 4 2 4 4v48c0-2-2-4-4-4H4zM60 8H36c-2 0-4 2-4 4v48c0-2 2-4 4-4h24z"/><circle cx="46" cy="30" r="10" fill="#16121f"/><circle cx="46" cy="30" r="6"/><path d="M39 37l14-14" stroke="#16121f" stroke-width="4"/>`,
  },
  trash: {
    el: 'shadow',
    svg: `<path d="M14 18h36l-4 42H18z"/><rect x="8" y="10" width="48" height="6"/><rect x="26" y="3" width="12" height="7"/><g fill="#16121f"><rect x="23" y="24" width="4" height="30"/><rect x="37" y="24" width="4" height="30"/></g>`,
  },
  // Low HP condition ("below 30%"): a heart split in two.
  heartbreak: {
    el: 'blood',
    svg: `<path d="M30 56C8 41 3 27 10 17c6-9 16-8 20 0l-4 10 6 8-4 10 2 11zM34 56c23-15 28-29 21-39-6-9-16-8-20 0l-3 10 6 8-4 10z"/>`,
  },
  check: { el: 'holy', svg: `<path d="M4 34l10-10 12 12L50 12l10 10-34 34z"/>` },
  wand: { el: 'arcane', svg: `<path d="M6 52l30-30 7 7-30 30z"/>${star4(46, 18, 15)}` },
  gauge: {
    el: 'steel',
    svg: `<path d="M4 46a28 28 0 0 1 56 0z"/><path d="M32 46l16-20" stroke="#16121f" stroke-width="5"/><circle cx="32" cy="46" r="5" fill="#16121f"/><rect x="4" y="48" width="56" height="7"/>`,
  },
  exitSlot: {
    el: 'shadow',
    svg: `<path d="M2 14h28v36H2z"/><path d="M7 20h18v12H7z" fill="#16121f"/><path d="M7 38h12v5H7z" fill="#16121f"/><path d="M34 26h12v-10l16 16-16 16V38H34z"/>`,
  },
  growth: {
    el: 'holy',
    svg: `<rect x="4" y="40" width="14" height="20"/><rect x="25" y="26" width="14" height="34"/><rect x="46" y="8" width="14" height="52"/>`,
  },
  ladder: { el: 'holy', svg: `<path d="M10 2h9v60h-9zM45 2h9v60h-9z"/><path d="M19 10h26v7H19zM19 25h26v7H19zM19 40h26v7H19zM19 55h26v7H19z"/>` },
  // ---- menu buttons
  play: { el: 'holy', svg: `<path d="M14 6l42 26-42 26z"/>` },
  pen: {
    el: 'holy',
    svg: `<path d="M44 4l16 16-26 26-16-16z"/><path fill="#16121f" d="M40 8l16 16-4 4-16-16z"/><path d="M18 30l16 16L4 60z"/><path d="M4 60l18-18" stroke="#16121f" stroke-width="3"/><circle cx="23" cy="41" r="3.5" fill="#16121f"/>`,
  },
  share: { el: 'holy', svg: `<path d="M24 40V18H12L32 0l20 18H40v22z"/><path d="M4 30h12v20h32V30h12v32H4z"/>` },
  plus: { el: 'holy', svg: `<path d="M25 6h14v19h19v14H39v19H25V39H6V25h19z"/>` },
  book: {
    el: 'holy',
    // A thick closed book: cover, a spine band and the page block, so it never reads as a pause sign.
    svg: `<path d="M10 8h36c4 0 6 2 6 6v40c0 4-2 6-6 6H14c-4 0-6-2-6-6V12c0-2 1-4 2-4z"/><path d="M14 50h38v8H14c-2 0-4-2-4-4s2-4 4-4z" fill="#fff" opacity=".85"/><g fill="#16121f"><rect x="18" y="8" width="5" height="42"/><rect x="28" y="18" width="18" height="4"/><rect x="28" y="26" width="12" height="4"/><rect x="14" y="52" width="36" height="2"/></g>`,
  },
  question: {
    el: 'holy',
    svg: `<path d="M14 22C14 11 22 4 32 4s18 7 18 16c0 9-6 12-10 15-3 2-3 4-3 9H26c0-8 2-12 7-16 4-3 6-4 6-8 0-3-3-5-7-5s-7 3-7 7z"/><rect x="25" y="49" width="13" height="12"/>`,
  },
  home: { el: 'holy', svg: `<path d="M32 4l28 26h-7v28H39V42H25v16H11V30H4z"/>` },
  door: {
    el: 'shadow',
    svg: `<path d="M10 4h34v56H10z"/><path fill="#16121f" d="M16 10h22v44H16z"/><path d="M16 10l20 6v44l-20-6z"/><path d="M40 28h10v-8l12 12-12 12v-8H40z"/>`,
  },
  bug: {
    el: 'shadow',
    svg: `<ellipse cx="32" cy="38" rx="14" ry="18"/><circle cx="32" cy="16" r="8"/><path d="M4 26h14v6H4zM46 26h14v6H46zM4 42h14v6H4zM46 42h14v6H46zM20 4l6 8-5 3-6-8zM44 4l-6 8 5 3 6-8z"/><path d="M31 22h2v34h-2z" fill="#16121f"/>`,
  },
  // ---- belt speed statuses, Pending tag
  stopwatch: {
    el: 'steel',
    svg: `<circle cx="34" cy="36" r="22"/><rect x="28" y="4" width="12" height="8"/><path d="M34 36V22" stroke="#16121f" stroke-width="6"/><path d="M34 36l9 7" stroke="#16121f" stroke-width="6"/><path d="M2 26h8v5H2zM0 38h8v5H0zM4 50h8v5H4z"/>`,
  },
  siren: {
    el: 'fire',
    svg: `<path d="M16 44a16 16 0 0 1 32 0z"/><rect x="8" y="46" width="48" height="10"/><path d="M29 4h6v10h-6zM8 14l5-4 7 8-5 4zM56 14l-5-4-7 8 5 4z"/><path fill="#16121f" d="M23 38a9 9 0 0 1 6-8v4a5 5 0 0 0-2 4z"/>`,
  },
  cone: {
    el: 'steel',
    svg: `<path d="M26 6h12l16 46H10z"/><path fill="#16121f" d="M22 20h20l3 9H19zM17 36h30l3 9H14z"/><rect x="4" y="52" width="56" height="8"/>`,
  },
  pending: {
    el: 'holy',
    svg: `<path d="M6 10h52v34H26L12 58V44H6z"/><circle cx="18" cy="27" r="4.5" fill="#16121f"/><circle cx="32" cy="27" r="4.5" fill="#16121f"/><circle cx="46" cy="27" r="4.5" fill="#16121f"/>`,
  },
  // ---- new cards (glyphs, slacking statuses, art)
  terminal: {
    el: 'arcane',
    svg: `<rect x="4" y="8" width="56" height="48" rx="3"/><g fill="#16121f"><path d="M12 20l12 9-12 9v-6l5-3-5-3z"/><rect x="28" y="36" width="16" height="5"/></g>`,
  },
  undo: {
    el: 'steel',
    svg: `<g ${S} stroke-width="8"><path d="M20 22h20a16 16 0 0 1 0 32H22"/></g><path d="M4 22l18-16v32z"/>`,
  },
  magnifier: {
    el: 'steel',
    svg: `<circle cx="26" cy="26" r="20"/><circle cx="26" cy="26" r="12" fill="#16121f"/><path d="M40 36l20 18-7 7-18-20z"/><path ${HI} d="M18 20c2-4 6-6 10-6-3 2-5 5-6 9z"/>`,
  },
  coin: {
    el: 'holy',
    svg: `<rect x="8" y="44" width="48" height="14" rx="7"/><rect x="8" y="30" width="48" height="14" rx="7"/><ellipse cx="32" cy="22" rx="24" ry="12"/><g fill="#16121f"><rect x="8" y="42" width="48" height="3"/><rect x="8" y="28" width="48" height="3"/><rect x="26" y="18" width="12" height="7"/></g>`,
  },
  ko: {
    el: 'steel',
    svg: `<g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M32 32c0-4 6-4 6 0s-6 8-12 4-6-14 4-16 18 4 18 14-10 20-22 18-20-12-18-22"/></g><path d="M50 6l3 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1z"/>`,
  },
  thoughtBubble: {
    el: 'arcane',
    svg: `<path d="M18 8h30c8 0 12 5 12 12v8c0 7-4 12-12 12H30l-10 8v-8h-2c-8 0-12-5-12-12v-8C6 13 10 8 18 8z"/><circle cx="12" cy="54" r="5"/><circle cx="4" cy="61" r="3"/><g fill="#16121f"><rect x="20" y="21" width="6" height="6"/><rect x="30" y="21" width="6" height="6"/><rect x="40" y="21" width="6" height="6"/></g>`,
  },
  autopilot: {
    el: 'steel',
    svg: `<path d="M28 4h8l2 8 7 3 7-4 6 6-4 7 3 7 8 2v8l-8 2-3 7 4 7-6 6-7-4-7 3-2 8h-8l-2-8-7-3-7 4-6-6 4-7-3-7-8-2v-8l8-2 3-7-4-7 6-6 7 4 7-3z"/><path d="M26 22l16 10-16 10z" fill="#16121f"/>`,
  },
  seesaw: {
    el: 'steel',
    svg: `<path d="M4 30l56-12 2 6-56 12z"/><path d="M32 30l-10 26h20z"/><rect x="6" y="18" width="12" height="12"/><rect x="46" y="8" width="12" height="10"/>`,
  },
  timer: {
    el: 'steel',
    svg: `<circle cx="32" cy="34" r="26"/><path fill="#16121f" d="M32 14a20 20 0 0 1 20 20H32z"/><rect x="26" y="2" width="12" height="6"/>`,
  },
  skip: {
    el: 'holy',
    svg: `<path d="M4 10l24 22L4 54zM28 10l24 22-24 22z"/><rect x="52" y="10" width="8" height="44"/>`,
  },
  copy: {
    el: 'holy',
    svg: `<rect x="4" y="4" width="36" height="42"/><rect x="10" y="10" width="24" height="30" fill="#16121f"/><rect x="22" y="18" width="38" height="44"/>`,
  },
  addCard: {
    el: 'holy',
    svg: `<rect x="6" y="4" width="34" height="48"/><path fill="#16121f" d="M12 10h22v36H12z"/><path d="M40 30h8v10h10v8H48v10h-8V48H30v-8h10z"/>`,
  },
  lane: {
    el: 'steel',
    svg: `<circle cx="32" cy="32" r="28"/><rect x="12" y="26" width="40" height="12" fill="#16121f"/>`,
  },
  battery: {
    el: 'steel',
    svg: `<rect x="4" y="16" width="50" height="32"/><rect x="54" y="26" width="8" height="12"/><rect x="10" y="22" width="38" height="20" fill="#16121f"/><rect x="12" y="24" width="10" height="16"/>`,
  },
  sun: {
    el: 'holy',
    svg: `<circle cx="32" cy="32" r="14"/><path d="M29 2h6v10h-6zM29 52h6v10h-6zM2 29h10v6H2zM52 29h10v6H52zM9 13l4-4 7 7-4 4zM44 48l4-4 7 7-4 4zM9 51l7-7 4 4-7 7zM44 16l7-7 4 4-7 7z"/>`,
  },
  rocket: {
    el: 'fire',
    svg: `<path d="M32 2c12 8 16 22 12 38H20C16 24 20 10 32 2z"/><circle cx="32" cy="22" r="5" fill="#16121f"/><path d="M20 30l-10 14v8l12-6zM44 30l10 14v8l-12-6z"/><path d="M24 44h16l-4 10h-8z"/><path d="M28 56h8l-4 8z"/>`,
  },
  resignation: {
    el: 'steel',
    svg: `<path d="M6 30h52v30H6z"/><path fill="#16121f" d="M6 30h52v6H6z"/><path d="M14 30V14h8v16zM26 30c0-10 4-18 12-22 2 8-2 16-6 22z"/><path d="M40 30c2-8 8-12 16-12-2 6-6 10-12 12z"/>`,
  },
  hammock: {
    el: 'nature',
    svg: `<rect x="4" y="6" width="6" height="54"/><rect x="54" y="6" width="6" height="54"/><path d="M8 20c8 22 40 22 48 0v8c-8 20-40 20-48 0z"/><circle cx="22" cy="24" r="6"/><path d="M28 26h18l-2 6H28z"/>`,
  },
  palm: {
    el: 'nature',
    svg: `<path d="M30 60c2-14 2-26 0-38h6c3 12 3 24 0 38z"/><path d="M32 22C24 10 12 10 4 16c10-2 18 0 24 8zM34 22c8-12 20-12 28-6-10-2-18 0-24 8zM33 20C30 8 22 2 14 4c8 2 14 8 16 16zM33 20c4-12 12-18 20-16-8 2-14 8-16 16z"/><rect x="4" y="58" width="56" height="6"/>`,
  },
  grind: {
    el: 'steel',
    svg: `<circle cx="32" cy="30" r="26"/><circle cx="32" cy="30" r="19" fill="#16121f"/><path d="M32 11v38M13 30h38M18 17l28 26M46 17L18 43" stroke="#fff" stroke-width="2"/><ellipse cx="32" cy="42" rx="10" ry="7"/><circle cx="40" cy="38" r="4"/><path d="M26 56h12v8H26z"/>`,
  },
  shrug: {
    el: 'holy',
    svg: `<circle cx="32" cy="16" r="10"/><path d="M18 30h28l-2 30H20z"/><path d="M18 32L6 24l-2-12 6 2 2 8 8 4zM46 32l12-8 2-12-6 2-2 8-8 4z"/>`,
  },
  forward: {
    el: 'arcane',
    svg: `<path d="M4 18h40v32H4z"/><path fill="#16121f" d="M8 22l16 12 16-12v4L24 38 8 26z"/><path d="M40 22l20 12-20 12v-7H30V29h10z"/>`,
  },
  followUp: {
    el: 'arcane',
    svg: `<path d="M32 4c-12 0-18 10-18 20v14l-8 10h52l-8-10V24C50 14 44 4 32 4z"/><path d="M24 52h16c0 6-4 10-8 10s-8-4-8-10z"/>`,
  },
  q1: {
    el: 'holy',
    svg: `<rect x="4" y="58" width="56" height="6"/><rect x="10" y="44" width="12" height="14"/>`,
  },
  q2: {
    el: 'holy',
    svg: `<rect x="4" y="58" width="56" height="6"/><rect x="10" y="44" width="12" height="14"/><rect x="26" y="34" width="12" height="24"/>`,
  },
  q3: {
    el: 'holy',
    svg: `<rect x="4" y="58" width="56" height="6"/><rect x="6" y="44" width="11" height="14"/><rect x="20" y="34" width="11" height="24"/><rect x="34" y="22" width="11" height="36"/>`,
  },
  q4: {
    el: 'holy',
    svg: `<rect x="4" y="58" width="56" height="6"/><rect x="4" y="44" width="10" height="14"/><rect x="17" y="34" width="10" height="24"/><rect x="30" y="24" width="10" height="34"/><rect x="43" y="12" width="10" height="46"/><path d="M40 2h22v22l-8-8-10 10-6-6 10-10z"/>`,
  },
  clipboardCopy: {
    el: 'arcane',
    svg: `<rect x="8" y="10" width="36" height="50"/><rect x="18" y="4" width="16" height="10"/><rect x="14" y="20" width="24" height="4" fill="#16121f"/><rect x="14" y="30" width="24" height="4" fill="#16121f"/><rect x="30" y="34" width="28" height="26"/><rect x="34" y="40" width="20" height="4" fill="#16121f"/><rect x="34" y="48" width="20" height="4" fill="#16121f"/>`,
  },
  doneStamp: {
    el: 'holy',
    svg: `<rect x="4" y="4" width="56" height="56"/><rect x="10" y="10" width="44" height="44" fill="#16121f"/><path d="M14 32l8-8 8 8 14-16 8 8-22 24z"/>`,
  },
  urgentFolder: {
    el: 'curse',
    svg: `<path d="M4 14h22l6 6h28v38H4z"/><rect x="28" y="26" width="8" height="18" fill="#16121f"/><rect x="28" y="48" width="8" height="6" fill="#16121f"/>`,
  },
  padlockGate: {
    el: 'curse',
    svg: `<path d="M16 28V18a16 16 0 0 1 32 0v10h-8V18a8 8 0 0 0-16 0v10z"/><rect x="8" y="28" width="48" height="32"/><circle cx="32" cy="40" r="5" fill="#16121f"/><rect x="30" y="42" width="4" height="10" fill="#16121f"/>`,
  },
  favour: {
    el: 'curse',
    svg: `<rect x="24" y="4" width="10" height="30"/><path d="M14 30h32c4 0 6 4 6 8v8c0 10-8 16-18 16h-4c-10 0-16-6-16-16z"/><path fill="#16121f" d="M24 38v8M32 38v8M40 38v8" stroke="#16121f" stroke-width="3"/>`,
  },
  pcLoadLetter: {
    el: 'curse',
    svg: `<rect x="8" y="3" width="26" height="14"/><rect x="2" y="17" width="44" height="26"/><rect x="9" y="43" width="30" height="17"/><rect x="7" y="23" width="22" height="10" fill="#16121f"/><path d="M10 28h6M20 28h6" stroke="#fff" stroke-width="3.5"/><path d="M14 51h20M14 56h12" stroke="#16121f" stroke-width="3.5"/><g transform="rotate(35 50 32)"><path d="M43 0h14c2 0 3 1 3 3v22l-3 30h-10l-4-30V3c0-2 1-3 0-3z" stroke="#16121f" stroke-width="4" stroke-linejoin="round"/><path d="M43 0h14c2 0 3 1 3 3v22l-3 30h-10l-4-30V3c0-2 1-3 0-3z"/></g>`,
  },
  plant: {
    el: 'nature',
    svg: `<path d="M16 40h32l-5 22H21z"/><rect x="12" y="36" width="40" height="6"/><path d="M31 36V20h3v16z"/><path d="M32 22C26 10 14 8 6 12c8 6 16 10 26 10zM33 18c4-10 14-16 24-14-4 8-12 14-24 14zM32 30c-6-6-14-6-20-2 6 4 12 4 20 2z"/>`,
  },
  pizza: {
    el: 'fire',
    svg: `<path d="M6 10c16-8 36-8 52 0L32 62z"/><path fill="#16121f" d="M8 14c16-6 32-6 48 0l-2 4c-14-6-30-6-44 0z"/><circle cx="24" cy="24" r="5" fill="#16121f"/><circle cx="40" cy="26" r="5" fill="#16121f"/><circle cx="32" cy="40" r="4" fill="#16121f"/>`,
  },
  // ---- locked content
  lock: {
    el: 'steel',
    svg: `<path d="M18 30V20a14 14 0 0 1 28 0v10h-7V20a7 7 0 0 0-14 0v10z"/><rect x="10" y="30" width="44" height="30"/><circle cx="32" cy="42" r="5" fill="#16121f"/><path d="M29 44h6l2 10H27z" fill="#16121f"/>`,
  },
  // ---- act 2 rules (intents, enemy passives, Blackout, Inflation)
  dots: {
    el: 'shadow',
    svg: `<rect x="4" y="26" width="14" height="14"/><rect x="25" y="26" width="14" height="14"/><rect x="46" y="26" width="14" height="14"/>`,
  },
  runner: {
    el: 'nature',
    svg: `<circle cx="44" cy="9" r="7"/><path d="M30 18h12l10 12-6 5-7-7-4 7 10 8-2 15h-9l2-11-10-8-6 12-6-4 10-19z"/><path d="M2 58h22v4H2z"/>`,
  },
  coinStack: {
    el: 'holy',
    svg: `<path d="M8 44v8c0 5 11 8 24 8s24-3 24-8v-8z"/><ellipse cx="32" cy="44" rx="24" ry="8"/><path d="M8 32v8c0 5 11 8 24 8s24-3 24-8v-8z"/><ellipse cx="32" cy="32" rx="24" ry="8"/><path d="M8 20v8c0 5 11 8 24 8s24-3 24-8v-8z"/><ellipse cx="32" cy="20" rx="24" ry="8"/><path d="M8 44c0 4 11 8 24 8s24-4 24-8M8 32c0 4 11 8 24 8s24-4 24-8M8 20c0 4 11 8 24 8s24-4 24-8" stroke="#16121f" stroke-width="3" fill="none"/>`,
  },
  unpaidBill: {
    el: 'curse',
    svg: `<path d="M10 4h44v56l-7-5-7 5-8-5-8 5-7-5-7 5z"/><path fill="#16121f" d="M18 14h28v4H18zM18 24h28v4H18zM18 34h16v4H18z"/><path fill="#16121f" d="M38 34h8v8h-8z"/>`,
  },
  pushpin: {
    el: 'steel',
    svg: `<path d="M20 4h24l-5 5v13l11 13H14l11-13V9z"/><rect x="30" y="36" width="4" height="24"/>`,
  },
  medal: {
    el: 'holy',
    svg: `<path d="M16 38l-10 22 12-5 7 7 8-26zM48 38l10 22-12-5-7 7-8-26z"/><circle cx="32" cy="24" r="20"/><circle cx="32" cy="24" r="13" fill="#16121f"/>${star4(32, 24, 10)}`,
  },
  mrBurnsEmpire: {
    el: 'holy',
    svg: `<path d="M2 62C10 52 14 42 14 32 14 24 12 20 10 16H42C40 20 38 24 38 32 38 42 42 52 50 62z"/><rect x="52" y="14" width="10" height="48"/><path d="M52 24h10M52 34h10" stroke="#16121f" stroke-width="3"/><path d="M33 33c-2-5-14-5-14 1 0 6 14 4 14 10 0 5-12 6-15 1M26 28v24" stroke="#16121f" stroke-width="4.5" fill="none"/><circle cx="18" cy="8" r="7"/><circle cx="30" cy="5" r="6"/><circle cx="57" cy="7" r="5"/>`,
  },
  huddle: {
    el: 'nature',
    svg: `<circle cx="18" cy="12" r="8"/><path d="M6 32a12 12 0 0 1 24 0v12H6z"/><circle cx="46" cy="12" r="8"/><path d="M34 32a12 12 0 0 1 24 0v12H34z"/><path d="M6 52h36v-5l14 8-14 8v-5H6z"/>`,
  },
  crystalUp: {
    el: 'arcane',
    svg: `<path d="M24 14l14 16-14 34-14-34z"/><path fill="#16121f" d="M24 26l7 8-7 18-7-18z"/><path d="M50 4l12 14H54v14H46V18h-8z"/>`,
  },
  stakhanov: {
    el: 'blood',
    svg: `<path d="M8 38C8 18 18 6 32 6s24 12 24 32z"/><rect x="4" y="34" width="56" height="14" rx="7"/><path d="M4 46h14v8a7 7 0 0 1-14 0zM46 46h14v8a7 7 0 0 1-14 0z"/><path d="M6 37h52" stroke="#16121f" stroke-width="3"/><path d="M8 43h5M17 43h5M27 43h5M37 43h5M47 43h5" stroke="#16121f" stroke-width="3.5"/><path fill="#16121f" d="M32 9l4.5 9.5 10 1.3-7.4 7 1.9 10L32 32l-9 4.8 1.9-10-7.4-7 10-1.3z" transform="translate(0 0) scale(1 .9) translate(0 1)"/>`,
  },
  brownNose: {
    el: 'curse',
    svg: `<path d="M26 4h12v26c10 2 18 8 18 18 0 6-6 10-12 10-5 0-8-3-12-3s-7 3-12 3c-6 0-12-4-12-10 0-10 8-16 18-18z"/><ellipse cx="22" cy="48" rx="4" ry="5" fill="#16121f"/><ellipse cx="42" cy="48" rx="4" ry="5" fill="#16121f"/><path ${HI} d="M29 8h3v20h-3z"/>`,
  },
  uTurn: {
    el: 'arcane',
    svg: `<path d="M4 20l16-14v9h40v10H20v9z"/><path d="M60 44L44 58v-9H4V39h40v-9z"/>`,
  },
  paperCut: {
    el: 'blood',
    svg: `<path d="M10 4h30l14 14v42H10z"/><path fill="#16121f" d="M40 4v14h14z"/><path d="M4 44l56-14" stroke="#16121f" stroke-width="6"/>`,
  },
  pile: {
    el: 'holy',
    svg: `<rect x="4" y="32" width="28" height="28"/><rect x="11" y="20" width="31" height="33" fill="#16121f"/><rect x="14" y="23" width="25" height="27"/><rect x="22" y="5" width="35" height="38" fill="#16121f"/><rect x="25" y="8" width="29" height="32"/>`,
  },
  paperRoll: {
    el: 'holy',
    svg: `<circle cx="30" cy="26" r="22"/><circle cx="30" cy="26" r="9" fill="#16121f"/><path ${HI} d="M12 18c3-6 8-9 14-10-5 3-8 7-9 13z"/><path d="M22 44h40v10H26z"/>`,
  },
  scanner: {
    el: 'arcane',
    svg: `<rect x="4" y="30" width="56" height="26"/><rect x="10" y="36" width="44" height="6" fill="#16121f"/><path d="M4 26l8-18h40l8 18z"/><rect x="2" y="44" width="60" height="4"/>`,
  },
  ruler: {
    el: 'steel',
    svg: `<rect x="-6" y="24" width="76" height="18" transform="rotate(-35 32 32)"/><g transform="rotate(-35 32 32)" fill="#16121f"><rect x="2" y="24" width="3" height="8"/><rect x="12" y="24" width="3" height="5"/><rect x="22" y="24" width="3" height="8"/><rect x="32" y="24" width="3" height="5"/><rect x="42" y="24" width="3" height="8"/><rect x="52" y="24" width="3" height="5"/></g>`,
  },
  lotus: {
    el: 'nature',
    svg: `<circle cx="32" cy="12" r="9"/><path d="M22 24h20l6 24H16z"/><ellipse cx="32" cy="50" rx="28" ry="9"/><path d="M22 28L8 44l6 4 12-14zM42 28l14 16-6 4-12-14z"/>`,
  },
  calculator: {
    el: 'steel',
    svg: `<rect x="10" y="4" width="44" height="56"/><rect x="16" y="10" width="32" height="12" fill="#16121f"/><g fill="#16121f"><rect x="16" y="28" width="8" height="7"/><rect x="28" y="28" width="8" height="7"/><rect x="40" y="28" width="8" height="7"/><rect x="16" y="39" width="8" height="7"/><rect x="28" y="39" width="8" height="7"/><rect x="40" y="39" width="8" height="18"/><rect x="16" y="50" width="20" height="7"/></g>`,
  },
  watchEye: {
    el: 'arcane',
    svg: `<path d="M2 32C12 14 22 8 32 8s20 6 30 24C52 50 42 56 32 56S12 50 2 32z"/><circle cx="32" cy="32" r="14" fill="#16121f"/><circle cx="32" cy="32" r="7"/><circle cx="32" cy="32" r="3" fill="#16121f"/>`,
  },
  bulbOff: {
    el: 'shadow',
    svg: `<path d="M32 4c12 0 20 8 20 20 0 8-4 12-8 16v8H20v-8c-4-4-8-8-8-16 0-12 8-20 20-20z"/><path d="M26 24l12 12M38 24L26 36" stroke="#16121f" stroke-width="5"/><rect x="20" y="50" width="24" height="5"/><rect x="24" y="57" width="16" height="5"/>`,
  },
  inflation: {
    el: 'holy',
    svg: `<circle cx="24" cy="38" r="20"/><path d="M20 30h10v5h-6v2h6v11H20v-5h6v-2h-6z" fill="#16121f"/><path d="M44 4h16v16l-5-5-8 8-6-6 8-8z"/>`,
  },
  // Class fillers
  releaseTheHounds: {
    el: 'blood',
    svg: `<path d="M2 62L6 32 2 4l22 12 14-2 12 8 11 6 2 6-6 4H34l-4 4 24 8v8l-14 2-8-4-2 10z"/><path d="M34 40h22l-4 9-14-2z" fill="#16121f"/><path d="M40 40l3 6 3-6M49 40l2 5 2-5" fill="#fff"/><circle cx="37" cy="26" r="3.5" fill="#16121f"/><path d="M29 20l12 4" stroke="#16121f" stroke-width="3.5"/><circle cx="59" cy="33" r="2.5" fill="#16121f"/><path d="M8 36C10 24 16 19 25 18" stroke="#16121f" stroke-width="3.5" fill="none"/><path d="M3 52h26" stroke="#16121f" stroke-width="4"/><path d="M8 50v-5M15 50v-5M22 50v-5" stroke="#fff" stroke-width="3"/>`,
  },
  barbedWire: {
    el: 'steel',
    svg: `<rect x="2" y="29" width="60" height="6"/><g ${S} stroke-width="5"><path d="M6 20l14 24M20 20L6 44M26 20l14 24M40 20L26 44M46 20l14 24M60 20L46 44"/></g>`,
  },
  blowOffSteam: {
    el: 'steel',
    svg: `<rect x="4" y="46" width="56" height="12"/><rect x="28" y="28" width="8" height="20"/><ellipse cx="32" cy="26" rx="20" ry="6"/><circle cx="18" cy="10" r="7"/><circle cx="32" cy="6" r="7"/><circle cx="46" cy="10" r="7"/>`,
  },
  steelToes: {
    el: 'steel',
    svg: `<path d="M12 4h24v26c0 4 6 7 12 8 8 2 14 6 14 14v2H12z"/><path d="M16 12h16M16 20h16" stroke="#16121f" stroke-width="3"/><path fill="#16121f" d="M40 38c8 2 18 4 20 10v4H40z"/><rect x="10" y="52" width="54" height="8" fill="#16121f" opacity=".6"/>`,
  },
  overstock: {
    el: 'steel',
    svg: `<rect x="4" y="54" width="56" height="8"/><rect x="6" y="32" width="24" height="20"/><rect x="34" y="32" width="24" height="20"/><rect x="18" y="8" width="28" height="22"/><path d="M18 19h28M18 41h12M34 41h24" stroke="#16121f" stroke-width="3"/>`,
  },
  gradCap: {
    el: 'arcane',
    svg: `<path d="M32 6L2 20l30 14 30-14z"/><path d="M14 30v14c0 5 8 10 18 10s18-5 18-10V30L32 38z"/><path d="M56 24v22" stroke="#16121f" stroke-width="3"/><circle cx="56" cy="50" r="5"/>`,
  },
  spamFilter: {
    el: 'arcane',
    svg: `<rect x="4" y="12" width="44" height="32"/><path d="M4 12l22 18 22-18" stroke="#16121f" stroke-width="3" fill="none"/><circle cx="46" cy="44" r="16" fill="#16121f"/><g ${S} stroke-width="5"><circle cx="46" cy="44" r="10"/><path d="M39 51l14-14"/></g>`,
  },
  thermalShock: {
    el: 'ice',
    svg: `<rect x="24" y="4" width="16" height="42" rx="8"/><circle cx="32" cy="48" r="13"/><rect x="29" y="14" width="6" height="30" fill="#16121f"/><circle cx="32" cy="48" r="7" fill="#16121f"/><path d="M46 12h10M46 22h6M46 32h10M8 12h10M12 22h6M8 32h10" stroke="currentColor" stroke-width="3"/><path d="M40 2l-6 12 6-3-2 12 8-14-6 2z" fill="#fff"/>`,
  },
  yogurt: {
    el: 'necro',
    svg: `<path d="M10 22h44l-6 36H16z"/><rect x="8" y="14" width="48" height="8"/><path d="M40 14c4-8 14-10 18-6-6 0-10 2-12 6z"/><path fill="#16121f" opacity=".45" d="M16 30h32l-2 16H18z"/><circle cx="26" cy="38" r="3" fill="#16121f"/><circle cx="36" cy="42" r="2.5" fill="#16121f"/><circle cx="40" cy="35" r="2" fill="#16121f"/>`,
  },
  slingshot: {
    el: 'blood',
    svg: `<path d="M26 62V38L8 8h12l12 20 12-20h12L38 38v24z"/><path d="M14 10Q32 34 50 10" stroke="#16121f" stroke-width="3" fill="none"/><circle cx="32" cy="27" r="5" fill="#16121f"/>`,
  },
  petriDish: {
    el: 'necro',
    svg: `<ellipse cx="32" cy="36" rx="29" ry="23"/><ellipse cx="32" cy="36" rx="22" ry="16" fill="#16121f"/><circle cx="24" cy="32" r="4"/><circle cx="39" cy="29" r="3"/><circle cx="35" cy="42" r="5"/><circle cx="22" cy="44" r="2.5"/>`,
  },
  gasMask: {
    el: 'necro',
    svg: `<path d="M12 8h40v22c0 14-8 24-20 24S12 44 12 30z"/><circle cx="22" cy="26" r="8" fill="#16121f"/><circle cx="42" cy="26" r="8" fill="#16121f"/><circle cx="20" cy="23" r="2.5"/><circle cx="40" cy="23" r="2.5"/><rect x="25" y="44" width="14" height="16" rx="3"/><path d="M27 49h10M27 54h10" stroke="#16121f" stroke-width="2"/>`,
  },
  healthPlan: {
    el: 'holy',
    svg: `<rect x="6" y="18" width="52" height="40" rx="4"/><path d="M22 18v-8h20v8" stroke="currentColor" stroke-width="5" fill="none"/><path fill="#16121f" d="M28 26h8v8h8v8h-8v8h-8v-8h-8v-8h8z"/>`,
  },
  sisyphus: {
    el: 'necro',
    svg: `<path d="M2 58L62 38" ${S} stroke-width="6"/><circle cx="46" cy="22" r="17" stroke="#16121f" stroke-width="4"/><circle cx="46" cy="22" r="17"/><path d="M38 14l6 4-2 6M52 28l4 5M40 32l6-3" stroke="#16121f" stroke-width="3" fill="none"/><g ${S} stroke-width="6"><path d="M17 27l2 15M18 31l11-1M19 42L9 52M19 42l8 7"/></g><circle cx="16" cy="19" r="6.5"/>`,
  },
  // Rooms and statuses
  shredder: {
    el: 'steel',
    svg: `<path d="M20 2h24v14H20z"/><rect x="6" y="14" width="52" height="16"/><rect x="12" y="20" width="40" height="4" fill="#16121f"/><path d="M10 30h44v24H10z"/><path d="M14 54h4v8h-4zM22 54h4v6h-4zM30 54h4v8h-4zM38 54h4v6h-4zM46 54h4v8h-4z"/>`,
  },
  parachute: {
    el: 'holy',
    svg: `<path d="M4 30C4 14 16 4 32 4s28 10 28 26c-6-6-10-6-14 0-4-6-10-6-14 0-4-6-10-6-14 0-4-6-8-6-14 0z"/><g ${S} stroke-width="3"><path d="M10 32l20 20M54 32L34 52M32 30v22"/></g><rect x="26" y="50" width="12" height="11"/>`,
  },
  // ---- relics and rooms
  stressBall: {
    el: 'holy',
    svg: `<circle cx="32" cy="34" r="25"/><path fill="#16121f" opacity=".4" d="M10 30c14 6 30 6 44 0v5c-14 7-30 7-44 0z"/><path ${HI} d="M18 22c3-6 9-9 15-9-7 2-11 6-13 12z"/><circle cx="25" cy="42" r="2.5" fill="#16121f"/><circle cx="39" cy="42" r="2.5" fill="#16121f"/>`,
  },
  thermos: {
    el: 'steel',
    svg: `<rect x="20" y="3" width="24" height="12" rx="3"/><rect x="16" y="14" width="32" height="47" rx="5"/><rect x="16" y="28" width="32" height="7" fill="#16121f" opacity=".45"/><path ${HI} d="M21 20h4v35h-4z"/>`,
  },
  ergoChair: {
    el: 'steel',
    svg: `<path d="M16 3h24c5 0 7 3 6 8l-3 18H18z"/><rect x="10" y="31" width="44" height="9" rx="3"/><rect x="29" y="40" width="6" height="14"/><path d="M6 58l26-5 26 5v3H6z"/><circle cx="12" cy="61" r="2.5" fill="#16121f"/><circle cx="52" cy="61" r="2.5" fill="#16121f"/>`,
  },
  mug: {
    el: 'fire',
    svg: `<path d="M8 14h36v34c0 7-5 12-12 12H20c-7 0-12-5-12-12z"/><path d="M44 22h6c6 0 10 4 10 10s-4 10-10 10h-6v-6h6c2 0 4-1 4-4s-2-4-4-4h-6z"/><path fill="#16121f" opacity=".4" d="M8 14h36v7H8z"/><path ${HI} d="M13 28h4v20h-4z"/><g ${S} stroke-width="3"><path d="M18 2c3 3-3 5 0 9M30 2c3 3-3 5 0 9"/></g>`,
  },
  wallClock: {
    el: 'holy',
    svg: `<circle cx="32" cy="32" r="29"/><circle cx="32" cy="32" r="22" fill="#16121f" opacity=".4"/><path d="M30 14h4v18h12v4H30z" fill="#16121f"/><path ${HI} d="M12 22c3-6 8-10 14-12-5 4-9 8-11 14z"/>`,
  },
  armband: {
    el: 'blood',
    svg: `<rect x="12" y="4" width="40" height="56" rx="3"/><g fill="#16121f">${star4(32, 32, 15)}</g><path fill="#16121f" opacity=".35" d="M12 4h6v56h-6zM46 4h6v56h-6z"/>`,
  },
  inbox: {
    el: 'steel',
    svg: `<path d="M10 6h44l8 30v22H2V36z"/><path fill="#16121f" opacity=".4" d="M2 36h18l4 8h16l4-8h18v4H2z"/><path d="M21 21l8 8 14-14" fill="none" stroke="#16121f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  heavyStapler: {
    el: 'steel',
    svg: `<path d="M2 38h60v10H2z"/><path d="M8 38L18 14h34c6 0 10 3 10 9v15z"/><path fill="#16121f" opacity=".4" d="M22 20h24v4H22z"/><path d="M12 48h6v10h-6zM46 48h6v10h-6z"/>`,
  },
  badge: {
    el: 'holy',
    svg: `<path d="M18 2h8l6 12 6-12h8L38 20H26z"/><rect x="10" y="18" width="44" height="44" rx="4"/><rect x="25" y="23" width="14" height="4" fill="#16121f"/><rect x="18" y="32" width="16" height="16" fill="#16121f"/><path fill="#16121f" d="M38 34h10v4H38zM38 42h10v4H38z"/>`,
  },
  exitSign: {
    el: 'nature',
    svg: `<path d="M14 3h4v14h-4zM46 3h4v14h-4z"/><rect x="3" y="16" width="58" height="34" rx="2"/><path fill="#16121f" d="M11 33h24v-9l16 11-16 11v-9H11z"/><path d="M8 54h48v6H8z"/>`,
  },
  cargoPants: {
    el: 'nature',
    svg: `<path d="M12 3h40l5 58H37l-5-30-5 30H7z"/><path fill="#16121f" opacity=".4" d="M12 3h40v6H12z"/><rect x="9" y="36" width="13" height="13" fill="#16121f"/><rect x="42" y="36" width="13" height="13" fill="#16121f"/><path ${HI} d="M11 38h9v3h-9zM44 38h9v3h-9z"/>`,
  },
  tailor: {
    el: 'holy',
    svg: `<path d="M24 11c0 4 4 7 8 7s8-3 8-7l14 7 4 15-10 3v22H16V36L6 33l4-15z"/><path fill="#16121f" opacity=".35" d="M29 18h6v38h-6z"/><rect x="29" y="56" width="6" height="6"/><path d="M32 2v6" stroke="currentColor" stroke-width="4"/>`,
  },
  lostBox: {
    el: 'holy',
    svg: `<path d="M2 22h60v38H2z"/><path d="M2 22l8-14h44l8 14z"/><path fill="#16121f" opacity=".35" d="M26 8h12v14H26z"/><rect x="18" y="32" width="28" height="16" fill="#16121f"/><path d="M26 36h12v3h-12zM26 42h8v3h-8z" fill="#fff" opacity=".7"/>`,
  },
  vendingMachine: {
    el: 'steel',
    svg: `<rect x="8" y="2" width="48" height="60" rx="2"/><rect x="13" y="8" width="26" height="36" fill="#16121f"/><path fill="#fff" opacity=".75" d="M16 12h8v8h-8zM28 12h8v8h-8zM16 25h8v8h-8zM28 25h8v8h-8zM16 36h20v5H16z"/><rect x="43" y="10" width="8" height="6" fill="#16121f"/><rect x="43" y="22" width="8" height="4" fill="#16121f"/><rect x="43" y="30" width="8" height="4" fill="#16121f"/><rect x="13" y="49" width="38" height="9" fill="#16121f"/>`,
  },
  // ---- act 3 rules
  sleepMask: {
    el: 'shadow',
    svg: `<path d="M4 26c6-10 18-12 28-4 10-8 22-6 28 4 3 12-2 22-13 24-6 1-11-2-15-7-4 5-9 8-15 7C6 48 1 38 4 26z"/><path d="M14 34q6 6 13 0M37 34q6 6 13 0" fill="none" stroke="#16121f" stroke-width="3.5" stroke-linecap="round"/><path d="M44 4h12l-12 12h12" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  funnel: {
    el: 'steel',
    svg: `<path d="M3 6h58L39 32v22l-14 6V32z"/><path ${HI} d="M8 10h24L22 24z"/><path fill="#16121f" opacity=".4" d="M25 40h14v4H25z"/>`,
  },
  conveyorLine: {
    el: 'steel',
    svg: `<path d="M4 44h56v10H4z"/><g fill="#16121f"><circle cx="12" cy="49" r="3"/><circle cx="26" cy="49" r="3"/><circle cx="40" cy="49" r="3"/><circle cx="54" cy="49" r="3"/></g><rect x="6" y="24" width="16" height="18"/><rect x="28" y="30" width="14" height="12"/><path d="M46 20h8v-6l10 10-10 10v-6h-8z"/>`,
  },
  creepClock: {
    el: 'shadow',
    svg: `<circle cx="28" cy="38" r="24"/><circle cx="28" cy="38" r="17" fill="#16121f" opacity=".5"/><path d="M28 26v13l9 5" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M50 4l10 12h-6v12h-8V16h-6z"/>`,
  },
  lowBattery: {
    el: 'steel',
    svg: `<rect x="3" y="18" width="50" height="30"/><rect x="53" y="27" width="8" height="12"/><rect x="9" y="24" width="38" height="18" fill="#16121f"/><rect x="11" y="26" width="7" height="14"/><path d="M30 8l-8 10h6l-4 8 12-12h-7z" fill="#ffd900" stroke="#16121f" stroke-width="2"/>`,
  },
  brainChip: {
    el: 'arcane',
    svg: `<rect x="14" y="14" width="36" height="36" rx="3"/><path d="M20 4h4v10h-4zM30 4h4v10h-4zM40 4h4v10h-4zM20 50h4v10h-4zM30 50h4v10h-4zM40 50h4v10h-4zM4 20h10v4H4zM4 30h10v4H4zM4 40h10v4H4zM50 20h10v4H50zM50 30h10v4H50zM50 40h10v4H50z"/><path d="M32 22c-6 0-9 4-9 8 0 3 2 5 3 6-1 3 1 6 4 6h4c3 0 5-3 4-6 1-1 3-3 3-6 0-4-3-8-9-8z" fill="#16121f"/><path d="M32 24v18M27 30h5M32 34h5" stroke="#fff" stroke-width="2" opacity=".7"/>`,
  },
  steamGauge: {
    el: 'fire',
    svg: `<circle cx="32" cy="32" r="28"/><circle cx="32" cy="32" r="21" fill="#16121f" opacity=".55"/><path d="M32 32L46 18" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="32" r="4" fill="#fff"/><path d="M12 38l4-1M14 24l4 2M24 13l2 4M38 13l-2 4M50 24l-4 2" stroke="#fff" stroke-width="3" opacity=".8"/><path d="M26 56h12v6H26z"/>`,
  },
  gavel: {
    el: 'steel',
    svg: `<g transform="rotate(-35 32 32)"><rect x="8" y="8" width="38" height="18" rx="3"/><rect x="12" y="8" width="6" height="18" fill="#16121f" opacity=".4"/><rect x="34" y="8" width="6" height="18" fill="#16121f" opacity=".4"/><rect x="24" y="24" width="7" height="34" rx="2"/></g><path d="M34 54h28v8H34z"/>`,
  },
  whiteboard: {
    el: 'steel',
    svg: `<rect x="4" y="4" width="56" height="38" rx="1"/><rect x="9" y="9" width="46" height="28" fill="#16121f"/><path fill="#fff" opacity=".75" d="M14 14h16v3H14zM14 21h26v3H14zM14 28h12v3H14zM42 13h9v9h-9z"/><path d="M12 42h6v18h-6zM46 42h6v18h-6zM10 40h44v4H10z"/>`,
  },
};

export const INTENT_ICON: Record<string, string> = {
  attack: 'sword',
  defend: 'shield',
  buff: 'up',
  debuff: 'down',
  curse: 'skull',
  heal: 'heart',
  steal: 'snatch',
  charge: 'burst',
  drain: 'crystal',
  idle: 'dots',
  absorb: 'scanner',
};

/** Pixel icon (see riso.ts). The vector source above is rasterised once at boot. */
export function icon(id: string, cls = ''): string {
  return pixelIcon(id, cls);
}
