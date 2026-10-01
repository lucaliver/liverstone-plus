import { load, store } from '../core/save';
import { GAME_SPEEDS } from '../data/config';

export interface Settings {
  /** Volumes from 0 (off) to 1. */
  sfxVolume: number;
  musicVolume: number;
  speed: number;
  reduceMotion: boolean;
  haptics: boolean;
  locale: string;
  seenTutorial: boolean;
  /** Cards whose first-time tip (`CardDef.tip`) has been shown. */
  seenTips: string[];
  /** Cards enter on the right and travel left (the default is left to right). Applies from the next fight. */
  rightToLeft: boolean;
  /** Shows the floating debug buttons (title, fight, map). */
  debugMenus: boolean;
}

const defaults: Settings = {
  sfxVolume: 0.5,
  musicVolume: 0.5,
  speed: 1,
  reduceMotion: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  haptics: true,
  locale: 'en',
  seenTutorial: false,
  seenTips: [],
  rightToLeft: false,
  debugMenus: false,
};

export const settings: Settings = load('settings', defaults);
// Saved data is untrusted: volumes must be numbers in range.
for (const k of ['sfxVolume', 'musicVolume'] as const) {
  const v = settings[k];
  settings[k] = typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : defaults[k];
}

for (const k of ['reduceMotion', 'haptics', 'seenTutorial', 'rightToLeft', 'debugMenus'] as const)
  if (typeof settings[k] !== 'boolean') settings[k] = defaults[k];
if (!GAME_SPEEDS.some((s) => s === settings.speed)) settings.speed = defaults.speed;
if (typeof settings.locale !== 'string') settings.locale = defaults.locale;
if (!Array.isArray(settings.seenTips) || settings.seenTips.some((id) => typeof id !== 'string')) settings.seenTips = [];

export function saveSettings(): void {
  store('settings', settings);
}
