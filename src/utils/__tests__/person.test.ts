import { describe, it, expect } from 'vitest';
import { isDeceased, hasRequiredNames, personFieldsFromForm, type PersonFormValues } from '../person';

function values(overrides: Partial<PersonFormValues> = {}): PersonFormValues {
  return {
    firstName: 'Anna',
    lastName: 'Kowalska',
    birthSurname: '',
    gender: 'female',
    birthDate: null,
    deceased: false,
    deathDate: null,
    notes: '',
    ...overrides,
  };
}

describe('isDeceased', () => {
  it('uses the explicit flag when present', () => {
    expect(isDeceased({ deceased: true, deathDate: null })).toBe(true);
    expect(isDeceased({ deceased: false, deathDate: '2020-01-01' })).toBe(false);
  });

  it('falls back to a death date for legacy data without the flag', () => {
    expect(isDeceased({ deceased: undefined, deathDate: '2020-01-01' })).toBe(true);
    expect(isDeceased({ deceased: undefined, deathDate: null })).toBe(false);
  });
});

describe('hasRequiredNames', () => {
  it('requires non-blank first and last name', () => {
    expect(hasRequiredNames({ firstName: 'Anna', lastName: 'Kowalska' })).toBe(true);
    expect(hasRequiredNames({ firstName: '  ', lastName: 'Kowalska' })).toBe(false);
    expect(hasRequiredNames({ firstName: 'Anna', lastName: '' })).toBe(false);
  });
});

describe('personFieldsFromForm', () => {
  it('trims text and coerces blank birth surname to null', () => {
    const out = personFieldsFromForm(values({ firstName: ' Anna ', lastName: ' Kowalska ', birthSurname: '  ', notes: ' hi ' }));
    expect(out.firstName).toBe('Anna');
    expect(out.lastName).toBe('Kowalska');
    expect(out.birthSurname).toBeNull();
    expect(out.notes).toBe('hi');
  });

  it('converts dates to ISO strings', () => {
    const out = personFieldsFromForm(values({ birthDate: new Date('1990-06-15T00:00:00Z'), deceased: true, deathDate: new Date('2020-03-01T00:00:00Z') }));
    expect(out.birthDate).toBe('1990-06-15');
    expect(out.deathDate).toBe('2020-03-01');
  });

  it('drops the death date when the person is marked living', () => {
    const out = personFieldsFromForm(values({ deceased: false, deathDate: new Date('2020-03-01T00:00:00Z') }));
    expect(out.deceased).toBe(false);
    expect(out.deathDate).toBeNull();
  });

  it('keeps a deceased person with an unknown death date', () => {
    const out = personFieldsFromForm(values({ deceased: true, deathDate: null }));
    expect(out.deceased).toBe(true);
    expect(out.deathDate).toBeNull();
  });
});
