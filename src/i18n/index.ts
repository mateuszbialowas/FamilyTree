import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { pl } from './pl';
import { en } from './en';
import { de } from './de';
import { he } from './he';
import { nl } from './nl';
import { no } from './no';
import { sv } from './sv';
import { da } from './da';

export type Locale = 'pl' | 'en' | 'de' | 'he' | 'nl' | 'no' | 'sv' | 'da';

const STORAGE_KEY = 'familyTree.locale.v1';
const DEFAULT_LOCALE: Locale = 'pl';

export const SUPPORTED_LOCALES: { code: Locale; label: string }[] = [
  { code: 'pl', label: 'Polski' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'he', label: 'עברית' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'no', label: 'Norsk' },
  { code: 'sv', label: 'Svenska' },
  { code: 'da', label: 'Dansk' },
];

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      pl: { translation: pl },
      en: { translation: en },
      de: { translation: de },
      he: { translation: he },
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
 * Read the saved locale from AsyncStorage and apply it. Awaited from App.tsx
 * before rendering so the very first paint matches the user's saved choice.
 */
export async function loadStoredLocale(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && stored !== i18n.language) {
      await i18n.changeLanguage(stored);
    }
  } catch {}
}

export async function setLocale(locale: Locale): Promise<void> {
  await i18n.changeLanguage(locale);
}

export function getLocale(): Locale {
  return (i18n.language as Locale) ?? DEFAULT_LOCALE;
}

export default i18n;
