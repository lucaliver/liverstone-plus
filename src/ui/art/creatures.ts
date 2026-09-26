import { sprite } from './riso';

/**
 * Hand-built vector creatures on a 200×200 grid. Parts carry classes (`.eye`, `.limb`)
 * that CSS animates. Gradient ids are prefixed per creature to avoid collisions.
 */
const OUT = 'stroke="#120e18" stroke-width="3" stroke-linejoin="round"';

const lg = (id: string, a: string, b: string, x2 = 0, y2 = 1): string =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const rg = (id: string, a: string, b: string): string =>
  `<radialGradient id="${id}" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
const glow = (id: string, color: string): string =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity=".9"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
const eyes = (x1: number, x2: number, y: number, r: number, color: string, id: string): string =>
  `<g class="eye"><circle cx="${x1}" cy="${y}" r="${r * 2.6}" fill="url(#${id})"/><circle cx="${x2}" cy="${y}" r="${r * 2.6}" fill="url(#${id})"/><circle cx="${x1}" cy="${y}" r="${r}" fill="${color}"/><circle cx="${x2}" cy="${y}" r="${r}" fill="${color}"/><circle cx="${x1 - r * 0.3}" cy="${y - r * 0.35}" r="${r * 0.35}" fill="#fff"/><circle cx="${x2 - r * 0.3}" cy="${y - r * 0.35}" r="${r * 0.35}" fill="#fff"/></g>`;
const shadow = `<ellipse cx="100" cy="188" rx="62" ry="9" fill="#000" opacity=".35"/>`;

const rat = `
<defs>${rg('rat-b', '#b89cf0', '#5a3fb0')}${lg('rat-e', '#ff8ac8', '#ff3d9a')}${glow('rat-g', '#ff3b3b')}</defs>
${shadow}
<path class="limb" d="M150 160c30 0 44-20 36-40-4-10-14-10-14-2 6 14-4 28-24 28" fill="none" stroke="#ff3d9a" stroke-width="7" stroke-linecap="round"/>
<path d="M40 150c-6-40 20-80 60-82 40-2 66 34 60 76-3 22-30 34-60 34s-58-10-60-28z" fill="url(#rat-b)" ${OUT}/>
<path d="M58 176l-6 10h18l2-10zM130 176l-2 10h18l-4-10z" fill="#ff8ac8" ${OUT}/>
<circle cx="56" cy="76" r="24" fill="url(#rat-b)" ${OUT}/><circle cx="56" cy="76" r="14" fill="url(#rat-e)"/>
<circle cx="144" cy="76" r="24" fill="url(#rat-b)" ${OUT}/><circle cx="144" cy="76" r="14" fill="url(#rat-e)"/>
<path d="M62 110c0-22 16-36 38-36s38 14 38 36c0 18-18 40-38 44-20-4-38-26-38-44z" fill="#c8b4f4" ${OUT}/>
<path d="M88 138c4 10 20 10 24 0l-12 20z" fill="#2a1e22" ${OUT}/>
<path d="M94 146h5v9h-5zM101 146h5v9h-5z" fill="#f6ecd2"/>
<ellipse cx="100" cy="134" rx="9" ry="6" fill="#ff3d9a" ${OUT}/>
<path d="M76 134l-30-6M76 140l-28 4M124 134l30-6M124 140l28 4" stroke="#f6f0e4" stroke-width="2" opacity=".7"/>
${eyes(82, 118, 108, 6, '#ff4a3a', 'rat-g')}
<path d="M70 96l20 6M130 96l-20 6" stroke="#120e18" stroke-width="5" stroke-linecap="round"/>`;

const skeleton = `
<defs>${lg('sk-b', '#fbf4df', '#f6e27a')}${lg('sk-s', '#6a9ae8', '#1c5fd0', 1, 1)}${glow('sk-g', '#7de3ff')}</defs>
${shadow}
<g class="limb"><path d="M150 112l34-84 8 4-26 86z" fill="url(#sk-s)" ${OUT}/><path d="M142 110l24 8-4 8-24-8z" fill="#6b4a2a" ${OUT}/></g>
<path d="M86 118h28v58H86z" fill="#5a3fb0"/>
<g fill="url(#sk-b)" ${OUT}>
<rect x="95" y="100" width="10" height="70" rx="4"/>
<path d="M70 112c10-6 50-6 60 0l-4 10c-10-4-42-4-52 0z"/><path d="M72 128c10-5 46-5 56 0l-4 9c-10-4-38-4-48 0z"/><path d="M76 144c8-4 40-4 48 0l-4 9c-8-3-32-3-40 0z"/>
<path d="M80 168c10-8 30-8 40 0l-6 10H86z"/>
<path d="M68 110L46 146l8 4 22-32z"/><path d="M132 110l18 14-4 8-20-12z"/>
<path d="M86 176l-6 12h12l2-12zM114 176l6 12h-12l-2-12z"/>
<path d="M62 60c0-26 16-42 38-42s38 16 38 42c0 14-6 22-12 26v14H74V86c-6-4-12-12-12-26z"/>
</g>
<path d="M44 148l-4 8 10 2 4-8z" fill="url(#sk-b)" ${OUT}/>
<path d="M78 58c0-6 6-10 12-8l4 12-12 6c-4-2-4-6-4-10zM122 58c0-6-6-10-12-8l-4 12 12 6c4-2 4-6 4-10z" fill="#1a1422"/>
${eyes(88, 112, 60, 4, '#9ef0ff', 'sk-g')}
<path d="M96 70l4 8 4-8z" fill="#1a1422"/>
<path d="M80 88h40M86 86v6M93 86v6M100 86v6M107 86v6M114 86v6" stroke="#1a1422" stroke-width="2.5"/>
<path d="M70 40c10-14 40-18 56-4" stroke="#fff" stroke-width="4" opacity=".35" fill="none" stroke-linecap="round"/>`;

const slime = `
<defs><radialGradient id="sl-b" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#ffe45a"/><stop offset=".45" stop-color="#9ac85a"/><stop offset="1" stop-color="#1b6a3a"/></radialGradient>${glow('sl-g', '#fffb8a')}</defs>
${shadow}
<path d="M24 176c-6-50 20-120 76-124 56 4 82 74 76 124-2 8-10 10-20 10H44c-10 0-18-2-20-10z" fill="url(#sl-b)" ${OUT} opacity=".95"/>
<path d="M44 186c0-10 8-10 10-2M150 186c2-12 10-10 10 0M96 186c0-14 10-14 10 0" fill="#3a9a34" ${OUT}/>
<circle cx="140" cy="140" r="10" fill="#caff9a" opacity=".45"/><circle cx="60" cy="150" r="7" fill="#caff9a" opacity=".45"/><circle cx="120" cy="164" r="5" fill="#caff9a" opacity=".45"/>
<ellipse cx="80" cy="114" rx="16" ry="19" fill="#fff" ${OUT}/><ellipse cx="124" cy="114" rx="16" ry="19" fill="#fff" ${OUT}/>
<g class="eye"><circle cx="84" cy="118" r="8" fill="#1a1422"/><circle cx="120" cy="118" r="8" fill="#1a1422"/><circle cx="81" cy="115" r="3" fill="#fff"/><circle cx="117" cy="115" r="3" fill="#fff"/></g>
<path d="M82 146c10 10 30 10 40 0" stroke="#1a3a1a" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M58 82c10-16 26-24 40-22-16 6-26 16-32 30z" fill="#fff" opacity=".5"/>`;

