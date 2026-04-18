import { pl } from './pl';
import { en } from './en';

export type Locale = 'pl' | 'en';
export type Translations = typeof pl;

const dictionaries: Record<Locale, Translations> = { pl, en };

/**
 * Aktualny język interfejsu. Na razie twardo PL.
 *
 * Żeby przełączać na podstawie języka urządzenia, dodaj `expo-localization`
 * i zwróć `Localization.getLocales()[0]?.languageCode === 'en' ? 'en' : 'pl'`.
 * Żeby dać użytkownikowi ręczny wybór, trzymaj preferencję w AsyncStorage
 * i wczytaj ją tutaj (albo zrób hook `useLocale()` z reactywną wartością).
 */
export function getLocale(): Locale {
  return 'pl';
}

/**
 * Statyczny dostęp do tłumaczeń dla aktualnego języka.
 *
 * Użycie: `import { t } from '../i18n'; <Text>{t.splash.title}</Text>`
 *
 * Uwaga: wartość `t` jest rozwiązywana w momencie ładowania modułu, więc
 * żeby zmienić język w runtime, trzeba zrestartować aplikację albo
 * przepisać to na hook z React Context.
 */
export const t: Translations = dictionaries[getLocale()];
