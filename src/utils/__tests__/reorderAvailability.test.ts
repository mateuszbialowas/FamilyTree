import { describe, it, expect } from 'vitest';
import { isNodeReorderable } from '../reorderAvailability';
import type { FamilyState, Person } from '../../types';

function person(id: string, birthDate: string | null = null): Person {
  return { id, firstName: id, lastName: 'X', gender: 'male', birthDate, deathDate: null, notes: '' };
}

// Couple root (mateusz+joanna); mateusz's brothers hang under his parents,
// joanna's family on the other side — the structure where a married root is
// pinned to the edge of its sibling row.
const state: FamilyState = {
  people: [
    person('jan', '1985-06-30'), person('ewelina'),
    person('mateusz', '1990-08-31'), person('kuba'), person('piotrek'),
    person('joanna', '1992-03-14'),
    person('marek', '1942-09-01'), person('barbara', '1944-04-22'), person('kasia', '1994-07-07'),
  ],
  parentChildRelationships: [
    { id: 'r1', parentId: 'jan', childId: 'mateusz' },
    { id: 'r2', parentId: 'jan', childId: 'kuba' },
    { id: 'r3', parentId: 'jan', childId: 'piotrek' },
    { id: 'r4', parentId: 'ewelina', childId: 'mateusz' },
    { id: 'r5', parentId: 'ewelina', childId: 'kuba' },
    { id: 'r6', parentId: 'ewelina', childId: 'piotrek' },
    { id: 'r7', parentId: 'marek', childId: 'joanna' },
    { id: 'r8', parentId: 'marek', childId: 'kasia' },
    { id: 'r9', parentId: 'barbara', childId: 'joanna' },
    { id: 'r10', parentId: 'barbara', childId: 'kasia' },
  ],
  marriages: [
    { id: 'm1', spouse1Id: 'mateusz', spouse2Id: 'joanna', marriageDate: null, divorceDate: null },
    { id: 'm2', spouse1Id: 'jan', spouse2Id: 'ewelina', marriageDate: null, divorceDate: null },
    { id: 'm3', spouse1Id: 'marek', spouse2Id: 'barbara', marriageDate: null, divorceDate: null },
  ],
};

describe('isNodeReorderable', () => {
  it('locks a married root — neither direction would move the tree', () => {
    expect(isNodeReorderable('mateusz', 'mateusz', state)).toBe(false);
  });

  it('allows moving a non-root sibling', () => {
    expect(isNodeReorderable('kuba', 'mateusz', state)).toBe(true);
  });

  it('reports a person with no siblings as not movable', () => {
    const solo: FamilyState = { people: [person('only')], parentChildRelationships: [], marriages: [] };
    expect(isNodeReorderable('only', 'only', solo)).toBe(false);
  });

  it('returns false with no root', () => {
    expect(isNodeReorderable('kuba', null, state)).toBe(false);
  });
});
