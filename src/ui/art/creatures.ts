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

/** The Snitch: an upright rat in a hi-vis vest, notepad in one paw, pencil in the other, taking names. */
const snitch = `
<defs>${rg('sn-b', '#b89cf0', '#5a3fb0')}${lg('sn-e', '#ff8ac8', '#ff3d9a')}${glow('sn-g', '#ff3b3b')}</defs>
${shadow}
<path class="limb" d="M136 172c36 6 54-14 46-36-3-10-13-10-12-2 5 14-8 26-32 24" fill="none" stroke="#ff3d9a" stroke-width="7" stroke-linecap="round"/>
<path d="M56 182c-6-44 12-80 44-82 32 2 50 38 44 82z" fill="url(#sn-b)" ${OUT}/>
<!-- hi-vis vest with a reflective band -->
<path d="M62 122c8-12 18-16 28-16l4 76H60c-4-22-4-44 2-60zM138 122c-8-12-18-16-28-16l-4 76h34c4-22 4-44-2-60z" fill="#ffd900" ${OUT}/>
<path d="M60 150h34M106 150h34" stroke="#ff3d9a" stroke-width="8"/>
<path d="M64 190l-2-10h20l2 10zM116 190l2-10h20l-2 10z" fill="#ff8ac8" ${OUT}/>
<!-- notepad (left) and pencil (right) -->
<g transform="rotate(-10 44 140)"><rect x="24" y="116" width="40" height="48" rx="3" fill="#f6f0e4" ${OUT}/><path d="M30 132h28M30 142h28M30 152h18" stroke="#1c5fd0" stroke-width="4"/><path d="M26 118h36" stroke="#1b1830" stroke-width="6"/></g>
<circle cx="64" cy="146" r="8" fill="#ff8ac8" ${OUT}/>
<path d="M138 124c14 0 22 8 24 18l-10 4c-2-6-8-10-14-10z" fill="url(#sn-b)" ${OUT}/>
<g class="limb"><path d="M150 152l24-44 9 5-24 44z" fill="#ffd900" ${OUT}/><path d="M150 152l9 5-10 7z" fill="#1b1830"/><path d="M174 108l9 5 3-6-8-5z" fill="#ff8ac8" ${OUT}/></g>
<circle cx="158" cy="146" r="8" fill="#ff8ac8" ${OUT}/>
<!-- head: big ears, sly brows, beady red eyes -->
<circle cx="50" cy="40" r="24" fill="url(#sn-b)" ${OUT}/><circle cx="50" cy="40" r="14" fill="url(#sn-e)"/>
<circle cx="150" cy="40" r="24" fill="url(#sn-b)" ${OUT}/><circle cx="150" cy="40" r="14" fill="url(#sn-e)"/>
<path d="M60 70c0-24 16-40 40-40s40 16 40 40c0 18-18 38-40 46-22-8-40-28-40-46z" fill="#c8b4f4" ${OUT}/>
<path d="M92 112h7v9h-7zM101 112h7v9h-7z" fill="#f6ecd2" ${OUT}/>
<ellipse cx="100" cy="104" rx="10" ry="7" fill="#ff3d9a" ${OUT}/>
<path d="M76 100l-30-6M76 106l-28 4M124 100l30-6M124 106l28 4" stroke="#f6f0e4" stroke-width="2" opacity=".7"/>
${eyes(84, 116, 74, 6, '#ff4a3a', 'sn-g')}
<path d="M68 60l24 10M132 60l-24 10" stroke="#120e18" stroke-width="6" stroke-linecap="round"/>`;

/** Senior Boomer: forty years on the line and still clocking in. A skeleton with a comb-over, huge glasses, a mustache, a mug and a box cutter. */
const boomer = `
<defs>${lg('bo-b', '#f8f2e2', '#e6dcbc')}${lg('bo-s', '#b8d0f8', '#5a8ae8')}</defs>
${shadow}
<!-- high-waisted trousers and shoes -->
<path d="M64 160h72l-4 24h-24l-8-14-8 14H68z" fill="#6a4a2a" ${OUT}/>
<path d="M62 190l4-8h28l2 8zM104 190l2-8h28l4 8z" fill="#1b1830" ${OUT}/>
<!-- short-sleeved shirt over a paunch -->
<path d="M56 96c12-6 28-8 44-8s32 2 44 8c10 20 16 44 10 68-12 6-32 8-54 8s-42-2-54-8c-6-24 0-48 10-68z" fill="url(#bo-s)" ${OUT}/>
<path d="M58 160c24 6 60 6 84 0v8c-24 6-60 6-84 0z" fill="#1b1830"/><rect x="93" y="159" width="14" height="10" fill="#ffd900" ${OUT}/>
<path d="M112 120h20v16h-20z" fill="#9ab8f0" ${OUT}/><path d="M116 108h5v16h-5z" fill="#ff3d9a" ${OUT}/><path d="M124 111h5v13h-5z" fill="#ffd900" ${OUT}/>
<path d="M84 90l16 14 16-14 6 10-22 10-22-10z" fill="#f6f0e4" ${OUT}/>
<path d="M95 104h10l4 8-5 40-4 6-4-6-5-40z" fill="#ff3d9a" ${OUT}/>
<path d="M56 96c-14 4-20 14-22 28l20 6 8-16zM144 96c14 4 20 14 22 28l-20 6-8-16z" fill="url(#bo-s)" ${OUT}/>
<!-- left arm: a bony hand around a mug -->
<path d="M44 128 L40 150 L56 156" stroke="#120e18" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 128 L40 150 L56 156" stroke="#efe6cc" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M50 140h28v28c0 4-3 6-6 6H56c-3 0-6-2-6-6z" fill="#f6f0e4" ${OUT}/><path d="M78 148c10 0 10 14 0 14" stroke="#1b1830" stroke-width="4" fill="none"/><path d="M50 152h28" stroke="#ff3d9a" stroke-width="6"/>
<!-- right arm raising a box cutter -->
<g class="limb"><path d="M156 128 L170 110 L164 88" stroke="#120e18" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M156 128 L170 110 L164 88" stroke="#efe6cc" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M156 92l12-34 11 4-12 34z" fill="#ffd900" ${OUT}/><path d="M170 60l7-20 7 3-5 20z" fill="#dfe6ee" ${OUT}/>
<path d="M156 90c4-4 12-2 14 2l-2 8c-4 2-10 0-12-4z" fill="#efe6cc" ${OUT}/></g>
<!-- skull: comb-over, huge glasses with pinpoint eyes, mustache -->
<path d="M94 78h12v14H94z" fill="#efe6cc" ${OUT}/>
<path d="M66 44c0-22 14-34 34-34s34 12 34 34c0 12-4 20-10 24l-2 12H78l-2-12c-6-4-10-12-10-24z" fill="url(#bo-b)" ${OUT}/>
<path d="M68 30c16-14 46-18 64-4-20-6-42-2-60 10z" fill="#aaa4b8" ${OUT}/>
<path d="M62 42c-6 2-8 12-4 18l8-4zM138 42c6 2 8 12 4 18l-8-4z" fill="#aaa4b8" ${OUT}/>
<path d="M70 38h26v22H70zM104 38h26v22h-26z" fill="#1b1830"/><path d="M96 44h8" stroke="#1b1830" stroke-width="5"/>
<path d="M74 42h18v14H74zM108 42h18v14h-18z" fill="#3a3470"/>
<g class="eye"><rect x="81" y="47" width="4" height="4" fill="#ffd900"/><rect x="115" y="47" width="4" height="4" fill="#ffd900"/></g>
<path d="M100 60l-4 6h8z" fill="#1a1422"/>
<path d="M78 72c6-8 16-8 22-3 6-5 16-5 22 3-6 6-15 6-22 2-7 4-16 4-22-2z" fill="#aaa4b8" ${OUT}/>
<path d="M84 76h32v6H84z" fill="#efe6cc" ${OUT}/><path d="M90 76v6M96 76v6M102 76v6M108 76v6" stroke="#1a1422" stroke-width="1.5"/>
<path d="M118 14l-4 8 6 6-4 8" stroke="#1a1422" stroke-width="2.5" fill="none"/>`;

