import type { FamilyState, Person, ParentChildRelationship, Marriage } from '../types';

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
  if (!p || typeof p !== 'object') return `osoba #${idx}: nie jest obiektem`;
  const o = p as Record<string, unknown>;
  if (!isNonEmptyString(o.id)) return `osoba #${idx}: brak id`;
  if (typeof o.firstName !== 'string') return `osoba #${idx}: brak imienia`;
  if (typeof o.lastName !== 'string') return `osoba #${idx}: brak nazwiska`;
  if (o.gender !== 'male' && o.gender !== 'female') return `osoba #${idx}: nieprawidłowa płeć`;
  if (!isNullableString(o.birthDate)) return `osoba #${idx}: nieprawidłowa data urodzenia`;
  if (!isNullableString(o.deathDate)) return `osoba #${idx}: nieprawidłowa data śmierci`;
  if (typeof o.notes !== 'string') return `osoba #${idx}: brak notatek`;
  return null;
}

function validateParentChild(r: unknown, idx: number, ids: Set<string>): string | null {
  if (!r || typeof r !== 'object') return `relacja rodzic-dziecko #${idx}: nie jest obiektem`;
  const o = r as Record<string, unknown>;
  if (!isNonEmptyString(o.id)) return `relacja rodzic-dziecko #${idx}: brak id`;
  if (!isNonEmptyString(o.parentId)) return `relacja rodzic-dziecko #${idx}: brak parentId`;
  if (!isNonEmptyString(o.childId)) return `relacja rodzic-dziecko #${idx}: brak childId`;
  if (!ids.has(o.parentId)) return `relacja rodzic-dziecko #${idx}: parentId wskazuje nieistniejącą osobę`;
  if (!ids.has(o.childId)) return `relacja rodzic-dziecko #${idx}: childId wskazuje nieistniejącą osobę`;
  if (o.parentId === o.childId) return `relacja rodzic-dziecko #${idx}: parent i child to ta sama osoba`;
  return null;
}

function validateMarriage(m: unknown, idx: number, ids: Set<string>): string | null {
  if (!m || typeof m !== 'object') return `małżeństwo #${idx}: nie jest obiektem`;
  const o = m as Record<string, unknown>;
  if (!isNonEmptyString(o.id)) return `małżeństwo #${idx}: brak id`;
  if (!isNonEmptyString(o.spouse1Id)) return `małżeństwo #${idx}: brak spouse1Id`;
  if (!isNonEmptyString(o.spouse2Id)) return `małżeństwo #${idx}: brak spouse2Id`;
  if (!ids.has(o.spouse1Id)) return `małżeństwo #${idx}: spouse1Id wskazuje nieistniejącą osobę`;
  if (!ids.has(o.spouse2Id)) return `małżeństwo #${idx}: spouse2Id wskazuje nieistniejącą osobę`;
  if (o.spouse1Id === o.spouse2Id) return `małżeństwo #${idx}: małżonkowie to ta sama osoba`;
  if (!isNullableString(o.marriageDate)) return `małżeństwo #${idx}: nieprawidłowa data ślubu`;
  if (!isNullableString(o.divorceDate)) return `małżeństwo #${idx}: nieprawidłowa data rozwodu`;
  return null;
}

export function validateFamilyState(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Plik nie zawiera obiektu JSON.' };
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.people)) return { ok: false, error: 'Brak listy osób (people).' };
  if (!Array.isArray(o.parentChildRelationships)) return { ok: false, error: 'Brak listy relacji rodzic-dziecko.' };
  if (!Array.isArray(o.marriages)) return { ok: false, error: 'Brak listy małżeństw.' };

  const seenPersonIds = new Set<string>();
  for (let i = 0; i < o.people.length; i++) {
    const err = validatePerson(o.people[i], i);
    if (err) return { ok: false, error: err };
    const id = (o.people[i] as Person).id;
    if (seenPersonIds.has(id)) return { ok: false, error: `osoba #${i}: zduplikowane id ${id}` };
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
