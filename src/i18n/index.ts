import { useEffect, useState } from 'react';
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
export type Translations = typeof pl;

const dictionaries: Record<Locale, Translations> = { pl, en, de, he, nl, no, sv, da };

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

const STORAGE_KEY = 'familyTree.locale.v1';

let currentLocale: Locale = 'pl';
let currentDict: Translations = dictionaries.pl;
const listeners = new Set<() => void>();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  if (locale === currentLocale) return;
  currentLocale = locale;
  currentDict = dictionaries[locale];
  AsyncStorage.setItem(STORAGE_KEY, locale).catch(() => {});
  listeners.forEach((l) => l());
}

export async function loadStoredLocale(): Promise<Locale> {
  try {
    const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as Locale | null;
    if (stored && stored in dictionaries) {
      currentLocale = stored;
      currentDict = dictionaries[stored];
    }
  } catch {}
  return currentLocale;
}

/**
 * Reactive translations. Reads always go through the proxy to the current
 * dictionary, so calling `setLocale()` immediately changes what `t.x.y` returns.
 * Components subscribed via `useLocale()` re-render on change.
 */
export const t: Translations = new Proxy({} as Translations, {
  get: (_target, key) => currentDict[key as keyof Translations],
}) as Translations;

export function useLocale(): Locale {
  const [locale, setLocaleState] = useState<Locale>(currentLocale);
  useEffect(() => {
    const listener = () => setLocaleState(currentLocale);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return locale;
}
