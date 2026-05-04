import type { Locale } from '../i18n';
import type { FamilyState } from '../types';

import pl from '../../assets/sample-families/pl.json';
import en from '../../assets/sample-families/en.json';
import de from '../../assets/sample-families/de.json';
import he from '../../assets/sample-families/he.json';
import nl from '../../assets/sample-families/nl.json';
import no from '../../assets/sample-families/no.json';
import sv from '../../assets/sample-families/sv.json';
import da from '../../assets/sample-families/da.json';

const families: Record<Locale, FamilyState> = {
  pl: pl as FamilyState,
  en: en as FamilyState,
  de: de as FamilyState,
  he: he as FamilyState,
  nl: nl as FamilyState,
  no: no as FamilyState,
  sv: sv as FamilyState,
  da: da as FamilyState,
};

export function getSampleFamily(locale: Locale): FamilyState {
  return families[locale];
}
