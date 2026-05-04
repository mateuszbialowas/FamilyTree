/**
 * Type augmentation for react-i18next so `t('a.b.c')` is autocompleted
 * and typo-checked against the Polish dictionary (the source of truth).
 *
 * See https://react.i18next.com/latest/typescript
 */
import 'react-i18next';
import type { pl } from './pl';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof pl;
    };
  }
}
