/**
 * Procedural chiptune soundtrack.
 *
 * Tracks are short composed loops (chords, bass, arpeggio, lead, drums) played by a
 * look-ahead WebAudio scheduler with pulse/triangle "chip" voices. Dark minor keys,
 * harmonic-minor dominants and tritones give the dungeon its uneasy mood.
 */
import { audioGraph, onAudioUnlock, resumeAudio } from './sfx';

export type TrackId = 'menu' | 'combat' | 'combat2' | 'elite' | 'boss' | 'rest' | 'pause' | 'victory';

/** [step (0-15), midi note, length in 16th steps] */
type NoteEv = [number, number, number];

interface Chord {
  root: number;
  /** Intervals from the root. */
  tones: number[];
}

interface Track {
  bpm: number;
  chords: Chord[];
  /** Bass pattern: 16 entries, semitone offset from the chord root (octave 2), or null for rest. */
  bass: (number | null)[];
  bassWave: 'triangle' | 'pulse';
  /** Arp pattern: indices into chord tones (octave 4-5), or null. */
  arp: (number | null)[];
  arpOctave: number;
  /** One bar of lead per chord; the lead plays on phrases where `leadOn(phrase)` is true. */
  lead: NoteEv[][];
  leadOn: (phrase: number) => boolean;
  leadVoice: 'pulse' | 'bell';
  /** Drum lanes, 16 chars each: k kick, s snare, h hat, t tom, . rest */
  drums: string[];
  pad: boolean;
  crackle?: boolean;
  gain: number;
}

const m = (x: number): number => 440 * 2 ** ((x - 69) / 12);
const MIN = [0, 3, 7];
const MAJ = [0, 4, 7];
const MAJ7 = [0, 4, 7, 11];
const DOM7 = [0, 4, 7, 10];
const _ = null;

// Note names (octave 4/5) for readability.
const A4 = 69,
  Bb4 = 70,
  B4 = 71,
  C5 = 72,
  Cs5 = 73,
  D5 = 74,
  Ds5 = 75,
  E5 = 76,
  F5 = 77,
  G5 = 79,
  A5 = 81,
  Bb5 = 82,
  B5 = 83,
  Ab5 = 80,
  Gs5 = 80,
  Fs5 = 78,
  G4 = 67;