/** Toxic Coworker (enemy id `slime`): a bloated toad on the phone, gossiping, badge on a lanyard, a colleague half-swallowed on its back. */
const coworker = `
<defs>${lg('tc-b', '#5a9a3a', '#16402a')}${lg('tc-bn', '#fbf4df', '#e8d8a8')}</defs>
${shadow}
<path d="M150 70l20-26 6 2 2-8 8 4-4 6 4 4-8 4-2-4-18 24z" fill="url(#tc-bn)" ${OUT}/>
<path d="M12 186c-4-28 8-46 30-48 10 14 12 32 8 48zM188 186c4-28-8-46-30-48-10 14-12 32-8 48z" fill="url(#tc-b)" ${OUT}/>
<path d="M22 168c-6-44 22-84 78-86 56 2 84 42 78 86-4 16-30 20-78 20s-74-4-78-20z" fill="url(#tc-b)" ${OUT}/>
<path d="M56 174c10-12 78-12 88 0-10 10-78 10-88 0z" fill="#e8d070"/>
<path d="M120 92c0-12 10-20 22-20s22 8 22 20c0 8-4 12-8 14v6h-28v-6c-4-2-8-6-8-14z" fill="url(#tc-bn)" ${OUT}/>
<path d="M128 90l8-2 2 8-8 2zM148 88l8 2-2 8-8-2z" fill="#1a1422"/><path d="M140 100l2 4h-4z" fill="#1a1422"/>
<g fill="#ff8ac8" ${OUT}><circle cx="166" cy="128" r="7"/><circle cx="60" cy="104" r="5"/><circle cx="176" cy="154" r="5"/></g>
<g fill="#16402a"><circle cx="84" cy="98" r="3"/><circle cx="150" cy="146" r="3"/><circle cx="106" cy="92" r="2.5"/></g>
<circle cx="62" cy="92" r="23" fill="url(#tc-b)" ${OUT}/><circle cx="102" cy="78" r="13" fill="url(#tc-b)" ${OUT}/>
<g class="eye">
<circle cx="62" cy="93" r="15" fill="#ffd900" ${OUT}/><rect x="48" y="93" width="28" height="5" fill="#1a1422"/>
<ellipse cx="102" cy="78" rx="8" ry="7" fill="#ff3d9a" ${OUT}/><rect x="100" y="72" width="4" height="12" fill="#1a1422"/>
</g>
<path d="M44 84c8-10 28-12 38-2l-4 3c-10-4-24-3-32 4z" fill="#16402a" ${OUT}/>
<path d="M30 124c32 24 108 24 140 0-6 22-36 36-70 36s-64-14-70-36z" fill="#1a1422" ${OUT}/>
<path d="M44 132l5 9 5-7zM60 138l4 10 5-8zM78 142l3 8 5-7zM116 142l5 7 3-8zM132 139l5 8 4-10zM150 133l5 7 5-9z" fill="#fbf4df"/>
<path d="M104 150c0 16 4 26 10 30 7-2 9-12 7-30z" fill="#ff3d9a" ${OUT}/>
<path d="M114 178c0 4 1 7 3 8 2-1 3-4 2-8z" fill="#c8e86a" ${OUT}/>
<!-- lanyard and ID badge -->
<path d="M62 156l12 12 12-12" stroke="#1c5fd0" stroke-width="4" fill="none"/>
<rect x="62" y="166" width="24" height="20" rx="2" fill="#f6f0e4" ${OUT}/><rect x="66" y="170" width="8" height="8" fill="#ff3d9a"/><path d="M76 172h6M76 178h6" stroke="#1b1830" stroke-width="2"/>
<!-- webbed hand holding a phone to its head -->
<path d="M30 160c-10-10-14-26-8-40l12 2c-4 10-2 22 6 30z" fill="url(#tc-b)" ${OUT}/>
<g class="limb"><rect x="14" y="84" width="20" height="36" rx="4" fill="#1b1830" ${OUT}/><rect x="18" y="90" width="12" height="22" fill="#1c5fd0"/><rect x="20" y="92" width="4" height="4" fill="#fff" opacity=".7"/></g>
<path d="M22 118c-6 0-10 6-8 12l12 2c4-4 4-10 0-14z" fill="url(#tc-b)" ${OUT}/>
<path d="M138 188c2-10 6-16 14-16s14 6 14 16z" fill="url(#tc-b)" ${OUT}/><path d="M144 186v-6M152 186v-8M160 186v-6" stroke="#1a1422" stroke-width="2"/>`;

