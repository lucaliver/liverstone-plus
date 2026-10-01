import { sprite } from './riso';

/**
 * Stationery sprites on the same 200×200 grid as the creatures, keyed by relic id. Small cute things, most with a face;
 * the renderer turns them into riso pixels like any creature (see riso.ts).
 */
const OUT = 'stroke="#120e18" stroke-width="3" stroke-linejoin="round"';
const INK = '#1b1830';
const PAPER = '#f6f0e4';

/** Two dot eyes with a glint, pink cheeks and a small smile, centred on (cx, cy). */
const face = (cx: number, cy: number, gap = 20, r = 5.5): string =>
  `<circle cx="${cx - gap}" cy="${cy}" r="${r}" fill="${INK}"/><circle cx="${cx + gap}" cy="${cy}" r="${r}" fill="${INK}"/>` +
  `<circle cx="${cx - gap - r * 0.3}" cy="${cy - r * 0.35}" r="${r * 0.35}" fill="#fff"/><circle cx="${cx + gap - r * 0.3}" cy="${cy - r * 0.35}" r="${r * 0.35}" fill="#fff"/>` +
  `<ellipse cx="${cx - gap - 8}" cy="${cy + 9}" rx="7" ry="4.5" fill="#ff3d9a" opacity=".55"/><ellipse cx="${cx + gap + 8}" cy="${cy + 9}" rx="7" ry="4.5" fill="#ff3d9a" opacity=".55"/>` +
  `<path d="M${cx - 6} ${cy + 8}q6 7 12 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;

const star = (cx: number, cy: number, big: number, small: number): string =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 ? small : big;
    return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  }).join(' ');

const stressBall = `
<path d="M100 32c42 0 72 30 72 68s-30 72-72 72-72-34-72-72 30-68 72-68z" fill="#ffd900" ${OUT}/>
<path d="M50 70c-6 18-6 36 2 54M150 70c6 18 6 36-2 54" stroke="#e89400" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M62 56c8-12 20-18 34-20" stroke="#fff2a0" stroke-width="9" fill="none" stroke-linecap="round"/>
${face(100, 100)}`;

const thermos = `
<path d="M72 26h56a6 6 0 0 1 6 6v26H66V32a6 6 0 0 1 6-6z" fill="#ff3d9a" ${OUT}/>
<path d="M60 60h80v106c0 8-6 14-14 14H74c-8 0-14-6-14-14z" fill="#1c5fd0" ${OUT}/>
<path d="M60 72h80M60 164h80" stroke="${PAPER}" stroke-width="7"/>
<path d="M68 88v68" stroke="#6a98ea" stroke-width="6" stroke-linecap="round"/>
<rect x="76" y="88" width="56" height="56" rx="6" fill="${PAPER}" ${OUT}/>
${face(104, 112, 14, 5)}`;

const ergoChair = `
<path d="M64 28h72c10 0 16 8 14 18l-6 52H56l-6-52c-2-10 4-18 14-18z" fill="#ffd900" ${OUT}/>
<path d="M66 40h8" stroke="#fff2a0" stroke-width="7" stroke-linecap="round"/>
<path d="M30 104c0-8 6-12 14-12h112c8 0 14 4 14 12v14c0 6-4 10-10 10H40c-6 0-10-4-10-10z" fill="#ff3d9a" ${OUT}/>
<rect x="92" y="128" width="16" height="30" fill="#3a3450" ${OUT}/>
<path d="M100 156L36 176M100 156l64 20" stroke="#120e18" stroke-width="14" stroke-linecap="round"/><path d="M100 156L36 176M100 156l64 20" stroke="#3a3450" stroke-width="8" stroke-linecap="round"/>
<circle cx="34" cy="182" r="9" fill="${PAPER}" ${OUT}/><circle cx="166" cy="182" r="9" fill="${PAPER}" ${OUT}/><circle cx="100" cy="184" r="9" fill="${PAPER}" ${OUT}/>
${face(100, 64, 18, 5)}`;

const coffeeMug = `
<path d="M62 20c-8 8 8 14 0 24M92 16c-8 8 8 14 0 28" stroke="#9ab8f0" stroke-width="6" fill="none" stroke-linecap="round"/>
<path d="M136 86h12c18 0 24 12 24 26s-6 26-24 26h-12" stroke="#120e18" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M136 86h12c18 0 24 12 24 26s-6 26-24 26h-12" stroke="${PAPER}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M36 64h104v86c0 16-12 28-28 28H64c-16 0-28-12-28-28z" fill="${PAPER}" ${OUT}/>
<ellipse cx="88" cy="64" rx="52" ry="12" fill="#6a3a1a" ${OUT}/>
<path d="M37 140h102" stroke="#ff3d9a" stroke-width="9"/>
${face(88, 106, 22, 6)}`;

const wallClock = `
<circle cx="100" cy="100" r="76" fill="#1c5fd0" ${OUT}/>
<circle cx="100" cy="100" r="62" fill="${PAPER}" ${OUT}/>
<path d="M100 44v10M100 146v10M44 100h10M146 100h10" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
<path d="M100 100L80 74" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M100 100l26-28" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
<circle cx="100" cy="100" r="7" fill="#ff3d9a" ${OUT}/>
${face(100, 124, 20, 5)}`;

const unionArmband = `
<path d="M48 36c34 12 70 12 104 0l10 126c-38 14-84 14-124 0z" fill="#ff3d9a" ${OUT}/>
<path d="M54 52c32 10 60 10 92 0M56 148c34 10 54 10 88 0" stroke="${PAPER}" stroke-width="3" stroke-dasharray="7 6" fill="none"/>
<circle cx="100" cy="100" r="44" fill="${PAPER}" ${OUT}/>
<polygon points="${star(100, 101, 38, 17)}" fill="${INK}" ${OUT}/>
<circle cx="91" cy="102" r="3.5" fill="${PAPER}"/><circle cx="109" cy="102" r="3.5" fill="${PAPER}"/>
<path d="M95 110q5 5 10 0" stroke="${PAPER}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;

