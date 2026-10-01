/**
 * Procedural sound effects (WebAudio). No assets: every sound is synthesised on demand.
 * The context is created lazily on the first user gesture (browser autoplay policy).
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bus: AudioNode | null = null;
let noiseBuf: AudioBuffer | null = null;
/** 0 (off) to 1. */
let volume = 1;
/** Master gain at full volume. */
const MASTER = 0.55;
const unlockListeners: (() => void)[] = [];

/** Shared audio graph for other modules (music). Null until the first user gesture. */
export function audioGraph(): { ctx: AudioContext; bus: AudioNode; noise: AudioBuffer } | null {
  return ctx && bus && noiseBuf ? { ctx, bus, noise: noiseBuf } : null;
}

export function onAudioUnlock(fn: () => void): void {
  if (ctx) fn();
  else unlockListeners.push(fn);
}

export function setSfxVolume(v: number): void {
  volume = v;
  if (master) master.gain.value = MASTER * volume;
}

/** Tries to resume a suspended context (works after a first unlock; harmless otherwise). */
export function resumeAudio(): void {
  if (ctx && ctx.state !== 'running') void ctx.resume().catch(() => {});
}

export function unlockAudio(): void {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER * volume;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    bus = comp;
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    unlockListeners.splice(0).forEach((fn) => {
      fn();
    });
  }
  resumeAudio();
}

type Wave = OscillatorType;