const TRACKS: Record<TrackId, Track> = {
  // Slow, eerie: a music box in an empty crypt, with a heartbeat underneath.
  menu: {
    bpm: 76,
    chords: [
      { root: 38, tones: MIN }, // Dm
      { root: 34, tones: MAJ7 }, // Bbmaj7
      { root: 43, tones: MIN }, // Gm
      { root: 45, tones: DOM7 }, // A7 (harmonic minor)
    ],
    bass: [0, _, _, _, _, _, _, _, 0, _, _, _, _, _, _, _],
    bassWave: 'triangle',
    arp: [0, _, 1, _, 2, _, 1, _, 3, _, 2, _, 1, _, 2, _],
    arpOctave: 4,
    lead: [
      [
        [0, A5, 8],
        [8, F5, 8],
      ],
      [
        [0, D5, 8],
        [8, E5, 8],
      ],
      [
        [0, G5, 4],
        [4, F5, 4],
        [8, D5, 8],
      ],
      [
        [0, Cs5, 8],
        [8, E5, 4],
        [12, A4, 4],
      ],
    ],
    leadOn: () => true, // the melody starts with the track (no silent-ish intro)
    leadVoice: 'bell',
    drums: ['k.k.............'],
    pad: true,
    gain: 0.9,
  },
  // Driving D minor: running bass, 16th arps, a hooky pulse lead.
  combat: {
    bpm: 138,
    chords: [
      { root: 38, tones: MIN }, // Dm
      { root: 38, tones: MIN }, // Dm
      { root: 34, tones: MAJ }, // Bb
      { root: 36, tones: MAJ }, // C
      { root: 38, tones: MIN }, // Dm
      { root: 38, tones: MIN }, // Dm
      { root: 43, tones: MIN }, // Gm
      { root: 45, tones: MAJ }, // A (harmonic minor)
    ],
    bass: [0, _, 0, 12, 0, _, 0, 12, 0, _, 0, 12, 0, 7, 12, 7],
    bassWave: 'triangle',
    arp: [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 1],
    arpOctave: 5,
    lead: [
      [
        [0, D5, 3],
        [3, F5, 3],
        [6, A5, 2],
        [8, G5, 2],
        [10, F5, 2],
        [12, E5, 4],
      ],
      [
        [0, D5, 6],
        [6, A4, 2],
        [8, C5, 4],
        [12, D5, 4],
      ],
      [
        [0, F5, 3],
        [3, D5, 3],
        [6, Bb4, 2],
        [8, C5, 2],
        [10, D5, 2],
        [12, F5, 4],
      ],
      [
        [0, E5, 6],
        [6, G5, 2],
        [8, E5, 4],
        [12, C5, 4],
      ],
      [
        [0, A5, 3],
        [3, G5, 3],
        [6, F5, 2],
        [8, E5, 2],
        [10, D5, 2],
        [12, A4, 4],
      ],
      [
        [0, D5, 8],
        [8, F5, 4],
        [12, E5, 4],
      ],
      [
        [0, D5, 3],
        [3, Bb4, 3],
        [6, G4, 2],
        [8, A4, 2],
        [10, Bb4, 2],
        [12, D5, 4],
      ],
      [
        [0, Cs5, 6],
        [6, E5, 2],
        [8, A5, 8],
      ],
    ],
    leadOn: (p) => p % 3 !== 0,
    leadVoice: 'pulse',
    drums: ['k.......k.k.....', '....s.......s...', '..h...h...h...hh'],
    pad: false,
    gain: 0.8,
  },
  // The afternoon shift: office elevator music gone wrong. A minor seventh chords, a bell arp, four-on-the-floor
  // machinery with off-beat hats, a syncopated bass and a nagging lead.
  combat2: {
    bpm: 128,
    chords: [
      { root: 45, tones: [0, 3, 7, 10] }, // Am7
      { root: 41, tones: MAJ7 }, // Fmaj7
      { root: 36, tones: MAJ }, // C
      { root: 43, tones: MAJ }, // G
      { root: 45, tones: [0, 3, 7, 10] }, // Am7
      { root: 38, tones: MIN }, // Dm
      { root: 40, tones: DOM7 }, // E7
      { root: 40, tones: DOM7 }, // E7
    ],
    bass: [0, _, _, 0, _, _, 12, _, 0, _, 7, _, 10, _, 12, _],
    bassWave: 'pulse',
    arp: [0, _, 2, 1, _, 3, 2, _, 0, _, 2, 1, _, 3, 1, 2],
    arpOctave: 4,
    lead: [
      [
        [0, E5, 2],
        [2, E5, 2],
        [4, D5, 2],
        [6, C5, 4],
        [12, A4, 4],
      ],
      [
        [0, F5, 6],
        [6, E5, 2],
        [8, C5, 8],
      ],
      [
        [0, G5, 2],
        [2, E5, 2],
        [4, G5, 2],
        [6, E5, 2],
        [8, C5, 8],
      ],
      [
        [0, D5, 4],
        [4, B4, 4],
        [8, D5, 4],
        [12, G5, 4],
      ],
      [
        [0, A5, 4],
        [4, G5, 2],
        [6, E5, 2],
        [8, C5, 4],
        [12, E5, 4],
      ],
      [
        [0, F5, 4],
        [4, D5, 4],
        [8, A4, 8],
      ],
      [
        [0, Gs5, 4],
        [4, E5, 4],
        [8, B4, 4],
        [12, D5, 4],
      ],
      [
        [0, E5, 12],
        [12, B4, 4],
      ],
    ],
    leadOn: (p) => p % 2 === 1,
    leadVoice: 'pulse',
    drums: ['k...k...k...k...', '....s.......s..s', '..h...h...h...h.'],
    pad: true,
    gain: 0.75,
  },
  // Phrygian dread: hammering E bass, tritone turnaround, dissonant riff.
  boss: {
    bpm: 156,
    chords: [
      { root: 40, tones: MIN }, // Em
      { root: 41, tones: MAJ }, // F
      { root: 40, tones: MIN }, // Em
      { root: 34, tones: MAJ }, // Bb (tritone)
    ],
    bass: [0, 0, 12, 0, 0, 12, 0, 0, 0, 0, 12, 0, 1, 0, 12, 0],
    bassWave: 'pulse',
    arp: [2, _, 1, _, 0, _, 1, _, 2, _, 1, _, 0, _, 1, _],
    arpOctave: 5,
    lead: [
      [
        [0, E5, 2],
        [2, G5, 2],
        [4, F5, 2],
        [6, E5, 2],
        [8, B4, 4],
        [12, Bb4, 4],
      ],
      [
        [0, F5, 2],
        [2, A5, 2],
        [4, G5, 2],
        [6, F5, 2],
        [8, C5, 4],
        [12, B4, 4],
      ],
      [
        [0, E5, 2],
        [2, G5, 2],
        [4, B5, 4],
        [8, Bb5, 4],
        [12, G5, 4],
      ],
      [
        [0, F5, 4],
        [4, E5, 4],
        [8, Ds5, 4],
        [12, E5, 4],
      ],
    ],
    leadOn: (p) => p % 2 === 1,
    leadVoice: 'pulse',
    drums: ['k..k..k.k..k..k.', '....s.......s..s', 'hhhhhhhhhhhhhhhh'],
    pad: false,
    gain: 0.75,
  },
  // Elite: a dark war march in C minor. Heavy half-time drums, a droning pulse bass with a tritone
  // sting, choir-like pads and a slow, heroic lead over a Neapolitan (Db) turn.
  elite: {
    bpm: 112,
    chords: [
      { root: 36, tones: MIN }, // Cm
      { root: 32, tones: MAJ }, // Ab
      { root: 29, tones: MIN }, // Fm
      { root: 31, tones: DOM7 }, // G7 (harmonic minor)
      { root: 36, tones: MIN }, // Cm
      { root: 37, tones: MAJ }, // Db (Neapolitan)
      { root: 34, tones: MAJ }, // Bb
      { root: 31, tones: MAJ }, // G
    ],
    bass: [0, _, 0, _, 0, _, 0, 12, 0, _, 0, _, 7, _, 6, _],
    bassWave: 'pulse',
    arp: [0, _, _, 2, _, _, 1, _, 0, _, _, 2, _, _, 3, _],
    arpOctave: 4,
    lead: [
      [
        [0, G5, 6],
        [6, Ds5, 2],
        [8, C5, 8],
      ],
      [
        [0, C5, 4],
        [4, Ds5, 4],
        [8, Ab5, 8],
      ],
      [
        [0, G5, 4],
        [4, F5, 4],
        [8, C5, 8],
      ],
      [
        [0, D5, 6],
        [6, F5, 2],
        [8, B4, 8],
      ],
      [
        [0, C5, 6],
        [6, Ds5, 2],
        [8, G5, 8],
      ],
      [
        [0, Ab5, 4],
        [4, F5, 4],
        [8, Cs5, 8],
      ],
      [
        [0, D5, 4],
        [4, F5, 4],
        [8, Bb4, 8],
      ],
      [
        [0, B4, 4],
        [4, D5, 4],
        [8, G4, 8],
      ],
    ],
    leadOn: (p) => p >= 1,
    leadVoice: 'pulse',
    drums: ['k.......k.......', '........s.......', 'h...h...h...h...', '............t.tt'],
    pad: true,
    gain: 0.8,
  },
  // Victory: the one major-key track. A chiptune fanfare in D over marching drums and a bouncing bass.
  victory: {
    bpm: 126,
    chords: [
      { root: 38, tones: MAJ }, // D
      { root: 43, tones: MAJ }, // G
      { root: 47, tones: MIN }, // Bm
      { root: 45, tones: MAJ }, // A
    ],
    bass: [0, _, 12, _, 0, _, 12, _, 0, _, 12, _, 7, _, 12, _],
    bassWave: 'triangle',
    arp: [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 3],
    arpOctave: 5,
    lead: [
      [
        [0, D5, 2],
        [2, D5, 2],
        [4, D5, 2],
        [6, A5, 6],
        [12, Fs5, 4],
      ],
      [
        [0, G5, 4],
        [4, B5, 4],
        [8, A5, 8],
      ],
      [
        [0, Fs5, 4],
        [4, D5, 4],
        [8, B4, 8],
      ],
      [
        [0, E5, 4],
        [4, Fs5, 2],
        [6, G5, 2],
        [8, A5, 8],
      ],
    ],
    leadOn: () => true,
    leadVoice: 'pulse',
    drums: ['k...k...k...k...', '....s.......s.ss', 'h.h.h.h.h.h.h.h.'],
    pad: false,
    gain: 0.8,
  },
  // Pause: a slow, hushed music box. Sparse bells over soft pads, no drums.
  pause: {
    bpm: 58,
    chords: [
      { root: 45, tones: MIN }, // Am
      { root: 41, tones: MAJ7 }, // Fmaj7
      { root: 38, tones: MIN }, // Dm
      { root: 40, tones: MAJ }, // E
    ],
    bass: [0, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
    bassWave: 'triangle',
    arp: [0, _, _, _, 2, _, _, _, 1, _, _, _, 3, _, _, _],
    arpOctave: 4,
    lead: [
      [
        [0, E5, 8],
        [8, C5, 8],
      ],
      [[0, A4, 16]],
      [
        [0, F5, 8],
        [8, D5, 8],
      ],
      [[0, B4, 16]],
    ],
    leadOn: (p) => p % 2 === 1,
    leadVoice: 'bell',
    drums: [],
    pad: true,
    gain: 0.6,
  },
  // A moment of warmth by the fire; still minor, still a little sad.
  rest: {
    bpm: 66,
    chords: [
      { root: 45, tones: MIN }, // Am
      { root: 41, tones: MAJ7 }, // Fmaj7
      { root: 36, tones: MAJ }, // C
      { root: 40, tones: MAJ }, // E (harmonic minor)
    ],
    bass: [0, _, _, _, _, _, 7, _, 0, _, _, _, _, _, _, _],
    bassWave: 'triangle',
    arp: [0, _, 1, _, 2, _, 3, _, 2, _, 1, _, 2, _, 1, _],
    arpOctave: 4,
    lead: [
      [
        [0, E5, 6],
        [6, C5, 2],
        [8, A4, 8],
      ],
      [
        [0, A4, 4],
        [4, C5, 4],
        [8, E5, 8],
      ],
      [
        [0, G5, 6],
        [6, E5, 2],
        [8, C5, 8],
      ],
      [
        [0, B4, 8],
        [8, Ds5 - 2, 4],
        [12, E5, 4],
      ],
    ],
    leadOn: (p) => p % 2 === 0,
    leadVoice: 'bell',
    drums: [],
    pad: true,
    crackle: true,
    gain: 0.85,
  },
};

// ------------------------------------------------------------------ playback

/** 0 (off) to 1. */
let volume = 1;
let wanted: TrackId | null = null;
let current: { id: TrackId; out: GainNode; timer: number } | null = null;
let pulseWave: PeriodicWave | null = null;
let thinWave: PeriodicWave | null = null;
const VOLUME = 0.2;

function pulse(ctx: AudioContext, duty: number): PeriodicWave {
  const n = 32;
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  for (let i = 1; i < n; i++) im[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
  return ctx.createPeriodicWave(re, im);
}

interface Voice {
  wave: 'triangle' | 'sine' | 'pulse' | 'thin';
  vol: number;
  attack?: number;
  release?: number;
  vibrato?: boolean;
  detune?: number;
}

function note(out: AudioNode, freq: number, t: number, dur: number, v: Voice): void {
  const g = audioGraph();
  if (!g) return;
  const { ctx } = g;
  const o = ctx.createOscillator();
  if (v.wave === 'pulse') {
    pulseWave ??= pulse(ctx, 0.25);
    o.setPeriodicWave(pulseWave);
  } else if (v.wave === 'thin') {
    thinWave ??= pulse(ctx, 0.125);
    o.setPeriodicWave(thinWave);
  } else o.type = v.wave;
  o.frequency.setValueAtTime(freq, t);
  if (v.detune) o.detune.setValueAtTime(v.detune, t);
  if (v.vibrato && dur > 0.25) {
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = 5.5;
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(freq * 0.012, t + dur * 0.6);
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t);
    lfo.stop(t + dur + 0.1);
  }
  const a = v.attack ?? 0.005;
  const r = v.release ?? 0.06;
  const gn = ctx.createGain();
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.linearRampToValueAtTime(v.vol, t + a);
  gn.gain.setValueAtTime(v.vol, t + Math.max(a, dur - r));
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur + r);
  o.connect(gn).connect(out);
  o.start(t);
  o.stop(t + dur + r + 0.05);
}

