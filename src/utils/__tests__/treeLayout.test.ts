import { describe, it, expect } from 'vitest';
import { computeUnifiedLayout, COUPLE_SPACING } from '../treeLayout';
import type { FamilyState, Person } from '../../types';

function person(
  id: string,
  firstName: string,
  lastName: string,
  gender: 'male' | 'female' = 'male',
  birthDate: string | null = null,
): Person {
  return {
    id,
    firstName,
    lastName,
    gender,
    birthDate,
    deathDate: null,
    notes: '',
  };
}

describe('computeUnifiedLayout', () => {
  it('returns empty layout when rootId is unknown', () => {
    const state: FamilyState = { people: [], parentChildRelationships: [], marriages: [] };
    const { nodes, conns } = computeUnifiedLayout('nieistniejacy', state);
    expect(nodes).toEqual([]);
    expect(conns).toEqual([]);
  });

  it('places a solo root', () => {
    const state: FamilyState = {
      people: [person('p-jan', 'Jan', 'Kowalski')],
      parentChildRelationships: [],
      marriages: [],
    };
    const { nodes } = computeUnifiedLayout('p-jan', state);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('p-jan');
  });

  it('places a married couple at same Y with exact spacing', () => {
    const state: FamilyState = {
      people: [
        person('p-jan', 'Jan', 'Nowak', 'male'),
        person('p-anna', 'Anna', 'Nowak', 'female'),
      ],
      parentChildRelationships: [],
      marriages: [
        { id: 'm1', spouse1Id: 'p-jan', spouse2Id: 'p-anna', marriageDate: null, divorceDate: null },
      ],
    };
    const { nodes } = computeUnifiedLayout('p-jan', state);
    expect(nodes).toHaveLength(2);
    const jan = nodes.find(n => n.id === 'p-jan')!;
    const anna = nodes.find(n => n.id === 'p-anna')!;
    expect(jan.y).toBe(anna.y);
    expect(Math.abs(jan.x - anna.x)).toBe(2 * COUPLE_SPACING);
  });

  it('makes partnerId bidirectional on couples (regression)', () => {
    const state: FamilyState = {
      people: [
        person('p-piotr', 'Piotr', 'Wiśniewski', 'male'),
        person('p-maria', 'Maria', 'Wiśniewska', 'female'),
      ],
      parentChildRelationships: [],
      marriages: [
        { id: 'm1', spouse1Id: 'p-piotr', spouse2Id: 'p-maria', marriageDate: null, divorceDate: null },
      ],
    };
    const { nodes } = computeUnifiedLayout('p-piotr', state);
    const piotr = nodes.find(n => n.id === 'p-piotr')!;
    const maria = nodes.find(n => n.id === 'p-maria')!;
    expect(piotr.partnerId).toBe('p-maria');
    expect(maria.partnerId).toBe('p-piotr');
  });

  describe('ancestor siblings (Wuj/Ciotka case)', () => {
    // Mateusz Białowąs — korzeń. Rodzice: Wiesław (ojciec) + Bożena (matka).
    // Ojciec Wiesława (Stefan Białowąs) ma troje dzieci: Wiesław, Marek, Halina.
    // Marek i Halina (rodzeństwo Wiesława) powinni być po stronie Stefana,
    // a nie wmieszani w rodzinę Bożeny.
    const buildFamilyState = (): FamilyState => ({
      people: [
        person('p-mateusz', 'Mateusz', 'Białowąs', 'male', '2000-08-31'),
        person('p-wieslaw', 'Wiesław', 'Białowąs', 'male'),
        person('p-bozena', 'Bożena', 'Białowąs', 'female'),
        person('p-stefan', 'Stefan', 'Białowąs', 'male'),
        person('p-teresa', 'Teresa', 'Białowąs', 'female'),
        person('p-stanislaw', 'Stanisław', 'Bączek', 'male', '1935-02-03'),
        person('p-wladyslawa', 'Władysława', 'Bączek', 'female', '1941-08-27'),
        person('p-marek', 'Marek', 'Białowąs', 'male'),
        person('p-halina', 'Halina', 'Białowąs', 'female'),
      ],
      parentChildRelationships: [
        { id: 'r1', parentId: 'p-wieslaw', childId: 'p-mateusz' },
        { id: 'r2', parentId: 'p-bozena', childId: 'p-mateusz' },
        { id: 'r3', parentId: 'p-stanislaw', childId: 'p-bozena' },
        { id: 'r4', parentId: 'p-wladyslawa', childId: 'p-bozena' },
        { id: 'r5', parentId: 'p-stefan', childId: 'p-wieslaw' },
        { id: 'r6', parentId: 'p-teresa', childId: 'p-wieslaw' },
        { id: 'r7', parentId: 'p-stefan', childId: 'p-marek' },
        { id: 'r8', parentId: 'p-stefan', childId: 'p-halina' },
      ],
      marriages: [
        { id: 'm1', spouse1Id: 'p-wieslaw', spouse2Id: 'p-bozena', marriageDate: null, divorceDate: null },
        { id: 'm2', spouse1Id: 'p-stanislaw', spouse2Id: 'p-wladyslawa', marriageDate: null, divorceDate: null },
        { id: 'm3', spouse1Id: 'p-stefan', spouse2Id: 'p-teresa', marriageDate: null, divorceDate: null },
      ],
    });

    it('keeps Stefan + Teresa adjacent as a couple', () => {
      const { nodes } = computeUnifiedLayout('p-mateusz', buildFamilyState());
      const stefan = nodes.find(n => n.id === 'p-stefan')!;
      const teresa = nodes.find(n => n.id === 'p-teresa')!;
      expect(stefan.y).toBe(teresa.y);
      expect(Math.abs(stefan.x - teresa.x)).toBe(2 * COUPLE_SPACING);
    });

    it('keeps Stanisław + Władysława adjacent as a couple', () => {
      const { nodes } = computeUnifiedLayout('p-mateusz', buildFamilyState());
      const stanislaw = nodes.find(n => n.id === 'p-stanislaw')!;
      const wladyslawa = nodes.find(n => n.id === 'p-wladyslawa')!;
      expect(stanislaw.y).toBe(wladyslawa.y);
      expect(Math.abs(stanislaw.x - wladyslawa.x)).toBe(2 * COUPLE_SPACING);
    });

    it('places Wiesław siblings (Marek, Halina) on the Białowąs side — not on Bączek side', () => {
      const { nodes } = computeUnifiedLayout('p-mateusz', buildFamilyState());
      const bozena = nodes.find(n => n.id === 'p-bozena')!;
      const wieslaw = nodes.find(n => n.id === 'p-wieslaw')!;
      const marek = nodes.find(n => n.id === 'p-marek')!;
      const halina = nodes.find(n => n.id === 'p-halina')!;

      const onSideOfWieslaw = (x: number) =>
        wieslaw.x > bozena.x ? x > bozena.x : x < bozena.x;

      expect(onSideOfWieslaw(marek.x)).toBe(true);
      expect(onSideOfWieslaw(halina.x)).toBe(true);
    });
  });

  it('places spouse-of-ancestor next to the ancestor with bidirectional partnerId', () => {
    // Hhduf has only one listed parent (Civic). Civic is married to Chcic —
    // but Chcic is not Hhduf's mother. She should still render adjacent to
    // Civic with marriage rings, not as a disconnected node.
    // Real-world equivalent: pradziadek Andrzej + jego żona Jadwiga, gdzie
    // w zapisach historycznych tylko Andrzej figuruje jako ojciec dziadka.
    const state: FamilyState = {
      people: [
        person('p-mateusz', 'Mateusz', 'Białowąs', 'male', '2000-08-31'),
        person('p-wieslaw', 'Wiesław', 'Białowąs', 'male'),
        person('p-stefan', 'Stefan', 'Białowąs', 'male'),
        person('p-andrzej', 'Andrzej', 'Białowąs', 'male'),
        person('p-jadwiga', 'Jadwiga', 'Białowąs', 'female'),
      ],
      parentChildRelationships: [
        { id: 'r1', parentId: 'p-wieslaw', childId: 'p-mateusz' },
        { id: 'r2', parentId: 'p-stefan', childId: 'p-wieslaw' },
        { id: 'r3', parentId: 'p-andrzej', childId: 'p-stefan' },
      ],
      marriages: [
        { id: 'm1', spouse1Id: 'p-andrzej', spouse2Id: 'p-jadwiga', marriageDate: null, divorceDate: null },
      ],
    };
    const { nodes, conns } = computeUnifiedLayout('p-mateusz', state);
    const andrzej = nodes.find(n => n.id === 'p-andrzej')!;
    const jadwiga = nodes.find(n => n.id === 'p-jadwiga')!;
    expect(andrzej).toBeDefined();
    expect(jadwiga).toBeDefined();
    expect(andrzej.y).toBe(jadwiga.y);
    expect(Math.abs(andrzej.x - jadwiga.x)).toBe(2 * COUPLE_SPACING);
    expect(andrzej.partnerId).toBe('p-jadwiga');
    expect(jadwiga.partnerId).toBe('p-andrzej');
    // Marriage ring connection exists
    const coupleConn = conns.find(c =>
      c.type === 'couple' &&
      ((c.x1 === andrzej.x && c.y1 === andrzej.y) || (c.x2 === andrzej.x && c.y2 === andrzej.y))
    );
    expect(coupleConn).toBeDefined();
  });

  it('places disconnected people after connected tree', () => {
    const state: FamilyState = {
      people: [
        person('p-mateusz', 'Mateusz', 'Białowąs', 'male'),
        person('p-ktos', 'Ktoś', 'Niepowiązany', 'male'),
      ],
      parentChildRelationships: [],
      marriages: [],
    };
    const { nodes } = computeUnifiedLayout('p-mateusz', state);
    expect(nodes).toHaveLength(2);
    const mateusz = nodes.find(n => n.id === 'p-mateusz')!;
    const ktos = nodes.find(n => n.id === 'p-ktos')!;
    expect(ktos.x).toBeGreaterThan(mateusz.x);
  });
});