const cultist = `
<defs>${lg('cu-r', '#b070d8', '#4a2090')}${lg('cu-h', '#c080e0', '#5a2aa0')}${glow('cu-g', '#ff4af0')}${glow('cu-c', '#ffb347')}</defs>
${shadow}
<path d="M40 186c4-50 20-90 60-96 40 6 56 46 60 96z" fill="url(#cu-r)" ${OUT}/>
<path d="M100 96v90" stroke="#b58ae0" stroke-width="3" opacity=".6"/>
<path d="M80 130l20 14 20-14-20 36z" fill="#d8a64a" ${OUT} opacity=".85"/>
<path d="M58 30c10-16 74-16 84 0 10 20 6 60-6 76H64c-12-16-16-56-6-76z" fill="url(#cu-h)" ${OUT}/>
<path d="M72 50c8-10 48-10 56 0 6 12 4 36-4 48H76c-8-12-10-36-4-48z" fill="#0c0612"/>
${eyes(88, 112, 72, 4.5, '#ff6af5', 'cu-g')}
<g class="limb"><path d="M40 150c-10-10-10-30 6-40l10 6c-10 8-10 22-4 30z" fill="url(#cu-r)" ${OUT}/>
<rect x="30" y="84" width="10" height="26" rx="3" fill="#f1e6c8" ${OUT}/><path d="M35 84c-4-6 0-12 0-16 4 4 6 10 0 16z" fill="#ffb347"/><circle cx="35" cy="74" r="14" fill="url(#cu-c)"/></g>
<path d="M158 150c10-10 10-30-6-40l-10 6c10 8 10 22 4 30z" fill="url(#cu-r)" ${OUT}/>
<path d="M154 108l14-30 5 3-12 30z" fill="#bfc6d0" ${OUT}/>`;

