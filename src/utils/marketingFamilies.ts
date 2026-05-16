import type { Locale } from '../i18n';
import type { FamilyState } from '../types';

import pl from '../../assets/marketing-families/pl.json';
import en from '../../assets/marketing-families/en.json';
import de from '../../assets/marketing-families/de.json';
import nl from '../../assets/marketing-families/nl.json';
import no from '../../assets/marketing-families/no.json';
import sv from '../../assets/marketing-families/sv.json';
import da from '../../assets/marketing-families/da.json';

const families: Record<Locale, FamilyState> = {
  pl: pl as FamilyState,
  en: en as FamilyState,
  de: de as FamilyState,
  nl: nl as FamilyState,
  no: no as FamilyState,
  sv: sv as FamilyState,
  da: da as FamilyState,
};

export function getMarketingFamily(locale: Locale): FamilyState {
  return families[locale];
}
