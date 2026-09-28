import { load, store } from '../core/save';

export interface Settings {
  /** Volumes from 0 (off) to 1. */
  sfxVolume: number;
  musicVolume: number;
  speed: number;
  reduceMotion: boolean;
  haptics: boolean;
  locale: string;
  seenTutorial: boolean;
  /** Cards enter on the right and travel left (the default is left to right). Applies from the next fight. */
  rightToLeft: boolean;
}

const defaults: Settings = {
  sfxVolume: 0.5,
  musicVolume: 0.5,
  speed: 1,
  reduceMotion: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  haptics: true,
  locale: 'en',
  seenTutorial: false,
  rightToLeft: false,
};

export const settings: Settings = load('settings', defaults);
// Saved data is untrusted: volumes must be numbers in range.
for (const k of ['sfxVolume', 'musicVolume'] as const) {
  const v = settings[k];
  settings[k] = typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : defaults[k];
}

export function saveSettings(): void {
  store('settings', settings);
}