/** Team Leader: a hooded cult leader with a headset, a manic grin, a thumbs-up and a flip chart where the line only goes up. */
const teamLeader = `
<defs>${lg('sc-r', '#b070d8', '#4a2090')}${lg('sc-h', '#c080e0', '#5a2aa0')}${glow('sc-g', '#ff4af0')}</defs>
${shadow}
<!-- flip chart on an easel -->
<path d="M24 140l-10 48M58 140l10 48M41 140v44" stroke="#6a4a2a" stroke-width="6"/>
<rect x="10" y="92" width="62" height="52" fill="#f6f0e4" ${OUT}/><path d="M10 92h62" stroke="#1b1830" stroke-width="6"/>
<path d="M20 136v-10M32 136v-16M44 136v-24M56 136v-32" stroke="#1c5fd0" stroke-width="7"/>
<path d="M16 124l14-10 10 6 22-18" stroke="#ff3d9a" stroke-width="5" fill="none"/><path d="M54 98h12v12z" fill="#ff3d9a"/>
<path d="M40 186c4-50 20-90 60-96 40 6 56 46 60 96z" fill="url(#sc-r)" ${OUT}/>
<path d="M100 96v90" stroke="#b58ae0" stroke-width="3" opacity=".6"/>
<!-- name sticker -->
<rect x="110" y="120" width="30" height="20" fill="#f6f0e4" ${OUT}/><rect x="110" y="120" width="30" height="7" fill="#ff3d9a"/><path d="M116 133h18" stroke="#1b1830" stroke-width="2.5"/>
<!-- left sleeve holding a pointer to the chart -->
<path d="M52 150c-6-10-4-22 6-30l10 8c-6 6-6 12-4 18z" fill="url(#sc-r)" ${OUT}/><path d="M58 124l-16-16" stroke="#1b1830" stroke-width="4"/>
<!-- right sleeve raised in a thumbs-up -->
<path d="M150 146c12-10 18-26 14-44l-14-2c2 14-2 26-12 34z" fill="url(#sc-r)" ${OUT}/>
<g class="limb"><rect x="146" y="82" width="22" height="22" rx="5" fill="#ffc890" ${OUT}/><rect x="150" y="64" width="9" height="20" rx="4" fill="#ffc890" ${OUT}/></g>
<!-- hood, shadowed face, grin, headset -->
<path d="M58 30c10-16 74-16 84 0 10 20 6 60-6 76H64c-12-16-16-56-6-76z" fill="url(#sc-h)" ${OUT}/>
<path d="M72 50c8-10 48-10 56 0 6 12 4 36-4 48H76c-8-12-10-36-4-48z" fill="#0c0612"/>
${eyes(86, 114, 66, 4.5, '#ff6af5', 'sc-g')}
<path d="M78 78c8 14 36 14 44 0z" fill="#f6f0e4" ${OUT}/><path d="M86 79v8M94 79v10M102 79v10M110 79v9M117 79v6" stroke="#1b1830" stroke-width="2"/>
<path d="M58 40c10-18 74-18 84 0" stroke="#1b1830" stroke-width="5" fill="none"/>
<rect x="52" y="40" width="12" height="22" rx="4" fill="#1c5fd0" ${OUT}/><rect x="136" y="40" width="12" height="22" rx="4" fill="#1c5fd0" ${OUT}/>
<path d="M60 62c2 16 8 24 18 26" stroke="#1b1830" stroke-width="4" fill="none"/><circle cx="80" cy="88" r="5" fill="#ff3d9a" ${OUT}/>`;

/** Goblin Consultant: slicked hair, glasses, a cheap suit and tie, a briefcase full of invoices and a knife for your back. */
const consultant = `
<defs>${rg('gc-b', '#a8c860', '#5a8a30')}${lg('gc-s', '#5a6ac0', '#1c2a70')}${lg('gc-c', '#b07a3a', '#6a3a1a')}${glow('gc-g', '#ffe14a')}</defs>
${shadow}
<!-- briefcase -->
<path d="M140 134v-10h24v10" stroke="#1b1830" stroke-width="6" fill="none"/>
<rect x="124" y="134" width="56" height="44" rx="4" fill="url(#gc-c)" ${OUT}/><path d="M124 152h56" stroke="#3a2010" stroke-width="3"/><rect x="146" y="146" width="12" height="10" fill="#ffd900" ${OUT}/>
<!-- suit, shirt, tie -->
<path d="M62 186l6-60c2-14 14-22 32-22s28 10 30 22l6 60z" fill="url(#gc-s)" ${OUT}/>
<path d="M84 106l16 34 16-34z" fill="#f6f0e4" ${OUT}/>
<path d="M96 110h8l2 6-3 30-3 4-3-4-3-30z" fill="#ff3d9a" ${OUT}/>
<path d="M84 106l-8 24 22 12zM116 106l8 24-22 12z" fill="#2a3a90" ${OUT}/>
<path d="M130 126c10 2 16 8 18 16l-10 4c-2-4-6-8-10-8z" fill="url(#gc-s)" ${OUT}/><circle cx="146" cy="132" r="7" fill="url(#gc-b)" ${OUT}/>
<!-- head: big ears, slicked hair, glasses, crooked grin -->
<path d="M30 60l40 22-6 14c-18-4-30-18-34-36zM170 60l-40 22 6 14c18-4 30-18 34-36z" fill="url(#gc-b)" ${OUT}/>
<path d="M58 70c0-26 18-42 42-42s42 16 42 42c0 22-16 42-42 42S58 92 58 70z" fill="url(#gc-b)" ${OUT}/>
<path d="M60 58c4-22 20-32 40-32s36 10 40 28c-14-8-30-10-46-4-12-2-24 0-34 8z" fill="#1b1830"/><path d="M84 36c8-4 20-4 30 0" stroke="#5a6ac0" stroke-width="3"/>
<path d="M74 62h22v16H74zM104 62h22v16h-22z" fill="#f6f0e4" stroke="#1b1830" stroke-width="3.5"/><path d="M96 68h8" stroke="#1b1830" stroke-width="3"/>
<g class="eye"><rect x="82" y="67" width="7" height="7" fill="#1a2a12"/><rect x="111" y="67" width="7" height="7" fill="#1a2a12"/></g>
<path d="M80 94c10 8 30 8 40 0" stroke="#1a2a12" stroke-width="4" fill="#3a1414" stroke-linecap="round"/>
<path d="M86 95l4 6 3-5M108 96l3 5 4-6" fill="#f6ecd2"/>
<path d="M96 78l4 10 4-10z" fill="#4f9a3a" ${OUT}/>
<!-- left arm and a knife -->
<g class="limb"><path d="M62 128c-14 4-22 14-20 26l12 2c0-8 4-14 12-16z" fill="url(#gc-s)" ${OUT}/><circle cx="46" cy="154" r="7" fill="url(#gc-b)" ${OUT}/><path d="M42 150l-14-30 7-3 14 30z" fill="#dfe6ee" ${OUT}/></g>`;

