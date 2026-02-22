import type { FamilyState, Person, ParentChildRelationship, Marriage } from '../types';

export function getParents(personId: string, state: FamilyState): Person[] {
  const parentIds = state.parentChildRelationships
    .filter((r) => r.childId === personId)
    .map((r) => r.parentId);
  return state.people.filter((p) => parentIds.includes(p.id));
}

export function getChildren(personId: string, state: FamilyState): Person[] {
  const childIds = state.parentChildRelationships
    .filter((r) => r.parentId === personId)
    .map((r) => r.childId);
  return state.people.filter((p) => childIds.includes(p.id));
}

export function getSpouses(personId: string, state: FamilyState): { person: Person; marriage: Marriage }[] {
  const marriages = state.marriages.filter(
    (m) => m.spouse1Id === personId || m.spouse2Id === personId
  );
  return marriages
    .map((m) => {
      const spouseId = m.spouse1Id === personId ? m.spouse2Id : m.spouse1Id;
      const person = state.people.find((p) => p.id === spouseId);
      return person ? { person, marriage: m } : null;
    })
    .filter(Boolean) as { person: Person; marriage: Marriage }[];
}

export function getSiblings(personId: string, state: FamilyState): Person[] {
  const parentIds = state.parentChildRelationships
    .filter((r) => r.childId === personId)
    .map((r) => r.parentId);
  if (parentIds.length === 0) return [];

  const siblingIds = new Set<string>();
  for (const parentId of parentIds) {
    state.parentChildRelationships
      .filter((r) => r.parentId === parentId && r.childId !== personId)
      .forEach((r) => siblingIds.add(r.childId));
  }
  return state.people.filter((p) => siblingIds.has(p.id));
}

export function getGrandparents(personId: string, state: FamilyState): Person[] {
  const parents = getParents(personId, state);
  const grandparents = new Set<string>();
  for (const parent of parents) {
    getParents(parent.id, state).forEach((gp) => grandparents.add(gp.id));
  }
  return state.people.filter((p) => grandparents.has(p.id));
}

export function getGrandchildren(personId: string, state: FamilyState): Person[] {
  const children = getChildren(personId, state);
  const grandchildren = new Set<string>();
  for (const child of children) {
    getChildren(child.id, state).forEach((gc) => grandchildren.add(gc.id));
  }
  return state.people.filter((p) => grandchildren.has(p.id));
}

export function getRelationshipsForPerson(
  personId: string,
  state: FamilyState
): {
  parentChildIds: string[];
  marriageIds: string[];
} {
  const parentChildIds = state.parentChildRelationships
    .filter((r) => r.parentId === personId || r.childId === personId)
    .map((r) => r.id);
  const marriageIds = state.marriages
    .filter((m) => m.spouse1Id === personId || m.spouse2Id === personId)
    .map((m) => m.id);
  return { parentChildIds, marriageIds };
}
