import { lg, OUT, shadow } from './creatures';
import { INK, PAPER } from './relics';
import { sprite } from './riso';

/**
 * The big picture of each room (see `roomScene`), on the same 200×200 grid as the creatures, keyed by node type.
 * Drawn like them: gradients and outlines, turned into riso pixels at boot (riso.ts). A room is a small scene, so each
 * has a face somewhere, a bit cute and a bit off.
 */

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

/** Promotion: the corporate ladder, and at the top a trophy that has seen too many shifts. */
const promotion = `
<defs>${lg('pr-g', '#fff08a', '#e0a010')}${lg('pr-b', '#6a9af8', '#1c4fb0')}</defs>
${shadow}
<path d="M60 112h80v9H60zM54 142h92v9H54zM48 172h104v9H48z" fill="${PAPER}" ${OUT}/>
<path d="M54 94h16l-10 92H40zM146 94h-16l10 92h20z" fill="url(#pr-b)" ${OUT}/>
<path d="M50 84h100v12H50z" fill="#3a3450" ${OUT}/>
<path d="M92 76h16v10H92z" fill="#e0a010" ${OUT}/>
<path d="M62 14h76v36c0 24-16 38-38 38S62 74 62 50z" fill="url(#pr-g)" ${OUT}/>
<path d="M62 26H46c-6 0-8 14 2 22 6 5 12 6 16 6M138 26h16c6 0 8 14-2 22-6 5-12 6-16 6" stroke="#120e18" stroke-width="12" fill="none" stroke-linecap="round"/>
<path d="M62 26H46c-6 0-8 14 2 22 6 5 12 6 16 6M138 26h16c6 0 8 14-2 22-6 5-12 6-16 6" stroke="#ffd900" stroke-width="6" fill="none" stroke-linecap="round"/>
<path d="M72 24v22" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>
<!-- tired eyes under heavy lids, a proud little smile, a ribbon on the chest -->
<circle cx="84" cy="46" r="8" fill="${PAPER}" ${OUT}/><circle cx="116" cy="46" r="8" fill="${PAPER}" ${OUT}/>
<circle cx="85" cy="50" r="3.5" fill="${INK}"/><circle cx="117" cy="50" r="3.5" fill="${INK}"/>
<path d="M74 44h20M106 44h20" stroke="#120e18" stroke-width="4" stroke-linecap="round"/>
<path d="M92 62q8 6 16 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M98 82l-7 12 7-3 2 5zM102 82l7 12-7-3-2 5z" fill="#ff3d9a" ${OUT}/><circle cx="100" cy="80" r="6" fill="#ff3d9a" ${OUT}/>`;

/** Copy Room: a photocopier mid-scan, a copy of itself in the tray, and a shredder with an appetite. */
const copyRoom = `
<defs>${lg('cp-b', '#6a9af8', '#1c4fb0')}${lg('cp-s', '#d8d4e8', '#8a86a8')}</defs>
${shadow}
<path d="M14 98h122v72H14z" fill="url(#cp-b)" ${OUT}/>
<path d="M22 100h106v8H22z" fill="#120e18" ${OUT}/><path d="M26 103h98v2H26z" fill="#6a9af8"/>
<path d="M20 98L34 58h104l-8 40z" fill="${PAPER}" ${OUT}/><path d="M42 68h86M38 80h86" stroke="#c9bd98" stroke-width="3"/>
<rect x="22" y="120" width="52" height="30" fill="#120e18" ${OUT}/>
<circle cx="38" cy="132" r="5" fill="#fff"/><circle cx="58" cy="132" r="5" fill="#fff"/><circle cx="39" cy="133" r="2.5" fill="${INK}"/><circle cx="59" cy="133" r="2.5" fill="${INK}"/>
<path d="M42 142h12" stroke="#ffd900" stroke-width="3"/>
<circle cx="90" cy="126" r="5" fill="#ff3d9a" ${OUT}/><circle cx="106" cy="126" r="5" fill="#ffd900" ${OUT}/><circle cx="122" cy="126" r="5" fill="${PAPER}" ${OUT}/>
<path d="M84 142h44v8H84z" fill="#120e18"/>
<!-- the copy sliding out of the tray -->
<path d="M92 148l-6 28h46l-4-28z" fill="${PAPER}" ${OUT}/><path d="M100 158h22M98 166h24" stroke="#1c5fd0" stroke-width="3"/>
<path d="M12 168h130v10H12z" fill="#3a3450" ${OUT}/>
<!-- the shredder: a slot, a hungry face, strips coming out below -->
<path d="M144 92h48v16h-48z" fill="url(#cp-s)" ${OUT}/><path d="M150 100h36" stroke="#120e18" stroke-width="5"/>
<path d="M148 108h40l-3 72h-34z" fill="url(#cp-s)" ${OUT}/>
<circle cx="159" cy="126" r="6" fill="${PAPER}" ${OUT}/><circle cx="177" cy="126" r="6" fill="${PAPER}" ${OUT}/><circle cx="160" cy="127" r="3" fill="${INK}"/><circle cx="178" cy="127" r="3" fill="${INK}"/>
<path d="M153 142h30l-3 10-4-7-4 7-4-7-4 7-4-7-3 7z" fill="#120e18" ${OUT}/>
<path d="M154 180l-2 8M162 180l1 8M172 180v8M182 180l3 6" stroke="${PAPER}" stroke-width="3" stroke-linecap="round"/>`;

