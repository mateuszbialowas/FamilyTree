import { describe, it, expect } from 'vitest';
import { parentChildExists, marriageExists } from '../relationships';
import type { FamilyState } from '../../types';

const state: FamilyState = {
  people: [],
  parentChildRelationships: [{ id: 'r1', parentId: 'a', childId: 'b' }],
  marriages: [{ id: 'm1', spouse1Id: 'x', spouse2Id: 'y', marriageDate: null, divorceDate: null }],
};

describe('parentChildExists', () => {
  it('matches on the exact parent→child direction', () => {
    expect(parentChildExists(state, 'a', 'b')).toBe(true);
  });

  it('is direction-sensitive', () => {
    expect(parentChildExists(state, 'b', 'a')).toBe(false);
  });
});

describe('marriageExists', () => {
  it('matches regardless of spouse order', () => {
    expect(marriageExists(state, 'x', 'y')).toBe(true);
    expect(marriageExists(state, 'y', 'x')).toBe(true);
  });

  it('returns false for unrelated people', () => {
    expect(marriageExists(state, 'x', 'z')).toBe(false);
  });
});