/** Security Automaton: a brass-and-steel guard on pistons, one red eye in a visor, cap, badge, riot shield and baton. */
const automaton = `
<defs>${lg('sa-m', '#9ab8f0', '#1c4fb0')}${lg('sa-br', '#ffe45a', '#d09a20')}${glow('sa-g', '#ff3d9a')}</defs>
${shadow}
<!-- piston legs -->
<path d="M72 150h18v32H72zM110 150h18v32h-18z" fill="#3a3450" ${OUT}/><path d="M76 158h10M114 158h10M76 168h10M114 168h10" stroke="#9ab8f0" stroke-width="3"/>
<path d="M60 190l4-10h32l2 10zM102 190l2-10h32l4 10z" fill="url(#sa-m)" ${OUT}/>
<!-- boxy torso with a pressure gauge -->
<path d="M48 86h104l-8 70H56z" fill="url(#sa-m)" ${OUT}/>
<circle cx="112" cy="114" r="16" fill="#f6f0e4" stroke="url(#sa-br)" stroke-width="5"/><path d="M112 114l9-9" stroke="#ff3d9a" stroke-width="4"/><path d="M100 114h4M112 102v4M124 114h-4" stroke="#1b1830" stroke-width="2"/>
<path d="M74 98l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#ffd900" ${OUT}/>
<rect x="54" y="140" width="92" height="10" fill="#1b1830"/><rect x="92" y="138" width="16" height="14" fill="url(#sa-br)" ${OUT}/>
<g fill="#1b1830"><circle cx="56" cy="92" r="2.5"/><circle cx="144" cy="92" r="2.5"/><circle cx="60" cy="132" r="2.5"/><circle cx="140" cy="132" r="2.5"/></g>
<!-- brass pauldrons -->
<path d="M34 100c0-14 10-22 24-22l4 26c-10 4-28 6-28-4zM166 100c0-14-10-22-24-22l-4 26c10 4 28 6 28-4z" fill="url(#sa-br)" ${OUT}/>
<!-- riot shield -->
<path d="M8 104h48v56c0 12-12 22-24 26-12-4-24-14-24-26z" fill="#f6f0e4" ${OUT}/><path d="M8 124h48" stroke="#1c5fd0" stroke-width="8"/><path d="M14 132h36v6H14z" fill="#1b1830" opacity=".35"/>
<!-- baton raised -->
<g class="limb"><path d="M152 102l18-26" stroke="#1b1830" stroke-width="14" stroke-linecap="round"/><path d="M152 102l18-26" stroke="#9ab8f0" stroke-width="8" stroke-linecap="round"/>
<path d="M158 70l10-6 26 60-10 5z" fill="#1b1830" ${OUT}/><path d="M160 90l-12 6" stroke="#1b1830" stroke-width="6"/><circle cx="168" cy="74" r="9" fill="url(#sa-br)" ${OUT}/></g>
<!-- head: visor, grille, cap -->
<path d="M94 76h12v12H94z" fill="#3a3450" ${OUT}/>
<path d="M70 30h60v48H70z" fill="url(#sa-m)" ${OUT}/>
<rect x="74" y="44" width="52" height="14" fill="#1b1830"/>
<g class="eye"><circle cx="100" cy="51" r="10" fill="url(#sa-g)"/><rect x="95" y="47" width="10" height="8" fill="#ff3d9a"/></g>
<path d="M84 64h32M84 70h32" stroke="#1b1830" stroke-width="3"/>
<path d="M64 32c0-14 16-22 36-22s36 8 36 22z" fill="#1c3a90" ${OUT}/><path d="M58 30h84v8H58z" fill="#1b1830" ${OUT}/>
<path d="M100 14l6 7-6 7-6-7z" fill="#ffd900" ${OUT}/>
<!-- steam vent -->
<path d="M140 80v-12h8v12" fill="#3a3450" ${OUT}/><g fill="#f6f0e4" opacity=".85"><circle cx="146" cy="58" r="5"/><circle cx="152" cy="48" r="4"/></g>`;

