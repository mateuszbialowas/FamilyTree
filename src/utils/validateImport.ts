import type { FamilyState, Person, ParentChildRelationship, Marriage } from '../types';
import { t } from '../i18n';

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
  const v = t.validateImport;
  if (!p || typeof p !== 'object') return v.personNotObject(idx);
  const o = p as Record<string, unknown>;
  if (!isNonEmptyString(o.id)) return v.personMissingId(idx);
  if (typeof o.firstName !== 'string') return v.personMissingFirstName(idx);
  if (typeof o.lastName !== 'string') return v.personMissingLastName(idx);
  if (o.gender !== 'male' && o.gender !== 'female') return v.personInvalidGender(idx);
  if (!isNullableString(o.birthDate)) return v.personInvalidBirth(idx);
  if (!isNullableString(o.deathDate)) return v.personInvalidDeath(idx);
  if (typeof o.notes !== 'string') return v.personMissingNotes(idx);
  return null;
}

function validateParentChild(r: unknown, idx: number, ids: Set<string>): string | null {
  const v = t.validateImport;
  if (!r || typeof r !== 'object') return v.pcNotObject(idx);
  const o = r as Record<string, unknown>;
  if (!isNonEmptyString(o.id)) return v.pcMissingId(idx);
  if (!isNonEmptyString(o.parentId)) return v.pcMissingParentId(idx);
  if (!isNonEmptyString(o.childId)) return v.pcMissingChildId(idx);
  if (!ids.has(o.parentId)) return v.pcUnknownParent(idx);
  if (!ids.has(o.childId)) return v.pcUnknownChild(idx);
  if (o.parentId === o.childId) return v.pcSelfReference(idx);
  return null;
}

function validateMarriage(m: unknown, idx: number, ids: Set<string>): string | null {
  const v = t.validateImport;
  if (!m || typeof m !== 'object') return v.marNotObject(idx);
  const o = m as Record<string, unknown>;
  if (!isNonEmptyString(o.id)) return v.marMissingId(idx);
  if (!isNonEmptyString(o.spouse1Id)) return v.marMissingSpouse1(idx);
  if (!isNonEmptyString(o.spouse2Id)) return v.marMissingSpouse2(idx);
  if (!ids.has(o.spouse1Id)) return v.marUnknownSpouse1(idx);
  if (!ids.has(o.spouse2Id)) return v.marUnknownSpouse2(idx);
  if (o.spouse1Id === o.spouse2Id) return v.marSelfReference(idx);
  if (!isNullableString(o.marriageDate)) return v.marInvalidMarriageDate(idx);
  if (!isNullableString(o.divorceDate)) return v.marInvalidDivorceDate(idx);
  return null;
}

export function validateFamilyState(raw: unknown): ValidationResult {
  const v = t.validateImport;
  if (!raw || typeof raw !== 'object') return { ok: false, error: v.rootNotObject };
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.people)) return { ok: false, error: v.missingPeople };
  if (!Array.isArray(o.parentChildRelationships)) return { ok: false, error: v.missingParentChild };
  if (!Array.isArray(o.marriages)) return { ok: false, error: v.missingMarriages };

  const seenPersonIds = new Set<string>();
  for (let i = 0; i < o.people.length; i++) {
    const err = validatePerson(o.people[i], i);
    if (err) return { ok: false, error: err };
    const id = (o.people[i] as Person).id;
    if (seenPersonIds.has(id)) return { ok: false, error: v.personDuplicateId(i, id) };
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
