/** Ambient pixel decorations for the dark dungeon: drifting ink motes and eyes in the dark. */
const INKS = ['var(--p)', 'var(--y)', '#5a8ef0'];

export function motes(n: number, inks: string[] = INKS): string {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = Math.round(Math.random() * 100);
    const y = Math.round(40 + Math.random() * 60);
    const size = Math.random() < 0.3 ? 6 : 4;
    const d = (6 + Math.random() * 6).toFixed(1);
    const dl = (-Math.random() * 12).toFixed(1);
    const dx = Math.round(Math.random() * 40 - 20);
    out += `<i style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;background:${inks[i % inks.length]};--d:${d}s;--dl:${dl}s;--dx:${dx}px"></i>`;
  }
  return `<div class="motes" aria-hidden="true">${out}</div>`;
}

/** Pairs of eyes blinking in the dark corners. */
export function darkEyes(spots: { x: string; y: string }[]): string {
  return spots
    .map(
      ({ x, y }, i) =>
        `<div class="dark-eyes" aria-hidden="true" style="left:${x};top:${y};--d:${3 + i * 1.3}s;--dl:${-i * 0.9}s"><i></i><i></i></div>`,
    )
    .join('');
}