/** Slaves CEO: the boss. A skull on a riveted steel jaw, top hat, monocle and cigar, pinstripes, a gold chain and a giant stopwatch. */
const ceo = `
<defs>${lg('ce-s', '#5a4ab8', '#241a4a')}${lg('ce-g', '#ffe45a', '#d09a20')}${lg('ce-f', '#f4ecd6', '#c9bd98')}${lg('ce-j', '#9ab8f0', '#1c4fb0')}${glow('ce-e', '#ff3d9a')}</defs>
${shadow}
<!-- cane with a gold knob -->
<path d="M166 192l6-100" stroke="#1b1830" stroke-width="8"/><circle cx="172" cy="92" r="10" fill="url(#ce-g)" ${OUT}/>
<!-- pinstriped suit -->
<path d="M20 194c0-52 22-88 80-92 58 4 80 40 80 92z" fill="url(#ce-s)" ${OUT}/>
<path d="M46 136v56M66 118v74M134 118v74M154 136v56" stroke="#7a6ac0" stroke-width="2"/>
<path d="M78 104l22 42 22-42z" fill="#f6f0e4" ${OUT}/>
<path d="M95 108h10l3 6-4 34-4 4-4-4-4-34z" fill="#ff5a3a" ${OUT}/>
<path d="M78 104l-10 30 32 14zM122 104l10 30-32 14z" fill="#2a1a60" ${OUT}/>
<path d="M58 164c16 12 34 12 44 6" stroke="url(#ce-g)" stroke-width="5" fill="none"/><circle cx="104" cy="168" r="6" fill="url(#ce-g)" ${OUT}/>
<!-- right sleeve on the cane -->
<path d="M150 112c12 4 20 14 22 28l-12 4c-4-10-10-16-18-18z" fill="url(#ce-s)" ${OUT}/><rect x="160" y="128" width="20" height="16" rx="4" fill="url(#ce-j)" ${OUT}/>
<!-- left sleeve holding up a giant stopwatch -->
<path d="M44 158c-14-10-18-32-8-50l14 4c-6 12-6 26 2 36z" fill="url(#ce-s)" ${OUT}/>
<g class="limb"><rect x="34" y="50" width="12" height="12" fill="url(#ce-g)" ${OUT}/>
<circle cx="40" cy="84" r="25" fill="#f6f0e4" stroke="url(#ce-g)" stroke-width="7"/><path d="M40 84V66M40 84l12 8" stroke="#1b1830" stroke-width="5" stroke-linecap="round"/><path d="M40 62v4M62 84h-4M40 106v-4M18 84h4" stroke="#1b1830" stroke-width="3"/>
<rect x="30" y="104" width="20" height="14" rx="4" fill="url(#ce-j)" ${OUT}/></g>
<!-- skull on a steel jaw, monocle, cigar -->
<path d="M66 60c-2-26 14-40 34-40s36 14 34 40c-1 12-6 20-14 24H80c-8-4-13-12-14-24z" fill="url(#ce-f)" ${OUT}/>
<path d="M72 54l14-2 8 8-4 14H76l-6-10z" fill="#0c0818"/>
<circle cx="82" cy="64" r="9" fill="url(#ce-e)"/><rect x="80" y="62" width="4" height="4" fill="#ff3d9a"/>
<circle cx="116" cy="62" r="13" fill="#0c0818" stroke="url(#ce-g)" stroke-width="5"/><g class="eye"><rect x="113" y="59" width="6" height="6" fill="#ff3d9a"/></g>
<path d="M128 68c8 12 8 26 0 36" stroke="url(#ce-g)" stroke-width="2.5" fill="none"/>
<path d="M100 72l-6 10h12z" fill="#0c0818"/>
<path d="M78 84h44v18H78z" fill="url(#ce-j)" ${OUT}/><path d="M85 84v18M92 84v18M100 84v18M108 84v18M115 84v18" stroke="#1b1830" stroke-width="2"/>
<g fill="#1b1830"><circle cx="81" cy="99" r="2"/><circle cx="119" cy="99" r="2"/></g>
<path d="M112 92l34 6-2 9-34-6z" fill="#8a5a2a" ${OUT}/><path d="M144 98l7 1-2 9-7-1z" fill="#ff3d9a"/>
<g fill="#f6f0e4" opacity=".85"><circle cx="160" cy="92" r="5"/><circle cx="168" cy="80" r="6"/><circle cx="162" cy="66" r="4"/></g>
<!-- top hat -->
<path d="M74 34V2h52v32z" fill="#4a2a90" ${OUT}/><rect x="74" y="22" width="52" height="8" fill="#ff3d9a"/>
<path d="M56 32h88c0 6-4 10-10 10H66c-6 0-10-4-10-10z" fill="#4a2a90" ${OUT}/>`;

/** HR Bitch: a harpy in a pink blazer, hair in a bun (pencil stuck in it), cat-eye glasses, clipboard in one talon, red pen in the other. */
const hr = `
<defs>${lg('hr-w', '#c080e0', '#4a2090')}${lg('hr-j', '#ff8ac8', '#c02a80')}</defs>
${shadow}
<g class="limb"><path d="M70 96C40 72 12 82 4 112c14-6 22-4 28 2-10 4-16 12-18 22 12-8 24-8 32-2-6 6-8 14-8 22 14-12 28-20 40-20z" fill="url(#hr-w)" ${OUT}/>
<path d="M130 96c30-24 58-14 66 16-14-6-22-4-28 2 10 4 16 12 18 22-12-8-24-8-32-2 6 6 8 14 8 22-14-12-28-20-40-20z" fill="url(#hr-w)" ${OUT}/></g>
<path d="M82 170l-8 18M82 170l0 18M82 170l8 18M118 170l-8 18M118 170l0 18M118 170l8 18" stroke="#1b1830" stroke-width="7" stroke-linecap="round"/>
<path d="M82 170l-8 18M82 170l0 18M82 170l8 18M118 170l-8 18M118 170l0 18M118 170l8 18" stroke="#ffd900" stroke-width="3" stroke-linecap="round"/>
<path d="M70 146h60l4 26H66z" fill="#1b1830" ${OUT}/>
<path d="M60 102c12-8 26-10 40-10s28 2 40 10l-6 50H66z" fill="url(#hr-j)" ${OUT}/>
<path d="M88 96l12 26 12-26z" fill="#f6f0e4" ${OUT}/>
<path d="M88 96l-8 22 18 8zM112 96l8 22-18 8z" fill="#c02a80" ${OUT}/>
<g fill="#f6f0e4" ${OUT}><circle cx="90" cy="102" r="3"/><circle cx="100" cy="106" r="3"/><circle cx="110" cy="102" r="3"/></g>
<!-- clipboard (left) and red pen (right) -->
<rect x="24" y="110" width="38" height="46" fill="#c9a060" ${OUT}/><rect x="29" y="120" width="28" height="32" fill="#f6f0e4"/>
<path d="M33 128h20M33 136h20M33 144h12" stroke="#1b1830" stroke-width="3"/><rect x="36" y="106" width="14" height="8" fill="#1b1830"/>
<path d="M56 128l10-4 4 6-8 6zM56 142l10-2 2 6-10 4z" fill="#ffd900" ${OUT}/>
<path d="M140 110c14 2 22 10 22 22l-10 4c-2-8-6-12-12-14z" fill="url(#hr-j)" ${OUT}/>
<g class="limb"><path d="M150 134l20-38 8 4-20 38z" fill="#ff3d9a" ${OUT}/><path d="M150 134l8 4-8 6z" fill="#1b1830"/></g>
<path d="M148 130l10-2 2 8-10 2z" fill="#ffd900" ${OUT}/>
<!-- head: bun with a pencil, cat-eye glasses, stern mouth -->
<rect x="92" y="78" width="16" height="16" fill="#f4ecd6" ${OUT}/>
<path d="M72 54c0-22 12-36 28-36s28 14 28 36c0 18-12 32-28 32S72 72 72 54z" fill="#f4ecd6" ${OUT}/>
<path d="M108 2l12 22" stroke="#1b1830" stroke-width="7"/><path d="M108 2l12 22" stroke="#ffd900" stroke-width="3"/>
<circle cx="100" cy="14" r="13" fill="#4a2090" ${OUT}/>
<path d="M70 52c-2-22 12-36 30-36s32 14 30 36c-6-12-18-20-30-20s-24 8-30 20z" fill="#4a2090" ${OUT}/>
<path d="M70 46l26 4v12H78zM130 46l-26 4v12h18z" fill="#1b1830"/>
<g class="eye"><rect x="82" y="53" width="7" height="4" fill="#ff3d9a"/><rect x="111" y="53" width="7" height="4" fill="#ff3d9a"/></g>
<path d="M90 74h20" stroke="#ff3d9a" stroke-width="5"/>`;

