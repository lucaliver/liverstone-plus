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
<defs>${lg('li-r', '#5a3aa0', '#1b1438')}${lg('li-b', '#f4ecd6', '#c9bd98')}${lg('li-c', '#f0c030', '#b08010')}${glow('li-g', '#ff3d9a')}</defs>
${shadow}
<!-- staff: a spine of bone, two horns holding a soul gem -->
<path d="M162 192l1-146h8l1 146z" fill="url(#li-b)" ${OUT}/>
<path d="M163 58h7M163 70h7M163 82h7M163 94h7M163 106h7M163 118h7M163 130h7M163 142h7M163 154h7M163 166h7M163 178h7" stroke="#8a7a5a" stroke-width="2"/>
<path d="M167 52c-16-2-22-18-18-36 4 12 10 18 18 20 8-2 14-8 18-20 4 18-2 34-18 36z" fill="url(#li-b)" ${OUT}/>
<path d="M167 12l9 16-9 16-9-16z" fill="#ff3d9a" ${OUT}/><path d="M165 20h3v6h-3z" fill="#fff" opacity=".7"/>
<!-- robe with real shoulders, ragged hem -->
<path d="M28 192l8-12 8 10 8-14 8 12 10-10 10 12 10-12 10 12 10-12 10 12 10-12 10 10 8-12 8 14 8-10 8 12c-2-32-8-64-16-84-4-8-14-12-28-14H72c-14 2-24 6-28 14-8 20-14 52-16 84z" fill="url(#li-r)" ${OUT}/>
<path d="M100 112l-12 38 12 40 12-40z" fill="#0c0818"/>
<!-- mantle over the shoulders, gold clasp -->
<path d="M42 110c6-12 26-18 58-18s52 6 58 18l-14 10-14-8-14 10-16-10-16 10-14-10-14 8z" fill="#2a1a50" ${OUT}/>
<path d="M100 104l7 8-7 8-7-8z" fill="url(#li-c)" ${OUT}/>
<!-- left arm: sleeve from the shoulder, bony hand raised to cast -->
<path d="M52 106c-14 6-24 20-28 36l18 6c4-12 10-22 20-28z" fill="url(#li-r)" ${OUT}/>
<g transform="translate(8 -6)"><path d="M20 146l-8-18 6-2 6 12-2-16 6-1 2 16 2-18 6 1-1 18 6-12 5 3-8 18z" fill="url(#li-b)" ${OUT}/></g>
<!-- right arm: sleeve from the shoulder, one hand gripping the staff -->
<path d="M146 104c10 2 16 8 18 16l-4 14c-8-2-16-8-22-16z" fill="url(#li-r)" ${OUT}/>
<path d="M158 116h16c2 0 3 2 3 4v10c0 2-1 4-3 4h-16z" fill="url(#li-b)" ${OUT}/>
<path d="M161 122h13M161 128h13" stroke="#8a7a5a" stroke-width="2"/>
<!-- skull and crown -->
<path d="M62 70c-2-30 16-52 38-52s40 22 38 52c-1 14-8 24-16 28l-2 22H80l-2-22c-8-4-15-14-16-28z" fill="url(#li-b)" ${OUT}/>
<path d="M72 60l14-4 10 10-4 18-16 2-6-12zM128 60l-14-4-10 10 4 18 16 2 6-12z" fill="#0c0818"/>
<circle cx="84" cy="72" r="9" fill="url(#li-g)"/><circle cx="116" cy="72" r="9" fill="url(#li-g)"/>
<rect x="82" y="70" width="4" height="4" fill="#ff3d9a"/><rect x="114" y="70" width="4" height="4" fill="#ff3d9a"/>
<path d="M100 82l-8 14h16z" fill="#0c0818"/>
<path d="M70 86l10 8M130 86l-10 8" stroke="#8a7a5a" stroke-width="3"/>
<path d="M78 104h44v14H78z" fill="#0c0818"/>
<path d="M80 104l4 12 4-12 4 14 4-14 4 16 4-16 4 14 4-14 4 12 4-12" fill="url(#li-b)" stroke="#1b1830" stroke-width="1.5"/>
<path d="M104 22l-6 14 8 8-6 12M76 40l8 6" stroke="#1b1830" stroke-width="3" fill="none"/>
<path d="M56 34l4-34 12 18 8-24 10 22 10-26 10 26 10-22 8 24 12-18 4 34c-12-6-28-10-44-10s-32 4-44 10z" fill="url(#li-c)" ${OUT}/>
<rect x="96" y="14" width="8" height="8" fill="#ff3d9a" ${OUT}/>`;

const warrior = `
<defs>${lg('wa-h', '#9ac0f8', '#1c5fd0', 1, 1)}${lg('wa-s', '#ffb4d4', '#ff86bc')}${lg('wa-a', '#ff8ac8', '#d03a8a')}${lg('wa-y', '#ffc890', '#ffbc80')}</defs>
<path d="M14 200c0-46 36-70 86-70s86 24 86 70z" fill="url(#wa-a)" ${OUT}/>
<path d="M14 176c0-28 18-46 44-48l14 46zM186 176c0-28-18-46-44-48l-14 46z" fill="url(#wa-h)" ${OUT}/>
<path d="M22 142l-10-20 22 8zM178 142l10-20-22 8zM40 130l-4-22 16 14zM160 130l4-22-16 14z" fill="#fbf4df" ${OUT}/>
<path d="M72 120h56v26H72z" fill="url(#wa-s)" ${OUT}/>
<path d="M50 86c0-40 22-66 50-66s50 26 50 66v22c0 24-22 40-50 40S50 132 50 108z" fill="url(#wa-s)" ${OUT}/>
<path d="M72 34c7-7 15-10 22-10" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
<path d="M46 60h108v18H46z" fill="url(#wa-h)" ${OUT}/>
<path d="M58 62v14M142 62v14M100 62v14" stroke="#fbf4df" stroke-width="3"/>
<path d="M46 76h18v40c-10-4-18-16-18-28zM154 76h-18v40c10-4 18-16 18-28z" fill="url(#wa-h)" ${OUT}/>
<path d="M95 76h10v26H95z" fill="url(#wa-h)" ${OUT}/>
<path d="M68 84l24 8M132 84l-24 8" stroke="#1b1830" stroke-width="6" stroke-linecap="square"/>
<rect x="74" y="92" width="14" height="8" fill="#f6f0e4" ${OUT}/><rect x="112" y="92" width="14" height="8" fill="#f6f0e4" ${OUT}/>
<rect x="78" y="92" width="7" height="8" fill="#2a8a4a"/><rect x="116" y="92" width="7" height="8" fill="#2a8a4a"/>
<rect x="80" y="94" width="3" height="4" fill="#0c3a1a"/><rect x="118" y="94" width="3" height="4" fill="#0c3a1a"/>
<path d="M120 80l8 28" stroke="#d03a8a" stroke-width="4"/>
<path d="M52 102h96v8c-4 24-22 38-48 38s-44-14-48-38z" fill="url(#wa-y)" ${OUT}/>
<path d="M78 112c8-5 15-5 22-1 7-4 14-4 22 1-4 6-14 7-22 3-8 4-18 3-22-3z" fill="#e8b820" ${OUT}/>
<path d="M88 124h24" stroke="#1b1830" stroke-width="5"/>
<path d="M60 116h4M70 128h4M130 128h4M136 116h4M84 136h4M112 136h4M98 142h4" stroke="#b08a10" stroke-width="3"/>
<g fill="#ffd900" ${OUT}><circle cx="56" cy="152" r="5"/><circle cx="144" cy="152" r="5"/></g>`;

const mage = `
<defs>${lg('ma-h', '#6a9af8', '#1c4fb0')}${lg('ma-f', '#ffb4d4', '#ff86bc')}${lg('ma-b', '#fbf4df', '#d8d0c0')}</defs>
<path d="M18 200c0-44 34-66 82-66s82 22 82 66z" fill="url(#ma-h)" ${OUT}/>
<path d="M100 150l-12 50h24z" fill="#ffd900" opacity=".85"/>
<path d="M100 2c-8 22-24 40-44 56-4 18-2 34 4 46h80c6-12 8-28 4-46C124 42 108 24 100 2z" fill="url(#ma-h)" ${OUT}/>
<path d="M66 70c0-14 14-22 34-22s34 8 34 22v30H66z" fill="url(#ma-f)" ${OUT}/>
<path d="M62 92l6 36c4 14 16 24 32 24s28-10 32-24l6-36-10 4-8 10H80l-8-10z" fill="url(#ma-b)" ${OUT}/>
<path d="M76 104c8-6 16-6 24-2 8-4 16-4 24 2-6 6-16 6-24 2-8 4-18 4-24-2z" fill="url(#ma-b)" ${OUT}/>
<path d="M84 124v14M100 126v18M116 124v14" stroke="#a89880" stroke-width="3"/>
<path d="M60 62c10-10 24-14 40-14s30 4 40 14l-4 12c-10-6-22-8-36-8s-26 2-36 8z" fill="url(#ma-h)" ${OUT}/>
<path d="M74 76l16 2M126 76l-16 2" stroke="#1b1830" stroke-width="4"/>
<circle cx="85" cy="88" r="10" fill="#f6f0e4" stroke="#1b1830" stroke-width="4"/>
<circle cx="115" cy="88" r="10" fill="#f6f0e4" stroke="#1b1830" stroke-width="4"/>
<path d="M95 88h10M75 86l-9-3M125 86l9-3" stroke="#1b1830" stroke-width="3"/>
<rect x="81" y="84" width="8" height="8" fill="#c85a20"/><rect x="111" y="84" width="8" height="8" fill="#c85a20"/>
<rect x="83" y="86" width="4" height="4" fill="#3a1a08"/><rect x="113" y="86" width="4" height="4" fill="#3a1a08"/>
<path d="M78 82l4-2" stroke="#fff" stroke-width="2"/>
<g fill="#ffe08a"><path d="M78 30l3 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1z"/><path d="M120 44l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z"/></g>`;

const necromancer = `
<defs>${lg('ne-h', '#3aa05a', '#1a5a30')}${lg('ne-f', '#eee6f4', '#b8a8d0')}${lg('ne-s', '#fbf4df', '#f6e27a')}${lg('ne-e', '#ffb0d0', '#e07aa8')}</defs>
<path d="M18 200c0-44 34-66 82-66s82 22 82 66z" fill="url(#ne-h)" ${OUT}/>
<path d="M100 136l-18 64h36z" fill="#1b1830"/>
<path d="M60 134l40 20 40-20" stroke="#ff3d9a" stroke-width="5" fill="none"/>
<path d="M100 8c-30 6-50 34-50 66 0 20 6 42 12 56h76c6-14 12-36 12-56 0-32-20-60-50-66z" fill="url(#ne-h)" ${OUT}/>
<path d="M60 70c-22-10-40-6-44 6-2 12 14 22 42 22zM140 70c22-10 40-6 44 6 2 12-14 22-42 22z" fill="url(#ne-f)" ${OUT}/>
<path d="M58 76c-14-4-26-2-30 4 2 6 14 10 30 10zM142 76c14-4 26-2 30 4-2 6-14 10-30 10z" fill="url(#ne-e)"/>
<path d="M72 76c0-18 12-30 28-30s28 12 28 30v18c0 16-12 28-28 28s-28-12-28-28z" fill="#1b1830"/>
<path d="M78 80c0-14 10-22 22-22s22 8 22 22v12c0 12-10 20-22 20s-22-8-22-20z" fill="url(#ne-f)" ${OUT}/>
<path d="M82 76l12 3M118 76l-12 3" stroke="#1b1830" stroke-width="4"/>
<rect x="84" y="82" width="12" height="9" fill="#f6f0e4" ${OUT}/><rect x="104" y="82" width="12" height="9" fill="#f6f0e4" ${OUT}/>
<rect x="87" y="82" width="7" height="9" fill="#c85a20"/><rect x="107" y="82" width="7" height="9" fill="#c85a20"/>
<rect x="89" y="84" width="3" height="5" fill="#3a1a08"/><rect x="109" y="84" width="3" height="5" fill="#3a1a08"/>
<path d="M98 94l2 6 2-6" stroke="#1b1830" stroke-width="2.5" fill="none"/>
<path d="M90 104c6 3 14 3 20 0" stroke="#1b1830" stroke-width="3" fill="none"/>
<path d="M150 200l8-150" stroke="#1b1830" stroke-width="8"/>
<path d="M146 44c0-12 20-12 20 0 0 8-4 12-10 14-6-2-10-6-10-14z" fill="url(#ne-s)" ${OUT}/>
<circle cx="152" cy="46" r="2.5" fill="#1b1830"/><circle cx="160" cy="46" r="2.5" fill="#1b1830"/>`;

export const CREATURES: Record<string, string> = { rat, skeleton, slime, cultist, goblin, boneKnight, lich, warrior, mage, necromancer };

/** Riso-pixel sprite of a creature (see riso.ts). */
export function creature(id: string, cls = ''): string {
  return sprite(id, cls);
}