function bell(out: AudioNode, freq: number, t: number, dur: number, vol: number): void {
  // Two sines at an inharmonic ratio: a cold music-box ring.
  note(out, freq, t, dur, { wave: 'sine', vol, attack: 0.004, release: dur * 0.9 });
  note(out, freq * 2.76, t, dur * 0.4, { wave: 'sine', vol: vol * 0.25, attack: 0.002, release: dur * 0.3 });
}

function drum(out: AudioNode, kind: string, t: number, vol: number): void {
  const g = audioGraph();
  if (!g) return;
  const { ctx, noise } = g;
  if (kind === 'k' || kind === 't') {
    const o = ctx.createOscillator();
    const gn = ctx.createGain();
    const f0 = kind === 'k' ? 130 : 220;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(kind === 'k' ? 38 : 90, t + 0.14);
    gn.gain.setValueAtTime(vol * 0.9, t);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(gn).connect(out);
    o.start(t);
    o.stop(t + 0.25);
    return;
  }
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  const gn = ctx.createGain();
  const len = kind === 's' ? 0.16 : kind === 'c' ? 0.02 : 0.035;
  f.type = kind === 's' ? 'bandpass' : 'highpass';
  f.frequency.value = kind === 's' ? 1700 : kind === 'c' ? 2500 : 7500;
  gn.gain.setValueAtTime(kind === 's' ? vol * 0.5 : kind === 'c' ? vol * 0.25 : vol * 0.18, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(f).connect(gn).connect(out);
  src.start(t, Math.random() * 0.8);
  src.stop(t + len + 0.02);
}

function start(id: TrackId): void {
  const g = audioGraph();
  if (!g) return;
  const { ctx, bus } = g;
  const tr = TRACKS[id];
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, ctx.currentTime);
  // Short fade-in: the track is audible right away.
  out.gain.linearRampToValueAtTime(VOLUME * tr.gain * volume, ctx.currentTime + 0.35);
  // A gentle low-pass keeps the square waves from getting harsh.
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 5200;
  out.connect(lp).connect(bus);

  // Read every step, so a tempo change (the belt rushing) is heard right away.
  const sixteenth = (): number => 60 / tr.bpm / 4 / tempo;
  let step = 0;
  let next = ctx.currentTime + 0.1;

  const schedule = (s: number, t: number): void => {
    const barIdx = Math.floor(s / 16);
    const i = s % 16;
    const chordIdx = barIdx % tr.chords.length;
    const phrase = Math.floor(barIdx / tr.chords.length);
    const ch = tr.chords[chordIdx];

    const b = tr.bass[i];
    if (b !== null) {
      const len = tr.bass.slice(i + 1).findIndex((x) => x !== null);
      const steps = len < 0 ? 16 - i : len + 1;
      note(out, m(ch.root + b), t, sixteenth() * Math.min(steps, 4) * 0.9, {
        wave: tr.bassWave === 'pulse' ? 'thin' : 'triangle',
        vol: tr.bassWave === 'pulse' ? 0.16 : 0.34,
        release: 0.04,
      });
    }

    const a = tr.arp[i];
    if (a !== null) {
      const tone = ch.tones[a % ch.tones.length] + 12 * Math.floor(a / ch.tones.length);
      const f = m((ch.root % 12) + 12 * (tr.arpOctave + 1) + tone);
      if (tr.leadVoice === 'bell') note(out, f, t, sixteenth() * 1.6, { wave: 'triangle', vol: 0.07, release: 0.12 });
      else note(out, f, t, sixteenth() * 0.8, { wave: 'thin', vol: 0.045, release: 0.02 });
    }

    if (tr.leadOn(phrase)) {
      for (const [st, n, len] of tr.lead[chordIdx % tr.lead.length]) {
        if (st !== i) continue;
        const dur = sixteenth() * len;
        if (tr.leadVoice === 'bell') bell(out, m(n), t, dur * 1.4, 0.12);
        else note(out, m(n), t, dur * 0.92, { wave: 'pulse', vol: 0.09, vibrato: true, release: 0.05 });
      }
    }

    if (tr.pad && i === 0) {
      for (const tone of ch.tones.slice(0, 3)) {
        for (const det of [-7, 7])
          note(out, m(ch.root + 12 + tone), t, sixteenth() * 15, { wave: 'triangle', vol: 0.035, attack: 0.5, release: 0.5, detune: det });
      }
    }

    for (const lane of tr.drums) {
      const c = lane[i];
      if (c && c !== '.') drum(out, c, t, id === 'menu' ? 0.5 : 0.8);
    }

    if (tr.crackle && Math.random() < 0.35) drum(out, 'c', t + Math.random() * sixteenth(), 1);
  };

  const timer = window.setInterval(() => {
    while (next < ctx.currentTime + 0.15) {
      schedule(step, next);
      next += sixteenth();
      step++;
    }
  }, 25);
  current = { id, out, timer };
}

