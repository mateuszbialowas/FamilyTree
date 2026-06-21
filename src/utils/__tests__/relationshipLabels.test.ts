import { describe, it, expect } from 'vitest';
import { computeRelationshipLabels } from '../relationshipLabels';
import type { FamilyState, Person } from '../../types';

function person(
  id: string,
  firstName: string,
  lastName: string,
  gender: 'male' | 'female' = 'male',
): Person {
  return { id, firstName, lastName, gender, birthDate: null, deathDate: null, notes: '' };
}

describe('computeRelationshipLabels', () => {
  it('labels parents, grandparents, great-grandparents ascending chain', () => {
    const state: FamilyState = {
      people: [
        person('p-mateusz', 'Mateusz', 'Białowąs', 'male'),
        person('p-wieslaw', 'Wiesław', 'Białowąs', 'male'),
        person('p-stefan', 'Stefan', 'Białowąs', 'male'),
        person('p-andrzej', 'Andrzej', 'Białowąs', 'male'),
        person('p-tomasz', 'Tomasz', 'Białowąs', 'male'),
      ],
      parentChildRelationships: [
        { id: 'r1', parentId: 'p-wieslaw', childId: 'p-mateusz' },
        { id: 'r2', parentId: 'p-stefan', childId: 'p-wieslaw' },
        { id: 'r3', parentId: 'p-andrzej', childId: 'p-stefan' },
        { id: 'r4', parentId: 'p-tomasz', childId: 'p-andrzej' },
      ],
      marriages: [],
    };
    const labels = computeRelationshipLabels('p-mateusz', state);
    expect(labels.get('p-wieslaw')).toBe('Ojciec');
    expect(labels.get('p-stefan')).toBe('Dziadek');
    expect(labels.get('p-andrzej')).toBe('Pradziadek');
    expect(labels.get('p-tomasz')).toBe('PraPradziadek');
  });

  it('labels spouse-of-ancestor with same generational suffix as ancestor (regression)', () => {
    // Great-great-grandfather Andrzej is married to Jadwiga.
    // Andrzej → PraPradziadek. Jadwiga (his wife) should → PraPrababcia,
    // NOT "Ciocia" (which was the bug when path=['up','up','up','up','spouse']
    // matched the "great-uncle's spouse" branch).
    const state: FamilyState = {
      people: [
        person('p-mateusz', 'Mateusz', 'Białowąs', 'male'),
        person('p-wieslaw', 'Wiesław', 'Białowąs', 'male'),
        person('p-stefan', 'Stefan', 'Białowąs', 'male'),
        person('p-hhduf', 'Hubert', 'Białowąs', 'male'),
        person('p-andrzej', 'Andrzej', 'Białowąs', 'male'),
        person('p-jadwiga', 'Jadwiga', 'Białowąs', 'female'),
      ],
      parentChildRelationships: [
        { id: 'r1', parentId: 'p-wieslaw', childId: 'p-mateusz' },
        { id: 'r2', parentId: 'p-stefan', childId: 'p-wieslaw' },
        { id: 'r3', parentId: 'p-hhduf', childId: 'p-stefan' },
        { id: 'r4', parentId: 'p-andrzej', childId: 'p-hhduf' },
      ],
      marriages: [
        { id: 'm1', spouse1Id: 'p-andrzej', spouse2Id: 'p-jadwiga', marriageDate: null, divorceDate: null },
      ],
    };
    const labels = computeRelationshipLabels('p-mateusz', state);
    expect(labels.get('p-andrzej')).toBe('PraPradziadek');
    expect(labels.get('p-jadwiga')).toBe('PraPrababcia');
  });

  it('labels uncle/aunt (parent\'s sibling) — not spouse-of-ancestor', () => {
    const state: FamilyState = {
      people: [
        person('p-mateusz', 'Mateusz', 'Białowąs', 'male'),
        person('p-wieslaw', 'Wiesław', 'Białowąs', 'male'),
        person('p-stefan', 'Stefan', 'Białowąs', 'male'),
        person('p-marek', 'Marek', 'Białowąs', 'male'),
        person('p-halina', 'Halina', 'Białowąs', 'female'),
      ],
      parentChildRelationships: [
        { id: 'r1', parentId: 'p-wieslaw', childId: 'p-mateusz' },
        { id: 'r2', parentId: 'p-stefan', childId: 'p-wieslaw' },
        { id: 'r3', parentId: 'p-stefan', childId: 'p-marek' },
        { id: 'r4', parentId: 'p-stefan', childId: 'p-halina' },
      ],
      marriages: [],
    };
    const labels = computeRelationshipLabels('p-mateusz', state);
    expect(labels.get('p-marek')).toBe('Wuj');
    expect(labels.get('p-halina')).toBe('Ciotka');
  });

  it('labels spouse-of-uncle/aunt as Wujek/Ciocia', () => {
    const state: FamilyState = {
      people: [
        person('p-mateusz', 'Mateusz', 'Białowąs', 'male'),
        person('p-wieslaw', 'Wiesław', 'Białowąs', 'male'),
        person('p-stefan', 'Stefan', 'Białowąs', 'male'),
        person('p-marek', 'Marek', 'Białowąs', 'male'),
        person('p-ewa', 'Ewa', 'Białowąs', 'female'),
      ],
      parentChildRelationships: [
        { id: 'r1', parentId: 'p-wieslaw', childId: 'p-mateusz' },
        { id: 'r2', parentId: 'p-stefan', childId: 'p-wieslaw' },
        { id: 'r3', parentId: 'p-stefan', childId: 'p-marek' },
      ],
      marriages: [
        { id: 'm1', spouse1Id: 'p-marek', spouse2Id: 'p-ewa', marriageDate: null, divorceDate: null },
      ],
    };
    const labels = computeRelationshipLabels('p-mateusz', state);
    expect(labels.get('p-marek')).toBe('Wuj');
    expect(labels.get('p-ewa')).toBe('Ciocia');
  });

  it('close-only mode drops distant cousins but keeps close family', () => {
    // me ← parent ← grandparent ← great-grandparent (GGP)
    // GGP also → grand-uncle → parent's-cousin → 2nd cousin (6 steps from me)
    // grandparent also → aunt → 1st cousin (4 steps from me)
    const state: FamilyState = {
      people: [
        person('me', 'Ja', 'X'),
        person('par', 'Rodzic', 'X'),
        person('gpar', 'Dziadek', 'X'),
        person('ggp', 'Pradziadek', 'X'),
        person('aunt', 'Ciotka', 'X', 'female'),
        person('cousin1', 'Kuzyn', 'X'),
        person('guncle', 'Stryj', 'X'),
        person('parcousin', 'KuzynRodzica', 'X'),
        person('cousin2', 'DalekiKuzyn', 'X'),
      ],
      parentChildRelationships: [
        { id: 'a', parentId: 'par', childId: 'me' },
        { id: 'b', parentId: 'gpar', childId: 'par' },
        { id: 'c', parentId: 'ggp', childId: 'gpar' },
        { id: 'd', parentId: 'gpar', childId: 'aunt' },
        { id: 'e', parentId: 'aunt', childId: 'cousin1' },
        { id: 'f', parentId: 'ggp', childId: 'guncle' },
        { id: 'g', parentId: 'guncle', childId: 'parcousin' },
        { id: 'h', parentId: 'parcousin', childId: 'cousin2' },
      ],
      marriages: [],
    };
    // Unbounded: the distant 2nd cousin still gets a label.
    const full = computeRelationshipLabels('me', state);
    expect(full.get('cousin2')).toBeTruthy();

    // Close-only (as the tree uses): parent + first cousin labelled,
    // distant 2nd cousin and parent's-cousin are not.
    const close = computeRelationshipLabels('me', state, 'colloquial', {
      maxSteps: 4,
      maxSpouseSteps: 1,
    });
    expect(close.get('par')).toBeTruthy();
    expect(close.get('cousin1')).toBeTruthy(); // first cousin (4 steps) kept
    expect(close.get('cousin2')).toBeUndefined(); // 2nd cousin (6 steps) dropped
    expect(close.get('parcousin')).toBeUndefined(); // 5 steps dropped
  });
});
