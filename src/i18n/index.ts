import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import { pl } from './pl';
import { en } from './en';
import { de } from './de';
import { nl } from './nl';
import { no } from './no';
import { sv } from './sv';
import { da } from './da';

export type Locale = 'pl' | 'en' | 'de' | 'nl' | 'no' | 'sv' | 'da';

const STORAGE_KEY = 'familyTree.locale.v1';
/**
 * Used by i18next as the *fallback* locale. Cold-start picks the
 * device locale first (see loadStoredLocale); this only kicks in when
 * the device language isn't one of the seven we support.
 */
const DEFAULT_LOCALE: Locale = 'en';

export const SUPPORTED_LOCALES: { code: Locale; label: string }[] = [
  { code: 'pl', label: 'Polski' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'no', label: 'Norsk' },
  { code: 'sv', label: 'Svenska' },
  { code: 'da', label: 'Dansk' },
];

/** Bare locale codes derived from `SUPPORTED_LOCALES` — used for runtime validation. */
export const SUPPORTED_LOCALE_CODES: readonly Locale[] = SUPPORTED_LOCALES.map((l) => l.code);

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      pl: { translation: pl },
      en: { translation: en },
      de: { translation: de },
      nl: { translation: nl },
      no: { translation: no },
      sv: { translation: sv },
      da: { translation: da },
    },
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

// Persist locale on every change.
i18n.on('languageChanged', (lng) => {
  AsyncStorage.setItem(STORAGE_KEY, lng).catch(() => {});
});

/**
 * Resolve the initial locale and apply it. Awaited from App.tsx before
 * rendering so the very first paint matches the user's expected language.
 *
 * Priority (first match wins):
 *   1. Locale stored in AsyncStorage (= the user's last manual choice).
 *   2. First supported language among the device's preferred locales
 *      (iOS Settings → General → Language & Region returns an ordered
 *      list; the user's primary system language comes first).
 *   3. DEFAULT_LOCALE ('en') — fallback for unsupported device languages.
 */
export async function loadStoredLocale(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALE_CODES.includes(stored as Locale)) {
      if (stored !== i18n.language) await i18n.changeLanguage(stored);
      return;
    }

    for (const dl of Localization.getLocales()) {
      const code = dl.languageCode as Locale | null;
      if (code && SUPPORTED_LOCALE_CODES.includes(code)) {
        if (code !== i18n.language) await i18n.changeLanguage(code);
        return;
      }
    }

    if (i18n.language !== DEFAULT_LOCALE) await i18n.changeLanguage(DEFAULT_LOCALE);
  } catch {}
}

export async function setLocale(locale: Locale): Promise<void> {
  await i18n.changeLanguage(locale);
}

export function getLocale(): Locale {
  return (i18n.language as Locale) ?? DEFAULT_LOCALE;
}

export default i18n;