function stop(fade = 0.6): void {
  const g = audioGraph();
  if (!current || !g) return;
  const { out, timer } = current;
  const t = g.ctx.currentTime;
  out.gain.cancelScheduledValues(t);
  out.gain.setValueAtTime(out.gain.value, t);
  out.gain.linearRampToValueAtTime(0.0001, t + fade);
  setTimeout(
    () => {
      clearInterval(timer);
      out.disconnect();
    },
    fade * 1000 + 200,
  );
  current = null;
}

/** Playback speed of every track (1 = as written); the fight nudges it when the belt speeds up or slows down. */
let tempo = 1;

export function setMusicTempo(k: number): void {
  tempo = k;
}

/** Track to go back to when a temporary track (e.g. the pause theme) ends. */
let resumeTo: TrackId | null = null;

function setTrack(id: TrackId): void {
  wanted = id;
  if (volume <= 0 || current?.id === id) return;
  stop();
  start(id);
}

/** Switches the soundtrack (cross-fades). Safe to call before audio is unlocked. */
export function playMusic(id: TrackId): void {
  resumeTo = null;
  setTrack(id);
}

/** Plays a track for a while (e.g. while paused), then `endTemporaryMusic` restores the previous one. */
export function playTemporaryMusic(id: TrackId): void {
  if (resumeTo === null) resumeTo = wanted;
  setTrack(id);
}

/** The track that is (or will be, once audio unlocks) playing. */
export const musicTrack = (): TrackId | null => wanted;

export function endTemporaryMusic(): void {
  if (resumeTo === null) return;
  const back = resumeTo;
  resumeTo = null;
  setTrack(back);
}

export function setMusicVolume(v: number): void {
  const was = volume;
  volume = v;
  const g = audioGraph();
  if (v <= 0) stop(0.3);
  else if (!current && wanted) setTrack(wanted);
  else if (current && g && was > 0) {
    const t = g.ctx.currentTime;
    current.out.gain.cancelScheduledValues(t);
    current.out.gain.setValueAtTime(VOLUME * TRACKS[current.id].gain * v, t);
  }
}

/** Pauses the music without forgetting the track (e.g. app in background). */
/** App hidden / visible again. Keeps the temporary-track state (e.g. the pause theme) intact. */
export function suspendMusic(on: boolean): void {
  if (on) {
    stop(0.2);
    return;
  }
  // Mobile browsers may suspend the audio context in the background: wake it without waiting for a tap.
  resumeAudio();
  if (volume > 0 && wanted) setTrack(wanted);
}

onAudioUnlock(() => {
  if (volume > 0 && wanted && !current) start(wanted);
});