const goblin = `
<defs>${rg('go-b', '#a8c860', '#5a8a30')}${lg('go-c', '#ff7a4a', '#d03a2a')}${lg('go-s', '#ffe45a', '#e8b820')}${glow('go-g', '#ffe14a')}</defs>
${shadow}
<path d="M140 120c20-4 40 10 40 34s-18 34-40 34-34-14-34-30 14-34 34-38z" fill="url(#go-s)" ${OUT}/>
<path d="M136 118c4-8 14-8 18 0" stroke="#4a2e1c" stroke-width="5" fill="none"/>
<circle cx="150" cy="152" r="7" fill="#ffd54a" ${OUT}/><circle cx="162" cy="164" r="5" fill="#ffd54a" ${OUT}/>
<path d="M62 186l6-60c2-14 14-22 32-22s28 10 30 22l6 60z" fill="url(#go-c)" ${OUT}/>
<path d="M62 150h74" stroke="#2a1a10" stroke-width="6"/><rect x="92" y="144" width="14" height="12" rx="2" fill="#d8b04a" ${OUT}/>
<path d="M30 60l40 22-6 14c-18-4-30-18-34-36zM170 60l-40 22 6 14c18-4 30-18 34-36z" fill="url(#go-b)" ${OUT}/>
<path d="M58 70c0-26 18-42 42-42s42 16 42 42c0 22-16 42-42 42S58 92 58 70z" fill="url(#go-b)" ${OUT}/>
<path d="M76 58l18 8M124 58l-18 8" stroke="#1a2a12" stroke-width="5" stroke-linecap="round"/>
${eyes(86, 114, 70, 5, '#ffe14a', 'go-g')}
<path d="M80 92c10 8 30 8 40 0" stroke="#1a2a12" stroke-width="4" fill="#3a1414" stroke-linecap="round"/>
<path d="M86 93l4 6 3-5M108 94l3 5 4-6" fill="#f6ecd2"/>
<path d="M96 76l4 10 4-10z" fill="#4f9a3a" ${OUT}/>
<g class="limb"><path d="M60 130c-14 4-22 14-20 26l12 2c0-8 4-14 12-16z" fill="url(#go-b)" ${OUT}/><path d="M40 150l-14-30 6-3 14 30z" fill="#cfd6dd" ${OUT}/></g>`;

