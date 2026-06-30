import { describe, it, expect } from 'vitest';
import { familyReducer } from '../familyReducers';
import { siblingGroup, compareSiblings } from '../../utils/siblingOrder';
import type { FamilyState, Person } from '../../types';

function person(id: string, birthDate: string | null): Person {
  return { id, firstName: id, lastName: 'X', gender: 'male', birthDate, deathDate: null, notes: '' };
}

/** Parent P with three children, born oldest→youngest a < b < c. */
function family(): FamilyState {
  return {
    people: [
      person('P', '1960-01-01'),
      person('a', '1990-01-01'),
      person('b', '1992-01-01'),
      person('c', '1994-01-01'),
    ],
    parentChildRelationships: [
      { id: 'r1', parentId: 'P', childId: 'a' },
      { id: 'r2', parentId: 'P', childId: 'b' },
      { id: 'r3', parentId: 'P', childId: 'c' },
    ],
    marriages: [],
  };
}

const ids = (s: FamilyState, anyChild: string) => siblingGroup(anyChild, s).map(p => p.id);

describe('compareSiblings', () => {
  it('orders by birth date, undated last, manualOrder wins', () => {
    const dated = [person('y', '2000-01-01'), person('x', '1990-01-01')].sort(compareSiblings);
    expect(dated.map(p => p.id)).toEqual(['x', 'y']);

    const undatedLast = [person('u', null), person('d', '1990-01-01')].sort(compareSiblings);
    expect(undatedLast.map(p => p.id)).toEqual(['d', 'u']);

    const manual = [
      { ...person('late', '1980-01-01'), manualOrder: 1 },
      { ...person('early', '1995-01-01'), manualOrder: 0 },
    ].sort(compareSiblings);
    expect(manual.map(p => p.id)).toEqual(['early', 'late']);
  });
});

describe('REORDER_SIBLING', () => {
  it('default order is birth order (oldest left)', () => {
    expect(ids(family(), 'a')).toEqual(['a', 'b', 'c']);
  });

  it('moving right swaps with the right neighbour and freezes the group order', () => {
    const next = familyReducer(family(), { type: 'REORDER_SIBLING', payload: { personId: 'a', direction: 'right' } });
    expect(ids(next, 'a')).toEqual(['b', 'a', 'c']);
    // whole group gets an explicit manualOrder 0..n-1
    const order = (id: string) => next.people.find(p => p.id === id)!.manualOrder;
    expect([order('b'), order('a'), order('c')]).toEqual([0, 1, 2]);
  });

  it('moving left mirrors moving right', () => {
    const next = familyReducer(family(), { type: 'REORDER_SIBLING', payload: { personId: 'c', direction: 'left' } });
    expect(ids(next, 'c')).toEqual(['a', 'c', 'b']);
  });

  it('reorders compose — two moves land the person where expected', () => {
    let s = family();
    s = familyReducer(s, { type: 'REORDER_SIBLING', payload: { personId: 'c', direction: 'left' } }); // a c b
    s = familyReducer(s, { type: 'REORDER_SIBLING', payload: { personId: 'c', direction: 'left' } }); // c a b
    expect(ids(s, 'c')).toEqual(['c', 'a', 'b']);
  });

  it('moving past the edge is a no-op (same reference ⇒ no history entry)', () => {
    const s = family();
    expect(familyReducer(s, { type: 'REORDER_SIBLING', payload: { personId: 'a', direction: 'left' } })).toBe(s);
    expect(familyReducer(s, { type: 'REORDER_SIBLING', payload: { personId: 'c', direction: 'right' } })).toBe(s);
  });

  it('unknown person is a no-op', () => {
    const s = family();
    expect(familyReducer(s, { type: 'REORDER_SIBLING', payload: { personId: 'ghost', direction: 'left' } })).toBe(s);
  });
});

describe('PLACE_NEW_SIBLING', () => {
  // a,b,c hand-arranged (manualOrder 0,1,2); newcomer d born between a and b.
  function withManualOrderPlusNew(): FamilyState {
    return {
      people: [
        person('P', '1960-01-01'),
        { ...person('a', '1990-01-01'), manualOrder: 0 },
        { ...person('b', '1992-01-01'), manualOrder: 1 },
        { ...person('c', '1994-01-01'), manualOrder: 2 },
        person('d', '1991-01-01'), // freshly added, no manualOrder
      ],
      parentChildRelationships: [
        { id: 'r1', parentId: 'P', childId: 'a' },
        { id: 'r2', parentId: 'P', childId: 'b' },
        { id: 'r3', parentId: 'P', childId: 'c' },
        { id: 'r4', parentId: 'P', childId: 'd' },
      ],
      marriages: [],
    };
  }

  it('slots a new dated sibling into a hand-arranged group by birth date', () => {
    const next = familyReducer(withManualOrderPlusNew(), { type: 'PLACE_NEW_SIBLING', payload: { personId: 'd' } });
    expect(ids(next, 'a')).toEqual(['a', 'd', 'b', 'c']); // d between a(1990) and b(1992)
    expect(next.people.find(p => p.id === 'd')!.manualOrder).toBe(1);
  });

  it('is a no-op when the group is not hand-arranged (birthDate handles it)', () => {
    // No manualOrder anywhere; add d. Reducer leaves it alone (same ref) and
    // compareSiblings already orders by birth date.
    const s: FamilyState = {
      ...family(),
      people: [...family().people, person('d', '1991-01-01')],
      parentChildRelationships: [...family().parentChildRelationships, { id: 'r4', parentId: 'P', childId: 'd' }],
    };
    expect(familyReducer(s, { type: 'PLACE_NEW_SIBLING', payload: { personId: 'd' } })).toBe(s);
    expect(ids(s, 'a')).toEqual(['a', 'd', 'b', 'c']); // already correct by birthDate
  });

  it('an undated newcomer stays at the end of a hand-arranged group', () => {
    const base = withManualOrderPlusNew();
    base.people = base.people.map(p => p.id === 'd' ? { ...p, birthDate: null } : p);
    const next = familyReducer(base, { type: 'PLACE_NEW_SIBLING', payload: { personId: 'd' } });
    expect(ids(next, 'a')).toEqual(['a', 'b', 'c', 'd']);
  });
});
