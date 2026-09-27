import { load, store } from '../core/save';

export interface Settings {
  sound: boolean;
  music: boolean;
  speed: number;
  reduceMotion: boolean;
  haptics: boolean;
  locale: string;
  seenTutorial: boolean;
  /** Experimental: two belt rows, a bit slower. Applies from the next fight. Hidden from the settings for now. */
  twoRowBelt: boolean;
  /** Experimental: cards enter on the left and travel right. Applies from the next fight. */
  reverseBelt: boolean;
}

const defaults: Settings = {
  sound: true,
  music: true,
  speed: 1,
  reduceMotion: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  haptics: true,
  locale: 'en',
  seenTutorial: false,
  twoRowBelt: false,
  reverseBelt: false,
};

export const settings: Settings = load('settings', defaults);

export function saveSettings(): void {
  store('settings', settings);
}