/** Guy Asleep: an ogre in overalls asleep on his desk, nightcap on, drooling, mug gone cold, Zs rising. */
const sleeper = `
<defs>${rg('gs-b', '#a8c860', '#4a7a30')}${lg('gs-o', '#6a9af8', '#1c4fb0')}</defs>
${shadow}
<path d="M40 150c0-40 24-64 60-64s60 24 60 64z" fill="url(#gs-o)" ${OUT}/>
<path d="M66 96l8 54M134 96l-8 54" stroke="#ffd900" stroke-width="6"/>
<path d="M8 150h184v14H8z" fill="#8a5a2a" ${OUT}/><path d="M18 164h14v24H18zM168 164h14v24h-14z" fill="#6a4a2a" ${OUT}/>
<path d="M148 126h20v24h-20z" fill="#f6f0e4" ${OUT}/><path d="M168 132c8 0 8 12 0 12" stroke="#1b1830" stroke-width="4" fill="none"/><path d="M148 136h20" stroke="#ff3d9a" stroke-width="5"/>
<path d="M26 150c0-16 22-24 54-22l26 6v16zM146 150c0-10-12-18-30-20l-20 4v16z" fill="url(#gs-b)" ${OUT}/>
<!-- head resting on the arms -->
<ellipse cx="96" cy="122" rx="42" ry="30" fill="url(#gs-b)" ${OUT}/>
<path d="M72 118c5 5 12 5 17 0M104 118c5 5 12 5 17 0" stroke="#1b1830" stroke-width="4" fill="none"/>
<ellipse cx="96" cy="126" rx="7" ry="5" fill="#5a8a30" ${OUT}/>
<ellipse cx="96" cy="140" rx="12" ry="6" fill="#1b1830"/>
<path d="M84 140l3 8 3-8zM102 140l3 8 3-8z" fill="#f6f0e4"/>
<path d="M108 142c3 8 3 14 0 18-3-4-4-10 0-18z" fill="#9ab8f0" ${OUT}/>
<!-- nightcap -->
<path d="M56 108c4-26 20-40 42-40s34 12 38 26l32 12-36 6z" fill="#ff3d9a" ${OUT}/><circle cx="170" cy="106" r="9" fill="#f6f0e4" ${OUT}/>
<path d="M56 104c22-8 58-8 80 0v8c-22-6-58-6-80 0z" fill="#f6f0e4" ${OUT}/>
<!-- Zs -->
<g class="eye" fill="#f6f0e4" ${OUT}><path d="M126 42h16v5l-10 11h10v5h-16v-5l10-11h-10z"/><path d="M150 14h22v6l-14 15h14v6h-22v-6l14-15h-14z"/></g>`;

/** New Hire: an eager young gorgon on day one, snakes for hair, a coffee tray for everyone, a huge trainee badge, and a stare that turns your cards to stone. */
const newHire = `
<defs>${lg('nh-s', '#8ad06a', '#2a7a3a')}${lg('nh-sh', '#f8f2e2', '#d8d0c0')}${glow('nh-g', '#ffd900')}</defs>
${shadow}
<path d="M50 188c2-46 20-74 50-74s48 28 50 74z" fill="url(#nh-sh)" ${OUT}/>
<path d="M98 118h8l2 6-8 30-6-4z" fill="#1c5fd0" ${OUT}/>
<path d="M84 116l14 36 16-36" stroke="#ff3d9a" stroke-width="4" fill="none"/>
<rect x="84" y="150" width="30" height="34" fill="#ffd900" ${OUT}/><rect x="89" y="155" width="20" height="12" fill="#1b1830"/><path d="M89 174h20" stroke="#1b1830" stroke-width="3"/>
<!-- coffee tray for the whole office -->
<rect x="116" y="140" width="66" height="9" fill="#6a4a2a" ${OUT}/>
<path d="M121 120h13v20h-13zM139 120h13v20h-13zM157 120h13v20h-13z" fill="#f6f0e4" ${OUT}/><path d="M120 118h15v5h-15zM138 118h15v5h-15zM156 118h15v5h-15z" fill="#ff3d9a"/>
<path d="M144 150c-8 8-22 10-34 4l2-10c8 2 18 0 24-4z" fill="url(#nh-sh)" ${OUT}/><circle cx="150" cy="148" r="7" fill="url(#nh-s)" ${OUT}/>
<!-- left hand waving hello -->
<g class="limb"><path d="M54 146c-12-10-16-28-10-42l12 2c-4 12-2 24 6 32z" fill="url(#nh-sh)" ${OUT}/><circle cx="48" cy="98" r="10" fill="url(#nh-s)" ${OUT}/></g>
<!-- snakes for hair -->
<g fill="none" stroke-linecap="round"><path d="M74 44c-14-6-24 2-24 12M86 30c-6-14-20-16-28-8M100 26c0-16 10-24 22-18M114 30c8-12 22-12 28-2M126 46c14-4 22 6 20 16" stroke="#1b1830" stroke-width="12"/>
<path d="M74 44c-14-6-24 2-24 12M86 30c-6-14-20-16-28-8M100 26c0-16 10-24 22-18M114 30c8-12 22-12 28-2M126 46c14-4 22 6 20 16" stroke="#3aa05a" stroke-width="7"/></g>
<g fill="#3aa05a" ${OUT}><circle cx="50" cy="58" r="6"/><circle cx="58" cy="22" r="6"/><circle cx="122" cy="8" r="6"/><circle cx="142" cy="28" r="6"/><circle cx="146" cy="62" r="6"/></g>
<path d="M44 62l-4 4M54 18l-4-4M128 4l4-4M148 26l4-2M152 64l4 2" stroke="#ff3d9a" stroke-width="2.5"/>
<path d="M68 64c0-24 14-40 32-40s32 16 32 40c0 20-14 36-32 36S68 84 68 64z" fill="url(#nh-s)" ${OUT}/>
${eyes(86, 114, 62, 6, '#ffd900', 'nh-g')}
<path d="M82 80c10 9 26 9 36 0z" fill="#f6f0e4" stroke="#1b1830" stroke-width="3.5"/>`;