/** Tailor: a dress form in the uniform and cargo pants, a tape measure round its neck, pins in the shoulder. */
const tailor = `
<defs>${lg('ta-b', '#6a9af8', '#1c4fb0')}${lg('ta-p', '#a2b040', '#6a7626')}${lg('ta-w', '#fff0d0', '#e0b078')}</defs>
${shadow}
<circle cx="100" cy="8" r="6" fill="#ffd900" ${OUT}/><path d="M96 12h8v6h-8z" fill="#3a3450" ${OUT}/>
<path d="M78 34c0-10 10-16 22-16s22 6 22 16v8c0 10-10 16-22 16s-22-6-22-16z" fill="url(#ta-w)" ${OUT}/>
<path d="M92 56h16v10H92z" fill="url(#ta-w)" ${OUT}/>
<path d="M50 78c0-10 10-14 28-14h44c18 0 28 4 28 14l-6 42H56z" fill="url(#ta-b)" ${OUT}/>
<path d="M86 64l14 22 14-22z" fill="${PAPER}" ${OUT}/><path d="M100 74l-6 8 6 34 6-34z" fill="#ff3d9a" ${OUT}/>
<path d="M56 120h88l4 10H52z" fill="#3a3450" ${OUT}/><path d="M92 120h16v10H92z" fill="#ffd900" ${OUT}/>
<path d="M52 130h96l6 52h-38l-16-36-16 36H46z" fill="url(#ta-p)" ${OUT}/>
<path d="M58 142h28v28H58z" fill="#8a9a30" ${OUT}/><path d="M58 142h28v8H58z" fill="#6a7626"/><circle cx="72" cy="150" r="3" fill="#ffd900"/>
<path d="M114 142h28v28h-28z" fill="#8a9a30" ${OUT}/><path d="M114 142h28v8h-28z" fill="#6a7626"/><circle cx="128" cy="150" r="3" fill="#ffd900"/>
<!-- tape measure round the neck, pins in the shoulder -->
<path d="M80 66C70 86 70 122 80 152" stroke="#120e18" stroke-width="12" fill="none" stroke-linecap="round"/>
<path d="M80 66C70 86 70 122 80 152" stroke="#ffd900" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M69 84h6M67 98h6M68 112h6M70 126h6M73 140h6" stroke="#120e18" stroke-width="2"/>
<g fill="#ff3d9a" ${OUT}><circle cx="136" cy="72" r="3.5"/><circle cx="144" cy="79" r="3.5"/><circle cx="130" cy="80" r="3.5"/></g>
<circle cx="90" cy="34" r="3" fill="${INK}"/><circle cx="110" cy="34" r="3" fill="${INK}"/>
<path d="M95 45q5 4 10 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;

/**
 * Lost & Found: a cardboard box with stationery poking out of its flaps, a pair of angry eyes on its front and a mouth full of
 * teeth with the tongue out. `open` is its other frame (flaps flung wide, jaws gaping), swapped in now and then by the CSS.
 */
const mimic = (open: boolean): string => {
  const KRAFT = '#ffd900';
  const SHADE = '#ff6a30';
  const lift = open ? 42 : 24;
  const slant = open ? 26 : 10;
  const mouthTop = 124;
  const mouthBottom = open ? 168 : 148;
  const tooth = open ? 14 : 9;
  const teeth = (y: number, dir: 1 | -1, x0: number): string => `M${x0} ${y}${'l8 {t}l8 -{t}'.repeat(8).replaceAll('{t}', String(dir * tooth))}`;
  const eye = (cx: number): string =>
    `<circle cx="${cx}" cy="100" r="14" fill="${PAPER}" ${OUT}/><rect x="${cx - 2.5}" y="${open ? 90 : 93}" width="5" height="${open ? 20 : 15}" fill="${INK}"/>`;
  return `
