import type { FamilyState, Person, ParentChildRelationship, Marriage } from '../types';
import i18n from 'i18next';

export type ValidationResult =
  | { ok: true; data: FamilyState }
  | { ok: false; error: string };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isNullableString(v: unknown): v is string | null {
  return v === null || typeof v === 'string';
}

function validatePerson(p: unknown, idx: number): string | null {
  if (!p || typeof p !== 'object') return i18n.t('validateImport.personNotObject', { i: idx });
  const o = p as Record<string, unknown>;
  if (!isNonEmptyString(o.id)) return i18n.t('validateImport.personMissingId', { i: idx });
  if (typeof o.firstName !== 'string') return i18n.t('validateImport.personMissingFirstName', { i: idx });
  if (typeof o.lastName !== 'string') return i18n.t('validateImport.personMissingLastName', { i: idx });
  if (o.gender !== 'male' && o.gender !== 'female') return i18n.t('validateImport.personInvalidGender', { i: idx });
  if (!isNullableString(o.birthDate)) return i18n.t('validateImport.personInvalidBirth', { i: idx });
  if (!isNullableString(o.deathDate)) return i18n.t('validateImport.personInvalidDeath', { i: idx });
  if (typeof o.notes !== 'string') return i18n.t('validateImport.personMissingNotes', { i: idx });
  return null;
}

function validateParentChild(r: unknown, idx: number, ids: Set<string>): string | null {
  if (!r || typeof r !== 'object') return i18n.t('validateImport.pcNotObject', { i: idx });
  const o = r as Record<string, unknown>;
  if (!isNonEmptyString(o.id)) return i18n.t('validateImport.pcMissingId', { i: idx });
  if (!isNonEmptyString(o.parentId)) return i18n.t('validateImport.pcMissingParentId', { i: idx });
  if (!isNonEmptyString(o.childId)) return i18n.t('validateImport.pcMissingChildId', { i: idx });
  if (!ids.has(o.parentId)) return i18n.t('validateImport.pcUnknownParent', { i: idx });
  if (!ids.has(o.childId)) return i18n.t('validateImport.pcUnknownChild', { i: idx });
  if (o.parentId === o.childId) return i18n.t('validateImport.pcSelfReference', { i: idx });
  return null;
}

function validateMarriage(m: unknown, idx: number, ids: Set<string>): string | null {
  if (!m || typeof m !== 'object') return i18n.t('validateImport.marNotObject', { i: idx });
  const o = m as Record<string, unknown>;
  if (!isNonEmptyString(o.id)) return i18n.t('validateImport.marMissingId', { i: idx });
  if (!isNonEmptyString(o.spouse1Id)) return i18n.t('validateImport.marMissingSpouse1', { i: idx });
  if (!isNonEmptyString(o.spouse2Id)) return i18n.t('validateImport.marMissingSpouse2', { i: idx });
  if (!ids.has(o.spouse1Id)) return i18n.t('validateImport.marUnknownSpouse1', { i: idx });
  if (!ids.has(o.spouse2Id)) return i18n.t('validateImport.marUnknownSpouse2', { i: idx });
  if (o.spouse1Id === o.spouse2Id) return i18n.t('validateImport.marSelfReference', { i: idx });
  if (!isNullableString(o.marriageDate)) return i18n.t('validateImport.marInvalidMarriageDate', { i: idx });
  if (!isNullableString(o.divorceDate)) return i18n.t('validateImport.marInvalidDivorceDate', { i: idx });
  return null;
}

export function validateFamilyState(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') return { ok: false, error: i18n.t('validateImport.rootNotObject') };
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.people)) return { ok: false, error: i18n.t('validateImport.missingPeople') };
  if (!Array.isArray(o.parentChildRelationships)) return { ok: false, error: i18n.t('validateImport.missingParentChild') };
  if (!Array.isArray(o.marriages)) return { ok: false, error: i18n.t('validateImport.missingMarriages') };

  const seenPersonIds = new Set<string>();
  for (let i = 0; i < o.people.length; i++) {
    const err = validatePerson(o.people[i], i);
    if (err) return { ok: false, error: err };
    const id = (o.people[i] as Person).id;
    if (seenPersonIds.has(id)) return { ok: false, error: i18n.t('validateImport.personDuplicateId', { i, id }) };
    seenPersonIds.add(id);
  }

  for (let i = 0; i < o.parentChildRelationships.length; i++) {
    const err = validateParentChild(o.parentChildRelationships[i], i, seenPersonIds);
    if (err) return { ok: false, error: err };
  }

  for (let i = 0; i < o.marriages.length; i++) {
    const err = validateMarriage(o.marriages[i], i, seenPersonIds);
    if (err) return { ok: false, error: err };
  }

  return {
    ok: true,
    data: {
      people: o.people as Person[],
      parentChildRelationships: o.parentChildRelationships as ParentChildRelationship[],
      marriages: o.marriages as Marriage[],
    },
  };
}