// Title screen props (office and factory): the time clock, a filing cabinet, a sack of money, a toxic barrel.
const timeClock = `
<defs>${lg('tk-m', '#9ab8f0', '#1c4fb0')}${lg('tk-g', '#ffe45a', '#d09a20')}</defs>
${shadow}
<rect x="40" y="16" width="120" height="164" rx="6" fill="url(#tk-m)" ${OUT}/>
<circle cx="100" cy="66" r="36" fill="#f6f0e4" stroke="url(#tk-g)" stroke-width="8"/>
<path d="M100 66V44M100 66l18 10" stroke="#1b1830" stroke-width="7" stroke-linecap="round"/>
<g fill="#1b1830"><rect x="97" y="34" width="6" height="6"/><rect x="97" y="92" width="6" height="6"/><rect x="68" y="63" width="6" height="6"/><rect x="126" y="63" width="6" height="6"/></g>
<rect x="80" y="112" width="40" height="36" fill="#f6f0e4" ${OUT}/>
<g fill="#ff3d9a"><rect x="86" y="118" width="6" height="6"/><rect x="100" y="128" width="6" height="6"/><rect x="108" y="118" width="6" height="6"/></g>
<rect x="58" y="146" width="84" height="12" fill="#1b1830"/>
<rect x="160" y="76" width="16" height="44" fill="url(#tk-g)" ${OUT}/>`;

const filingCabinet = `
<defs>${lg('fc-m', '#c8c0d8', '#6d6680')}</defs>
${shadow}
<rect x="44" y="36" width="112" height="150" fill="url(#fc-m)" ${OUT}/>
<rect x="54" y="46" width="92" height="36" fill="#9a94ac" ${OUT}/><rect x="54" y="90" width="92" height="36" fill="#9a94ac" ${OUT}/>
<path d="M58 132l10-12 8 10 10-14 10 12 12-10 10 14 14-8 6 8z" fill="#f6f0e4" ${OUT}/>
<rect x="38" y="138" width="124" height="42" fill="#9a94ac" ${OUT}/>
<g fill="#1b1830"><rect x="88" y="60" width="24" height="8"/><rect x="88" y="104" width="24" height="8"/><rect x="88" y="154" width="24" height="8"/></g>
<rect x="62" y="52" width="18" height="10" fill="#f6f0e4"/>
<path d="M84 36c0-14 7-24 16-24s16 10 16 24c0 5-3 8-6 9v4H90v-4c-3-1-6-4-6-9z" fill="#f6f0e4" ${OUT}/>
<g fill="#1b1830"><rect x="90" y="24" width="7" height="7"/><rect x="104" y="24" width="7" height="7"/></g>`;

const moneyBag = `
${shadow}
<!-- crisp edges: no half-covered rim pixels, so no pale dither on the outline -->
<g shape-rendering="crispEdges">
<g fill="#ffd900" ${OUT}><ellipse cx="36" cy="182" rx="18" ry="7"/><ellipse cx="166" cy="184" rx="16" ry="6"/><ellipse cx="158" cy="174" rx="16" ry="6"/></g>
<path d="M96 44l34-20 10 18-34 20z" fill="#8ad06a" ${OUT}/>
<path d="M56 188c-24 0-32-20-26-46 8-38 36-64 70-66 34 2 62 28 70 66 6 26-2 46-26 46z" fill="#ffd900" stroke="#120e18" stroke-width="6" stroke-linejoin="round"/>
<path d="M74 80c-10-14-4-30 10-34l16 12 16-12c14 4 20 20 10 34z" fill="#ffd900" stroke="#120e18" stroke-width="6" stroke-linejoin="round"/>
<path d="M72 82h56" stroke="#1b1830" stroke-width="9"/>
<!-- the dollar, drawn on the pixel grid with stepped diagonals -->
<g fill="#1f6a3a"><rect x="96.875" y="109.375" width="6.25" height="6.25"/><rect x="90.625" y="115.625" width="6.25" height="6.25"/><rect x="96.875" y="115.625" width="6.25" height="6.25"/><rect x="103.125" y="115.625" width="6.25" height="6.25"/><rect x="109.375" y="115.625" width="6.25" height="6.25"/><rect x="84.375" y="121.875" width="6.25" height="6.25"/><rect x="96.875" y="121.875" width="6.25" height="6.25"/><rect x="84.375" y="128.125" width="6.25" height="6.25"/><rect x="96.875" y="128.125" width="6.25" height="6.25"/><rect x="90.625" y="134.375" width="6.25" height="6.25"/><rect x="96.875" y="134.375" width="6.25" height="6.25"/><rect x="96.875" y="140.625" width="6.25" height="6.25"/><rect x="103.125" y="140.625" width="6.25" height="6.25"/><rect x="96.875" y="146.875" width="6.25" height="6.25"/><rect x="109.375" y="146.875" width="6.25" height="6.25"/><rect x="96.875" y="153.125" width="6.25" height="6.25"/><rect x="109.375" y="153.125" width="6.25" height="6.25"/><rect x="84.375" y="159.375" width="6.25" height="6.25"/><rect x="90.625" y="159.375" width="6.25" height="6.25"/><rect x="96.875" y="159.375" width="6.25" height="6.25"/><rect x="103.125" y="159.375" width="6.25" height="6.25"/><rect x="96.875" y="165.625" width="6.25" height="6.25"/></g>
</g>`;

const toxicBarrel = `
${shadow}
<rect x="50" y="48" width="100" height="138" rx="8" fill="#ffd900" ${OUT}/>
<path d="M50 90h100M50 152h100" stroke="#1b1830" stroke-width="6"/>
<path d="M86 104c0-10 6-16 14-16s14 6 14 16c0 4-2 6-4 7v5H90v-5c-2-1-4-3-4-7z" fill="#1b1830"/>
<g fill="#ffd900"><rect x="92" y="100" width="6" height="6"/><rect x="102" y="100" width="6" height="6"/></g>
<path d="M50 58c10-10 30-14 50-14s40 4 50 14v8c-6 0-6 16-12 16s-4-12-10-12-6 22-12 22-6-22-12-22-8 10-14 10-6-14-14-14-8 8-14 8z" fill="#8ad06a" ${OUT}/>`;