${shadow}
<!-- stationery it has eaten, poking out between the flaps -->
<path d="M64 80L58 ${74 - lift - 14}l10-3 12 ${lift + 14}z" fill="#ff3d9a" ${OUT}/><path d="M59 ${74 - lift - 14}l10-3-2-8z" fill="${INK}"/>
<path d="M104 80l14-${lift + 22} 10 4-8 ${lift + 18}z" fill="#1c5fd0" ${OUT}/><path d="M112 ${72 - lift}l5 2M116 ${64 - lift}l5 2" stroke="${PAPER}" stroke-width="2.5"/>
<path d="M82 80l2-${lift + 6} 22 3-4 ${lift + 3}z" fill="${PAPER}" ${OUT}/><path d="M88 ${70 - lift}h12" stroke="#1c5fd0" stroke-width="3"/>
<!-- the flaps -->
<path d="M24 76L${24 - slant} ${76 - lift}h66l${slant + 4} ${lift}z" fill="${SHADE}" ${OUT}/>
<path d="M176 76l${slant} -${lift}h-66l-${slant + 4} ${lift}z" fill="${SHADE}" ${OUT}/>
<!-- the box -->
<path d="M20 74h160v110H20z" fill="${KRAFT}" ${OUT}/>
<path d="M166 76h12v106h-12z" fill="${SHADE}"/>
<path d="M90 74h20v50H90z" fill="${PAPER}" ${OUT}/><path d="M96 80h8M96 88h8M96 96h8" stroke="#c9bd98" stroke-width="2"/>
${eye(66)}${eye(134)}
<path d="M44 82l40 14M156 82l-40 14" stroke="${INK}" stroke-width="7" stroke-linecap="square"/>
<!-- the mouth: teeth from above and below, tongue out -->
<path d="M32 ${mouthTop}h136v${mouthBottom - mouthTop}H32z" fill="${INK}" ${OUT}/>
<path d="${teeth(mouthTop, 1, 36)}z" fill="${PAPER}" ${OUT}/>
<path d="${teeth(mouthBottom, -1, 40)}z" fill="${PAPER}" ${OUT}/>
<path d="M88 ${mouthBottom - 4}h30v${open ? 22 : 14}c0 8-6 12-15 12s-15-4-15-12z" fill="#ff3d9a" ${OUT}/>
<path d="M103 ${mouthBottom + 2}v${open ? 18 : 10}" stroke="#a01060" stroke-width="3"/>
<!-- a shipping label, and a pencil stuck in the corner of its mouth -->
<path d="M30 ${open ? 172 : 160}h44v${open ? 10 : 20}H30z" fill="${PAPER}" ${OUT}/><path d="M35 ${open ? 177 : 166}h26M35 ${open ? 177 : 172}h18" stroke="#1c5fd0" stroke-width="3"/>
<path d="M168 ${mouthTop + 12}l22 -8" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M168 ${mouthTop + 12}l22 -8" stroke="#ffd900" stroke-width="6" stroke-linecap="round"/>
<path d="M186 ${mouthTop + 5}l8 -3" stroke="#ff3d9a" stroke-width="6" stroke-linecap="round"/>`;
};

/** Vending Machine: it takes blood. A drip bag hangs from its side, its display has eyes, its flap has teeth. */
const vending = `
<defs>${lg('vm-b', '#9ab8f0', '#1c4fb0')}${lg('vm-s', '#d8d4e8', '#8a86a8')}</defs>
${shadow}
<path d="M178 10v176" stroke="#120e18" stroke-width="9" stroke-linecap="round"/><path d="M178 10v176" stroke="url(#vm-s)" stroke-width="4" stroke-linecap="round"/>
<path d="M166 10h24" stroke="#120e18" stroke-width="7" stroke-linecap="round"/>
<path d="M156 28h22v40c0 8-4 12-11 12s-11-4-11-12z" fill="#ff3d9a" ${OUT}/><path d="M162 36v26" stroke="#ffb4d4" stroke-width="4" stroke-linecap="round"/>
<path d="M167 80v22c0 14-8 20-18 22" stroke="#ff3d9a" stroke-width="4" fill="none"/>
<path d="M30 14h118v168H30z" fill="url(#vm-b)" ${OUT}/>
<rect x="38" y="22" width="14" height="10" fill="#ff3d9a" ${OUT}/>
<rect x="38" y="40" width="62" height="84" fill="#120e18" ${OUT}/>
<path d="M38 66h62M38 94h62" stroke="#3a3450" stroke-width="4"/>
<rect x="44" y="48" width="14" height="18" fill="#ffd900" ${OUT}/><rect x="64" y="52" width="14" height="14" fill="#ff3d9a" ${OUT}/><path d="M84 66l-8-18h22z" fill="${PAPER}" ${OUT}/>
<rect x="44" y="76" width="16" height="18" fill="#6a9af8" ${OUT}/><rect x="66" y="80" width="12" height="14" fill="#ffd900" ${OUT}/><rect x="82" y="78" width="14" height="16" fill="#ff3d9a" ${OUT}/>
<rect x="46" y="104" width="12" height="20" fill="${PAPER}" ${OUT}/><rect x="64" y="108" width="18" height="16" fill="#ff3d9a" ${OUT}/><rect x="88" y="102" width="8" height="22" fill="#ffd900" ${OUT}/>
<rect x="108" y="40" width="34" height="34" fill="#120e18" ${OUT}/>
<circle cx="119" cy="52" r="5" fill="#ff3d9a"/><circle cx="133" cy="52" r="5" fill="#ff3d9a"/><circle cx="120" cy="53" r="2.2" fill="${INK}"/><circle cx="134" cy="53" r="2.2" fill="${INK}"/>
<path d="M118 64h16" stroke="#ff3d9a" stroke-width="3"/>
<g fill="${PAPER}" ${OUT}><rect x="108" y="82" width="10" height="9"/><rect x="120" y="82" width="10" height="9"/><rect x="132" y="82" width="10" height="9"/><rect x="108" y="94" width="10" height="9"/><rect x="120" y="94" width="10" height="9"/><rect x="132" y="94" width="10" height="9"/></g>
<path d="M120 110h22v16h-22z" fill="${INK}" ${OUT}/>
<path d="M38 134h104v40H38z" fill="#120e18" ${OUT}/>
<path d="M42 134v10l6 8 6-8 6 8 6-8 6 8 6-8 6 8 6-8 6 8 6-8 6 8 6-8v-10z" fill="${PAPER}" ${OUT}/>
<path d="M44 174h92" stroke="#ff3d9a" stroke-width="3"/>`;

/** The contract screen's hand: a skeleton's hand in a pink sleeve with a white cuff, pinching the corner of the paper (the pinch is at the top left). */
const contractHand = `
<path d="M144 108l56 56v36h-36l-56-56z" fill="#ff3d9a" ${OUT}/>
<path d="M164 146l16 16M150 164l16 16" stroke="#a01060" stroke-width="3" stroke-linecap="round"/>
<path d="M130 94l14 14-36 36-14-14z" fill="${PAPER}" ${OUT}/><circle cx="123" cy="115" r="5" fill="#ffd900" ${OUT}/>
<path d="M94 130L58 108l4-34 36-18 28 10 4 28z" fill="${PAPER}" ${OUT}/>
<g fill="${PAPER}" ${OUT}><circle cx="108" cy="58" r="10"/><circle cx="124" cy="70" r="10"/><circle cx="128" cy="88" r="10"/></g>
<path d="M76 74L46 40M62 108L32 68" stroke="${INK}" stroke-width="24" stroke-linecap="round"/>
<path d="M76 74L46 40M62 108L32 68" stroke="${PAPER}" stroke-width="17" stroke-linecap="round"/>
<circle cx="62" cy="58" r="5" fill="${INK}"/><circle cx="47" cy="88" r="5" fill="${INK}"/>`;

/** The pen that signs: a fountain pen, nib at the bottom left (about a fifth in from the left and a fifth up from the bottom). */
const contractPen = `
<g transform="rotate(-45 100 100)">
<path d="M22 100l30-12v24z" fill="#ffd900" ${OUT}/><path d="M26 100h22" stroke="${INK}" stroke-width="3"/><circle cx="48" cy="100" r="3" fill="${INK}"/>
<path d="M52 90h26v20H52z" fill="#3a3450" ${OUT}/>
<path d="M78 86h72v28H78z" fill="#ff3d9a" ${OUT}/><path d="M84 92h60" stroke="#ffb4d4" stroke-width="4" stroke-linecap="round"/>
<path d="M118 86h8v28h-8z" fill="#1c5fd0" ${OUT}/>
<path d="M150 88h26v24h-26z" fill="#a01060" ${OUT}/><path d="M140 80h36v8h-36z" fill="#ffd900" ${OUT}/>
</g>`;

/** Sprite sources by room type, as the renderer wants them (`room.` keeps them apart from creature ids). */
export const ROOM_SPRITES: Record<string, string> = {
  'room.rest': coffeeMachine,
  'room.promotion': promotion,
  'room.copy': copyRoom,
  'room.tailor': tailor,
  'room.lostFound': mimic(false),
  'room.lostFound.open': mimic(true),
  'room.vending': vending,
};

/** Sprites of the contract screen's props, keyed like the rooms'. */
export const PROP_SPRITES: Record<string, string> = { 'contract.hand': contractHand, 'contract.pen': contractPen };

/** Riso-pixel sprite of a contract prop (see riso.ts). */
export const propArt = (id: string, cls = ''): string => sprite(`contract.${id}`, cls);

/** Riso-pixel sprite of a room (see riso.ts). */
export const roomArt = (id: string, cls = ''): string => sprite(`room.${id}`, cls);