const inboxZero = `
<g transform="rotate(-9 74 90)"><rect x="40" y="26" width="76" height="92" fill="${PAPER}" ${OUT}/><path d="M50 44h56M50 58h56M50 72h40" stroke="#1c5fd0" stroke-width="5"/></g>
<g transform="rotate(7 130 90)"><rect x="92" y="34" width="72" height="88" fill="${PAPER}" ${OUT}/><path d="M102 52h52M102 66h52" stroke="#1c5fd0" stroke-width="5"/><rect x="118" y="82" width="34" height="30" fill="#ff3d9a" ${OUT}/></g>
<path d="M44 108h112l26 28H18z" fill="#e89400" ${OUT}/>
<path d="M18 134h164v38c0 6-4 10-10 10H28c-6 0-10-4-10-10z" fill="#ffd900" ${OUT}/>
<path d="M30 140h140" stroke="#fff2a0" stroke-width="5" stroke-linecap="round"/>
${face(100, 158, 26, 5.5)}`;

const heavyStapler = `
<path d="M16 148h168v26c0 4-3 6-6 6H22c-3 0-6-2-6-6z" fill="#1c5fd0" ${OUT}/>
<path d="M30 140h44l-3 8H33z" fill="#c8d0e0" ${OUT}/><path d="M30 158h120" stroke="#6a98ea" stroke-width="6" stroke-linecap="round"/>
<g transform="rotate(-9 172 128)">
<path d="M14 100c0-18 18-32 44-32h116c8 0 14 6 14 14v50c0 6-4 10-10 10H24c-6 0-10-4-10-10z" fill="#ff3d9a" ${OUT}/>
<path d="M50 80h100" stroke="#ff9ac8" stroke-width="7" stroke-linecap="round"/>
<path d="M14 118h50l6 10H14z" fill="#3a3450" ${OUT}/>
<circle cx="172" cy="104" r="8" fill="#ffd900" ${OUT}/>
${face(98, 100, 22, 6)}</g>`;

const spareBadge = `
<path d="M56 0h24l26 60H84z" fill="#ffd900" ${OUT}/><path d="M144 0h-24l-26 60h22z" fill="#ffd900" ${OUT}/>
<rect x="90" y="52" width="20" height="18" rx="2" fill="#3a3450" ${OUT}/>
<rect x="46" y="64" width="108" height="128" rx="12" fill="${PAPER}" ${OUT}/>
<rect x="84" y="74" width="32" height="7" rx="3.5" fill="${INK}"/>
<rect x="50" y="90" width="100" height="18" fill="#1c5fd0"/>
<rect x="66" y="116" width="68" height="46" fill="#ffd900" ${OUT}/>
${face(100, 134, 14, 4)}
<path d="M64 174h72M72 184h56" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;

const emergencyExit = `
<rect x="46" y="0" width="9" height="46" fill="#3a3450" ${OUT}/><rect x="145" y="0" width="9" height="46" fill="#3a3450" ${OUT}/>
<rect x="18" y="40" width="164" height="100" rx="8" fill="#2e8a4a" ${OUT}/>
<rect x="27" y="49" width="146" height="82" rx="4" fill="none" stroke="${PAPER}" stroke-width="3"/>
<path d="M38 90h32V76l24 20-24 20v-14H38z" fill="${PAPER}" ${OUT}/>
<rect x="108" y="58" width="52" height="66" fill="${PAPER}" ${OUT}/>
<circle cx="140" cy="76" r="7" fill="#2e8a4a"/>
<path d="M138 84l-6 16M132 100l-9 12M132 100l12 6 3 10M138 88l-14-3M138 88l12 8" stroke="#2e8a4a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<path d="M30 140h140v14H30z" fill="#3a3450" ${OUT}/>`;

const cargoPants = `
<path d="M50 16h100l20 166h-52l-18-82-18 82H30z" fill="#7c8a2e" ${OUT}/>
<path d="M50 16h100v22H50z" fill="#5e6a22" ${OUT}/>
<path d="M62 12v30M138 12v30" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
<path d="M100 38v50" stroke="#3e4818" stroke-width="4"/><circle cx="100" cy="30" r="6" fill="#ffd900" ${OUT}/>
<path d="M38 96h46v52H38z" fill="#6a7626" ${OUT}/><path d="M38 96h46v16H38z" fill="#5e6a22" ${OUT}/><circle cx="61" cy="112" r="4.5" fill="#ffd900" ${OUT}/>
<path d="M116 96h46v52h-46z" fill="#6a7626" ${OUT}/><path d="M116 96h46v16h-46z" fill="#5e6a22" ${OUT}/><circle cx="139" cy="112" r="4.5" fill="#ffd900" ${OUT}/>
<path d="M44 168h34M122 168h34" stroke="#ff3d9a" stroke-width="5" stroke-linecap="round"/>`;

/** Sprite sources by relic id, as the renderer wants them (`relic.` keeps them apart from creature ids). */
export const RELIC_SPRITES: Record<string, string> = Object.fromEntries(
  Object.entries({
    stressBall,
    thermos,
    ergoChair,
    coffeeMug,
    wallClock,
    unionArmband,
    inboxZero,
    heavyStapler,
    spareBadge,
    emergencyExit,
    cargoPants,
  }).map(([id, svg]) => [`relic.${id}`, svg]),
);

/** Riso-pixel sprite of a relic (see riso.ts). */
export const relicArt = (id: string, cls = ''): string => sprite(`relic.${id}`, cls);