function env(g: GainNode, t: number, a: number, peak: number, dur: number): void {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

function tone(freq: number, dur: number, opts: { type?: Wave; vol?: number; to?: number; delay?: number; attack?: number } = {}): void {
  if (!ctx || !master) return;
  const t = ctx.currentTime + (opts.delay ?? 0);
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = opts.type ?? 'sine';
  o.frequency.setValueAtTime(freq, t);
  if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
  env(g, t, opts.attack ?? 0.005, opts.vol ?? 0.3, dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(
  dur: number,
  opts: { freq?: number; to?: number; q?: number; vol?: number; type?: BiquadFilterType; delay?: number; attack?: number } = {},
): void {
  if (!ctx || !master || !noiseBuf) return;
  const t = ctx.currentTime + (opts.delay ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = opts.type ?? 'bandpass';
  f.frequency.setValueAtTime(opts.freq ?? 1200, t);
  if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
  f.Q.value = opts.q ?? 1;
  const g = ctx.createGain();
  env(g, t, opts.attack ?? 0.004, opts.vol ?? 0.4, dur);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

const SOUNDS = {
  tap: () => tone(660, 0.06, { type: 'triangle', vol: 0.12 }),
  button: () => {
    tone(520, 0.07, { type: 'triangle', vol: 0.15 });
    tone(780, 0.08, { type: 'triangle', vol: 0.1, delay: 0.04 });
  },
  cardPlay: () => noise(0.18, { freq: 900, to: 3200, vol: 0.18, q: 0.8 }),
  cardSpawn: () => tone(300, 0.05, { type: 'triangle', vol: 0.04, to: 380 }),
  cardExpire: () => noise(0.25, { freq: 1600, to: 300, vol: 0.1 }),
  stash: () => {
    tone(440, 0.08, { type: 'triangle', vol: 0.15 });
    tone(330, 0.1, { type: 'triangle', vol: 0.12, delay: 0.05 });
  },
  /** A card joins your deck mid-fight: three quick rising notes. */
  deckAdd: () => {
    [523, 659, 880].forEach((f, i) => {
      tone(f, 0.07, { type: 'triangle', vol: 0.12, delay: i * 0.05 });
    });
  },
  error: () => tone(160, 0.14, { type: 'square', vol: 0.08, to: 120 }),
  slash: () => {
    noise(0.16, { freq: 2600, to: 700, vol: 0.4, q: 1.4 });
    tone(140, 0.12, { type: 'sine', vol: 0.3, to: 60 });
  },
  blunt: () => {
    tone(120, 0.2, { type: 'sine', vol: 0.55, to: 45 });
    noise(0.1, { freq: 500, vol: 0.35, type: 'lowpass' });
  },
  fire: () => {
    noise(0.4, { freq: 600, to: 2400, vol: 0.35, type: 'lowpass', attack: 0.03 });
    tone(90, 0.3, { type: 'sawtooth', vol: 0.08, to: 50 });
  },
  ice: () => {
    [1760, 2350, 2960].forEach((f, i) => {
      tone(f, 0.25, { type: 'sine', vol: 0.09, delay: i * 0.04 });
    });
    noise(0.2, { freq: 5000, vol: 0.12, type: 'highpass' });
  },
  arcane: () => {
    tone(880, 0.22, { type: 'sine', vol: 0.18, to: 1320 });
    tone(440, 0.25, { type: 'triangle', vol: 0.1, to: 660 });
  },
  enemyHit: () => {
    tone(90, 0.25, { type: 'sine', vol: 0.6, to: 40 });
    noise(0.14, { freq: 900, to: 200, vol: 0.45, type: 'lowpass' });
  },
  block: () => {
    tone(1200, 0.18, { type: 'triangle', vol: 0.14, to: 900 });
    noise(0.08, { freq: 3000, vol: 0.15 });
  },
  blocked: () => {
    tone(900, 0.12, { type: 'square', vol: 0.06, to: 700 });
    noise(0.1, { freq: 2500, vol: 0.2 });
  },
  heal: () => {
    [523, 659, 784, 1046].forEach((f, i) => {
      tone(f, 0.2, { type: 'sine', vol: 0.12, delay: i * 0.06 });
    });
  },
  mana: () => {
    [1046, 1318].forEach((f, i) => {
      tone(f, 0.12, { type: 'sine', vol: 0.08, delay: i * 0.05 });
    });
  },
  scrub: () => noise(0.12, { freq: 1800, to: 900, vol: 0.12 }),
  ratchet: () => tone(900, 0.03, { type: 'square', vol: 0.06, to: 600 }),
  weakSpot: () => tone(1200, 0.07, { type: 'square', vol: 0.07, to: 1600 }),
  status: () => tone(300, 0.2, { type: 'triangle', vol: 0.12, to: 520 }),
  debuff: () => tone(400, 0.25, { type: 'sawtooth', vol: 0.06, to: 200 }),
  windup: () => tone(200, 0.4, { type: 'sawtooth', vol: 0.05, to: 400, attack: 0.1 }),
  /** An enemy hit is about to land and Block won't cover it: two low knocks, readable without looking. */
  incoming: () => {
    tone(150, 0.07, { type: 'square', vol: 0.09, to: 120 });
    tone(150, 0.09, { type: 'square', vol: 0.11, to: 110, delay: 0.14 });
  },
  /** The hit being charged would knock you out: a two-tone factory alarm. */
  lethal: () => {
    for (let i = 0; i < 2; i++) {
      tone(880, 0.16, { type: 'square', vol: 0.07, to: 660, delay: i * 0.36 });
      tone(660, 0.16, { type: 'square', vol: 0.07, to: 880, delay: i * 0.36 + 0.18 });
    }
  },
  /** An enemy hit is about to land and Block covers it: one soft high tick. */
  incomingSafe: () => tone(1100, 0.06, { type: 'triangle', vol: 0.07, to: 1000 }),
  ability: () => {
    noise(0.6, { freq: 300, to: 4000, vol: 0.3, attack: 0.05 });
    [262, 392, 523].forEach((f, i) => {
      tone(f, 0.5, { type: 'sawtooth', vol: 0.06, delay: i * 0.05 });
    });
  },
  curse: () => {
    tone(180, 0.35, { type: 'sawtooth', vol: 0.08, to: 90 });
    tone(190, 0.35, { type: 'sawtooth', vol: 0.06, to: 95 });
  },
  steal: () => noise(0.25, { freq: 3000, to: 800, vol: 0.2 }),
  victory: () => {
    [523, 659, 784, 1046].forEach((f, i) => {
      tone(f, 0.4, { type: 'triangle', vol: 0.18, delay: i * 0.11 });
    });
  },
  /** The office door: three knocks, the latch clunks, then a creak as it swings open. */
  door: () => {
    for (const d of [0, 0.17, 0.34]) {
      tone(110, 0.07, { type: 'sine', vol: 0.4, to: 70, delay: d });
      tone(240, 0.04, { type: 'triangle', vol: 0.12, to: 180, delay: d });
      noise(0.05, { freq: 600, vol: 0.25, type: 'lowpass', delay: d });
    }
    tone(140, 0.08, { type: 'square', vol: 0.12, to: 90, delay: 0.62 });
    noise(0.06, { freq: 900, vol: 0.3, type: 'lowpass', delay: 0.62 });
    tone(420, 0.6, { type: 'sawtooth', vol: 0.03, to: 260, delay: 0.72, attack: 0.1 });
    noise(0.45, { freq: 1400, to: 700, q: 6, vol: 0.06, delay: 0.72 });
  },
  /** Heavy machinery starting up (a belt row opening): a motor spinning up under a train of clunks, then a latch. */
  machinery: () => {
    tone(45, 2.2, { type: 'sawtooth', vol: 0.08, to: 75, attack: 0.3 });
    noise(2.2, { freq: 200, to: 500, vol: 0.12, type: 'lowpass', attack: 0.3 });
    for (let i = 0; i < 12; i++) noise(0.05, { freq: 700, vol: 0.18, type: 'lowpass', delay: 0.1 + i * 0.17 });
    tone(140, 0.1, { type: 'square', vol: 0.12, to: 80, delay: 2.2 });
  },
  /** A boss is down: a longer brass-like fanfare, rising in thirds, ending on a held chord. */
  bossVictory: () => {
    [523, 659, 784, 659, 784, 1046].forEach((f, i) => {
      tone(f, 0.22, { type: 'square', vol: 0.08, delay: i * 0.12 });
      tone(f / 2, 0.22, { type: 'triangle', vol: 0.1, delay: i * 0.12 });
    });
    [523, 659, 784, 1046].forEach((f) => {
      tone(f, 1.1, { type: 'triangle', vol: 0.1, delay: 0.75, attack: 0.02 });
    });
    noise(0.5, { freq: 6000, vol: 0.05, type: 'highpass', delay: 0.75 });
  },
  defeat: () => {
    [392, 330, 262, 196].forEach((f, i) => {
      tone(f, 0.5, { type: 'triangle', vol: 0.16, delay: i * 0.16 });
    });
  },
  reshuffle: () => {
    [0, 1, 2, 3].forEach((i) => {
      noise(0.05, { freq: 2000 + i * 300, vol: 0.08, delay: i * 0.04 });
    });
  },
  /** A time card punched in the clock: the card slides in, then a heavy ka-chunk. */
  punchClock: () => {
    noise(0.12, { freq: 1800, to: 900, vol: 0.12 });
    tone(110, 0.12, { type: 'square', vol: 0.12, to: 60, delay: 0.3 });
    noise(0.08, { freq: 600, vol: 0.4, type: 'lowpass', delay: 0.3 });
    noise(0.05, { freq: 3000, vol: 0.2, q: 3, delay: 0.42 });
  },
  /** An enemy's half-HP trait kicks in: a factory klaxon, three honks. */
  klaxon: () => {
    for (let i = 0; i < 3; i++) {
      tone(330, 0.18, { type: 'sawtooth', vol: 0.1, to: 300, delay: i * 0.24 });
      tone(415, 0.18, { type: 'square', vol: 0.05, to: 380, delay: i * 0.24 });
    }
  },
  /** A padlock rattled: chain links clinking, then the shackle's clank. */
  chains: () => {
    [0, 0.06, 0.1, 0.17, 0.22].forEach((d, i) => {
      noise(0.05, { freq: 3800 + i * 500, q: 8, vol: 0.18, delay: d });
      tone(2400 + i * 180, 0.06, { type: 'triangle', vol: 0.04, delay: d });
    });
    tone(700, 0.12, { type: 'square', vol: 0.06, to: 500, delay: 0.3 });
  },
  /** An enemy goes down: a long falling groan over a crumble. */
  enemyDown: () => {
    tone(220, 0.9, { type: 'sawtooth', vol: 0.12, to: 40, attack: 0.02 });
    tone(233, 0.9, { type: 'sawtooth', vol: 0.08, to: 42, attack: 0.02 });
    noise(0.8, { freq: 800, to: 150, vol: 0.3, type: 'lowpass', delay: 0.5 });
  },
  /** The boss is in: a factory steam whistle (a sour chord that slides up, plus the hiss). */
  siren: () => {
    [370, 440, 523].forEach((f) => {
      tone(f, 1.4, { type: 'triangle', vol: 0.07, to: f * 1.06, attack: 0.18 });
    });
    noise(1.3, { freq: 3500, vol: 0.08, type: 'highpass', attack: 0.15 });
  },
  enrage: () => {
    tone(80, 0.6, { type: 'sawtooth', vol: 0.15, to: 160 });
    noise(0.5, { freq: 400, vol: 0.2, type: 'lowpass' });
  },
};

export type SoundId = keyof typeof SOUNDS;

const lastPlayed: Partial<Record<SoundId, number>> = {};

export function sfx(id: SoundId): void {
  if (volume <= 0 || !ctx) return;
  // Avoid stacking the same sound many times in one frame (multi-hit attacks).
  const now = performance.now();
  if ((lastPlayed[id] ?? 0) > now - 40) return;
  lastPlayed[id] = now;
  SOUNDS[id]();
}
