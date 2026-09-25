import type { AppLanguage } from '@/stores/appLanguageStore';

/**
 * English is the source of truth: every other language must define every key,
 * so a missing translation is a type error rather than blank text.
 */
export function defineStrings<T extends Record<string, string>>(
  en: T,
  others: Record<Exclude<AppLanguage, 'en'>, Record<keyof T, string>>,
): Record<AppLanguage, Record<keyof T, string>> {
  return { en, ...others };
}