const boneKnight = `
<defs>${lg('bk-a', '#7aa8f0', '#1c4fb0')}${lg('bk-b', '#fbf4df', '#f6e27a')}${lg('bk-s', '#ff6ab0', '#c02a80', 1, 1)}${glow('bk-g', '#4af0ff')}${lg('bk-bl', '#fbf4df', '#9ab8f0', 1, 0)}</defs>
${shadow}
<g class="limb"><path d="M156 150L176 6l8 2-12 144z" fill="url(#bk-bl)" ${OUT}/><path d="M146 148h40v8h-40z" fill="#5a3a1a" ${OUT}/><circle cx="166" cy="166" r="7" fill="#c9a34a" ${OUT}/></g>
<path d="M56 186l8-34h72l8 34z" fill="url(#bk-a)" ${OUT}/>
<path d="M52 100c0-10 20-18 48-18s48 8 48 18l-6 56H58z" fill="url(#bk-a)" ${OUT}/>
<path d="M76 104h48l-4 40H80z" fill="#1c2029"/><path d="M84 112h32M86 122h28M88 132h24" stroke="url(#bk-b)" stroke-width="5" stroke-linecap="round"/>
<path d="M36 90c0-10 14-16 26-12l4 26c-12 4-30 0-30-14zM164 90c0-10-14-16-26-12l-4 26c12 4 30 0 30-14z" fill="url(#bk-a)" ${OUT}/>
<path d="M22 110c0-10 8-14 20-14h28c8 0 12 6 12 14v34c0 20-16 36-30 42-14-6-30-22-30-42z" fill="url(#bk-s)" ${OUT}/>
<path d="M52 104v74M26 136h52" stroke="#c9a34a" stroke-width="5"/><circle cx="52" cy="136" r="8" fill="#c9a34a" ${OUT}/>
<path d="M68 42c0-22 14-32 32-32s32 10 32 32v28c0 8-8 14-16 16H84c-8-2-16-8-16-16z" fill="url(#bk-a)" ${OUT}/>
<path d="M68 30C54 24 46 12 48 0c10 8 18 14 26 16zM132 30c14-6 22-18 20-30-10 8-18 14-26 16z" fill="url(#bk-b)" ${OUT}/>
<path d="M76 50h48v10H76z" fill="#0a0c10"/><path d="M98 60h4v20h-4z" fill="#0a0c10"/>
${eyes(88, 112, 55, 3.5, '#8af8ff', 'bk-g')}`;

const lich = `
<defs>${lg('li-r', '#7a4ad0', '#2a1a70')}${lg('li-b', '#fbf4df', '#f6e27a')}${lg('li-c', '#ffe45a', '#ffc800')}${glow('li-g', '#9cff5a')}${glow('li-a', '#8a4aff')}${lg('li-st', '#ff7a4a', '#c03a2a')}</defs>
<ellipse cx="100" cy="110" rx="96" ry="90" fill="url(#li-a)" opacity=".45"/>
${shadow}
<g class="limb"><path d="M162 190l-4-160 7-1 6 161z" fill="url(#li-st)" ${OUT}/><path d="M150 32c0-14 26-14 26 0 0 10-6 14-13 18-7-4-13-8-13-18z" fill="#2a1a3a" ${OUT}/><circle cx="163" cy="30" r="8" fill="#9cff5a"/><circle cx="163" cy="30" r="20" fill="url(#li-g)"/></g>
<path d="M36 190c6-60 24-100 64-110 40 10 58 50 64 110-20-8-40 0-64-8-24 8-44 0-64 8z" fill="url(#li-r)" ${OUT}/>
<path d="M100 84l-18 50 18 40 18-40z" fill="#150c26" opacity=".8"/>
<path d="M60 100c-8 0-26 6-30 30l12 6c4-14 12-22 22-24z" fill="url(#li-r)" ${OUT}/>
<path d="M26 136c-6-2-10 6-6 10l6 4 10-8z" fill="url(#li-b)" ${OUT}/>
<path d="M140 100c8 0 16 4 18 18l-10 6c-2-8-6-12-12-14z" fill="url(#li-r)" ${OUT}/>
<path d="M58 70c0-30 18-48 42-48s42 18 42 48c0 14-6 22-14 26v14H72V96c-8-4-14-12-14-26z" fill="url(#li-b)" ${OUT}/>
<path d="M70 66c0-8 8-12 16-10l4 14-14 8c-4-2-6-6-6-12zM130 66c0-8-8-12-16-10l-4 14 14 8c4-2 6-6 6-12z" fill="#150c26"/>
${eyes(84, 116, 68, 4.5, '#b6ff7a', 'li-g')}
<path d="M95 80l5 10 5-10z" fill="#150c26"/>
<path d="M76 100h48M84 97v8M92 97v8M100 97v8M108 97v8M116 97v8" stroke="#150c26" stroke-width="2.5"/>
<path d="M58 36l6-26 14 16 10-20 12 18 12-18 10 20 14-16 6 26c-12-6-26-8-42-8s-30 2-42 8z" fill="url(#li-c)" ${OUT}/>
<circle cx="100" cy="24" r="5" fill="#9cff5a" ${OUT}/>`;

