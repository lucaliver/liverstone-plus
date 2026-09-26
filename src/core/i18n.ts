import en from '../i18n/en';

export type Dict = Record<string, string>;
export type Params = Record<string, string | number>;

/** Registered locales. Add a new language by creating `src/i18n/<code>.ts` and registering it here. */
const locales: Record<string, { name: string; dict: Dict }> = {
  en: { name: 'English', dict: en },
};

let current = 'en';
const fallback = 'en';

export const availableLocales = (): { code: string; name: string }[] =>
  Object.entries(locales).map(([code, l]) => ({ code, name: l.name }));

export function setLocale(code: string): void {
  if (locales[code]) {
    current = code;
    document.documentElement.lang = code;
  }
}

export const getLocale = (): string => current;

/**
 * Translates `key`, interpolating `{name}` params.
 * Plurals: `{n|card|cards}` picks a form through Intl.PluralRules for the param `n`.
 */
export function t(key: string, params?: Params): string {
  let s = locales[current].dict[key] ?? locales[fallback].dict[key];
  if (s === undefined) {
    if (import.meta.env?.DEV) console.warn(`[i18n] missing key: ${key}`);
    return key;
  }
  if (!params) return s;
  const rules = new Intl.PluralRules(current);
  s = s.replace(/\{(\w+)\|([^|}]*)\|([^}]*)\}/g, (_, p: string, one: string, other: string) =>
    rules.select(Number(params[p])) === 'one' ? one : other,
  );
  return s.replace(/\{(\w+)\}/g, (m, p: string) => (p in params ? String(params[p]) : m));
}