/** The Break Room coffee machine: a brass-domed steampunk espresso machine with a pressure gauge and a cup under the spout. */
const coffeeMachine = `
<defs>${lg('cm-b', '#9ab8f0', '#1c4fb0')}${lg('cm-g', '#ffe45a', '#d09a20')}</defs>
${shadow}
<path d="M30 164h140v22H30z" fill="#3a3450" ${OUT}/><path d="M40 172h120" stroke="#9ab8f0" stroke-width="3"/>
<path d="M46 70h108v96H46z" fill="url(#cm-b)" ${OUT}/>
<path d="M54 70c0-28 20-42 46-42s46 14 46 42z" fill="url(#cm-g)" ${OUT}/><path d="M70 60c6-12 18-20 30-20" stroke="#fff" stroke-width="4" opacity=".6" fill="none"/>
<circle cx="100" cy="22" r="8" fill="url(#cm-g)" ${OUT}/>
<circle cx="100" cy="94" r="16" fill="#f6f0e4" stroke="url(#cm-g)" stroke-width="5"/><path d="M100 94l10-8" stroke="#ff3d9a" stroke-width="4"/><path d="M88 94h4M100 82v4M112 94h-4" stroke="#1b1830" stroke-width="2"/>
<path d="M82 120h36v10H82z" fill="url(#cm-g)" ${OUT}/><path d="M92 130h5v10h-5zM103 130h5v10h-5z" fill="#1b1830"/>
<rect x="98" y="140" width="4" height="8" fill="#6a3a1a"/>
<path d="M82 148h36v12c0 4-3 6-6 6H88c-3 0-6-2-6-6z" fill="#f6f0e4" ${OUT}/><path d="M118 152c8 0 8 10 0 10" stroke="#1b1830" stroke-width="4" fill="none"/><path d="M82 154h36" stroke="#ff3d9a" stroke-width="4"/>
<path d="M154 88h18v8h-18z" fill="url(#cm-g)" ${OUT}/><rect x="166" y="74" width="8" height="34" rx="3" fill="#1b1830" ${OUT}/>
<path d="M46 104H30v44" stroke="#1b1830" stroke-width="7" fill="none"/><path d="M46 104H30v44" stroke="url(#cm-g)" stroke-width="3" fill="none"/>
<rect x="128" y="128" width="16" height="5" fill="#1b1830"/>
<g fill="#1b1830"><circle cx="52" cy="76" r="2.5"/><circle cx="148" cy="76" r="2.5"/><circle cx="52" cy="160" r="2.5"/><circle cx="148" cy="160" r="2.5"/></g>`;

const warrior = `
<defs>${lg('wa-h', '#9ac0f8', '#1c5fd0', 1, 1)}${lg('wa-s', '#ffb4d4', '#ff86bc')}${lg('wa-a', '#ff8ac8', '#d03a8a')}${lg('wa-y', '#ffc890', '#ffbc80')}</defs>
<path d="M14 200c0-46 36-70 86-70 34 0 58 10 70 30l6 40z" fill="url(#wa-a)" ${OUT}/>
<path d="M14 176c0-28 18-46 44-48l14 46z" fill="url(#wa-h)" ${OUT}/>
<path d="M22 142l-10-20 22 8zM40 130l-4-22 16 14z" fill="#fbf4df" ${OUT}/>
<!-- right arm lost on the job: a bandaged stump -->
<path d="M132 132c16-8 38-4 46 12 6 12 0 26-14 28l-34-14z" fill="#f6f0e4" ${OUT}/>
<path d="M146 134l-8 28M160 136l-8 30M172 144l-6 26" stroke="#c9bd98" stroke-width="4"/>
<circle cx="168" cy="160" r="6" fill="#ff3d9a"/>
<path d="M72 120h56v26H72z" fill="url(#wa-s)" ${OUT}/>
<path d="M50 86c0-40 22-66 50-66s50 26 50 66v22c0 24-22 40-50 40S50 132 50 108z" fill="url(#wa-s)" ${OUT}/>
<path d="M72 34c7-7 15-10 22-10" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
<path d="M50 60c0-30 22-46 50-46s50 16 50 46z" fill="#ffd900" ${OUT}/><path d="M95 16h10v44H95z" fill="#e8b820"/>
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
<path d="M60 50c20-8 60-8 80 0" stroke="#1b1830" stroke-width="6" fill="none"/>
<circle cx="84" cy="46" r="10" fill="#1c5fd0" stroke="#ffd900" stroke-width="4"/><circle cx="116" cy="46" r="10" fill="#1c5fd0" stroke="#ffd900" stroke-width="4"/>
<path d="M74 76l16 2M126 76l-16 2" stroke="#1b1830" stroke-width="4"/>
<g fill="#3a3450" opacity=".7"><rect x="70" y="100" width="6" height="4"/><rect x="124" y="96" width="5" height="4"/></g>
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
<path d="M84 134l16 30 16-30" stroke="#1c5fd0" stroke-width="4" fill="none"/><rect x="90" y="162" width="20" height="24" fill="#f6f0e4" ${OUT}/><rect x="94" y="166" width="12" height="8" fill="#3aa05a"/>
<circle cx="62" cy="168" r="11" fill="#ff3d9a" ${OUT}/><rect x="58" y="161" width="8" height="12" rx="2" fill="#ffd900"/>
<path d="M150 200l8-150" stroke="#1b1830" stroke-width="8"/>
<path d="M146 44c0-12 20-12 20 0 0 8-4 12-10 14-6-2-10-6-10-14z" fill="url(#ne-s)" ${OUT}/>
<circle cx="152" cy="46" r="2.5" fill="#1b1830"/><circle cx="160" cy="46" r="2.5" fill="#1b1830"/>`;

export const CREATURES: Record<string, string> = {
  snitch,
  boomer,
  coworker,
  teamLeader,
  consultant,
  automaton,
  ceo,
  hr,
  sleeper,
  newHire,
  coffeeMachine,
  timeClock,
  filingCabinet,
  moneyBag,
  toxicBarrel,
  warrior,
  mage,
  necromancer,
};

/** Riso-pixel sprite of a creature (see riso.ts). */
export function creature(id: string, cls = ''): string {
  return sprite(id, cls);
}