const warrior = `
<defs>${lg('wa-h', '#9ac0f8', '#1c5fd0', 1, 1)}${lg('wa-p', '#ff6ab0', '#ff3d9a')}${lg('wa-s', '#f0c890', '#a0724a')}${lg('wa-a', '#ff8ac8', '#d03a8a')}</defs>
<path d="M18 200c0-44 34-66 82-66s82 22 82 66z" fill="url(#wa-a)" ${OUT}/>
<path d="M20 170c0-24 18-40 40-40l10 40zM180 170c0-24-18-40-40-40l-10 40z" fill="url(#wa-h)" ${OUT}/>
<path d="M84 140h32v20H84z" fill="url(#wa-p)"/>
<path d="M102 10c26 6 46 26 50 40-14-6-28-8-40-4z" fill="url(#wa-p)" ${OUT}/>
<path d="M52 92c0-38 20-62 48-62s48 24 48 62v40c0 10-10 18-22 18H74c-12 0-22-8-22-18z" fill="url(#wa-h)" ${OUT}/>
<path d="M60 90h80v14H60z" fill="#0c0e14"/><path d="M96 104h8v34h-8z" fill="#0c0e14"/>
<circle cx="84" cy="97" r="3.5" fill="#ffd9a0"/><circle cx="116" cy="97" r="3.5" fill="#ffd9a0"/>
<path d="M100 30v58" stroke="#e6ecf2" stroke-width="5" opacity=".6"/>
<path d="M60 70c4-18 16-30 30-34" stroke="#fff" stroke-width="5" opacity=".35" fill="none" stroke-linecap="round"/>
<g fill="#c9a34a" ${OUT}><circle cx="62" cy="126" r="5"/><circle cx="138" cy="126" r="5"/></g>`;

const mage = `
<defs>${lg('ma-h', '#6a9af8', '#1c4fb0')}${lg('ma-f', '#ffd0e0', '#ff9ac8')}${lg('ma-b', '#fbf4df', '#f6e8a0')}${glow('ma-g', '#7ad8ff')}</defs>
<path d="M18 200c0-44 34-66 82-66s82 22 82 66z" fill="url(#ma-h)" ${OUT}/>
<path d="M100 134l-12 66h24z" fill="#c9a34a" opacity=".8"/>
<path d="M100 2c-8 22-24 40-44 56-4 20 0 40 6 54h76c6-14 10-34 6-54C124 42 108 24 100 2z" fill="url(#ma-h)" ${OUT}/>
<path d="M72 70c0-16 12-24 28-24s28 8 28 24v26c0 14-12 26-28 26s-28-12-28-26z" fill="url(#ma-f)" ${OUT}/>
<path d="M64 60c10-10 22-14 36-14s26 4 36 14l-4 14c-10-8-20-10-32-10s-22 2-32 10z" fill="url(#ma-h)" ${OUT}/>
<g class="eye"><circle cx="88" cy="84" r="9" fill="url(#ma-g)"/><circle cx="112" cy="84" r="9" fill="url(#ma-g)"/><circle cx="88" cy="84" r="3.5" fill="#dff6ff"/><circle cx="112" cy="84" r="3.5" fill="#dff6ff"/></g>
<path d="M72 98c6 26 18 44 28 58 10-14 22-32 28-58-8 6-18 8-28 8s-20-2-28-8z" fill="url(#ma-b)" ${OUT}/>
<path d="M88 104c6 4 18 4 24 0" stroke="#7a7e90" stroke-width="3" fill="none"/>
<g fill="#ffe08a"><path d="M78 30l3 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1z"/><path d="M120 44l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z"/></g>`;

export const CREATURES: Record<string, string> = { rat, skeleton, slime, cultist, goblin, boneKnight, lich, warrior, mage };

/** Riso-pixel sprite of a creature (see riso.ts). */
export function creature(id: string, cls = ''): string {
  return sprite(id, cls);
}
