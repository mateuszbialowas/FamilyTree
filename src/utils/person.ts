import type { Person } from '../types';
import { formatDateISO } from './date';

/**
 * Raw values collected by {@link PersonForm}. Dates are kept as `Date` objects
 * (the picker's native representation) and converted to ISO strings only when
 * the person is persisted — see {@link personFieldsFromForm}.
 */
export type PersonFormValues = {
  firstName: string;
  lastName: string;
  birthSurname: string;
  gender: 'male' | 'female';
  birthDate: Date | null;
  deceased: boolean;
  deathDate: Date | null;
  notes: string;
};

/**
 * Whether a person should be treated as deceased. Prefers the explicit
 * `deceased` flag; falls back to the presence of a death date for older data
 * saved before the flag existed.
 */
export function isDeceased(person: Pick<Person, 'deceased' | 'deathDate'>): boolean {
  return person.deceased ?? person.deathDate != null;
}

/** First and last name are the only required fields. */
export function hasRequiredNames(values: Pick<PersonFormValues, 'firstName' | 'lastName'>): boolean {
  return values.firstName.trim().length > 0 && values.lastName.trim().length > 0;
}

/**
 * Normalise raw form values into the persisted `Person` shape (minus `id`):
 * trims text, converts dates to ISO strings, and drops the death date when the
 * person is marked as living. The single place this mapping happens, so add and
 * edit screens stay in lockstep.
 */
export function personFieldsFromForm(values: PersonFormValues): Omit<Person, 'id'> {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    birthSurname: values.birthSurname.trim() || null,
    gender: values.gender,
    birthDate: values.birthDate ? formatDateISO(values.birthDate) : null,
    deceased: values.deceased,
    deathDate: values.deceased && values.deathDate ? formatDateISO(values.deathDate) : null,
    notes: values.notes.trim(),
  };
}
