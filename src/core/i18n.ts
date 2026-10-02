import en, { type EnKey } from '../i18n/en';
import it from '../i18n/it';

export type Dict = Record<string, string>;

/**
 * Prefixes of ids built at runtime (e.g. `card.${id}.name`); they are checked by tests/content.test.ts.
 * Any other key must be a literal id from en.ts, so a typo fails the typecheck.
 */
type DynamicPrefix =
  | 'card'
  | 'enemy'
  | 'move'
  | 'status'
  | 'kw'
  | 'hero'
  | 'type'
  | 'rarity'
  | 'journey.node'
  | 'journey.actName'
  | 'howto'
  | 'compendium'
  | 'intent'
  | 'perk'
  | 'relic'
  | 'memo'
  | 'hex';
export type TKey = EnKey | `${DynamicPrefix}.${string}`;
export type Params = Record<string, string | number>;

/** Registered locales. Add a new language by creating `src/i18n/<code>.ts` and registering it here. */
const locales: Record<string, { name: string; dict: Dict }> = {
  en: { name: 'English', dict: en as Dict },
  it: { name: 'Italiano', dict: it },
};

let current = 'en';
const fallback = 'en';

export const availableLocales = (): { code: string; name: string }[] => Object.entries(locales).map(([code, l]) => ({ code, name: l.name }));

export function setLocale(code: string): void {
  if (locales[code]) {
    current = code;
    document.documentElement.lang = code;
  }
}

export const getLocale = (): string => current;

/** Numbers that rules text quotes as `{$name}` (see `data/values.ts`): the game registers them once at boot. */
let values: Params = {};
export const setStringValues = (v: Params): void => {
  values = v;
};

/**
 * Translates `key`, interpolating `{name}` params and the game's named `{$value}`s.
 * Plurals: `{n|card|cards}` picks a form through Intl.PluralRules for the param `n`.
 */
export function t(key: TKey, params?: Params): string {
  let s = locales[current].dict[key] ?? locales[fallback].dict[key];
  if (s === undefined) {
    if (import.meta.env?.DEV) console.warn(`[i18n] missing key: ${key}`);
    return key;
  }
  s = s.replace(/\{\$(\w+)\}/g, (m, name: string) => {
    if (name in values) return String(values[name]);
    if (import.meta.env?.DEV) console.warn(`[i18n] unknown value ${m} in ${key}`);
    return m;
  });
  if (!params) return s;
  const rules = new Intl.PluralRules(current);
  s = s.replace(/\{(\w+)\|([^|}]*)\|([^}]*)\}/g, (_, p: string, one: string, other: string) =>
    rules.select(Number(params[p])) === 'one' ? one : other,
  );
  return s.replace(/\{(\w+)\}/g, (m, p: string) => (p in params ? String(params[p]) : m));
}
