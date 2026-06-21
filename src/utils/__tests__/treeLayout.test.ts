import { describe, it, expect } from 'vitest';
import { computeUnifiedLayout, COUPLE_SPACING, SOLO_WIDTH, NODE_R, type LNode, type Conn } from '../treeLayout';
import type { FamilyState, Person } from '../../types';

// ─── Geometry helpers for the layout invariants ───────────────────────────
// A node owns a circle (radius NODE_R) plus an 80-wide label box just below it.
// Height is the worst case (two-line surname + birth + relation), matching the
// renderer's dynamic box, so the test validates the real footprint.
const LABEL_W = 80, LABEL_H = 96, LABEL_GAP = 3;
const nodeBox = (n: LNode) => ({
  l: n.x - LABEL_W / 2, r: n.x + LABEL_W / 2,
  t: n.y - NODE_R, b: n.y + NODE_R + LABEL_GAP + LABEL_H,
});
function boxesOverlap(a: LNode, b: LNode) {
  const A = nodeBox(a), B = nodeBox(b);
  return A.l < B.r && B.l < A.r && A.t < B.b && B.t < A.b;
}
/** Count node/label-box overlaps, excluding intentionally-adjacent couples. */
function countOverlaps(nodes: LNode[]) {
  const partner = new Map(nodes.filter(n => n.partnerId).map(n => [n.id, n.partnerId!]));
  let n = 0;
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) {
      if (partner.get(nodes[i].id) === nodes[j].id) continue;
      if (boxesOverlap(nodes[i], nodes[j])) n++;
    }
  return n;
}
const ccw = (a: any, b: any, c: any) =>
  (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
function segmentsCross(a: Conn, b: Conn) {
  // ignore branches that share a parent origin or a child endpoint
  if (Math.abs(a.x1 - b.x1) < 1 && Math.abs(a.y1 - b.y1) < 1) return false;
  if (Math.abs(a.x2 - b.x2) < 1 && Math.abs(a.y2 - b.y2) < 1) return false;
  const p1 = { x: a.x1, y: a.y1 }, p2 = { x: a.x2, y: a.y2 };
  const p3 = { x: b.x1, y: b.y1 }, p4 = { x: b.x2, y: b.y2 };
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}
function countBranchCrossings(conns: Conn[]) {
  const br = conns.filter(c => c.type === 'branch');
  let n = 0;
  for (let i = 0; i < br.length; i++)
    for (let j = i + 1; j < br.length; j++)
      if (segmentsCross(br[i], br[j])) n++;
  return n;
}

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

  it('renders second marriage without shared kids as extra-couple (Camilla case)', () => {
    // Charles ma dwoje dzieci z Dianą i drugie małżeństwo z Camillą (bezdzietne).
    // Diana powinna zostać w głównym układzie jako podstawowa para, Camilla
    // powinna być umieszczona jako "extra" z dashed line (typ 'extra-couple').
    const state: FamilyState = {
      people: [
        person('p-william', 'William', 'Wales', 'male'),
        person('p-charles', 'Charles', 'Windsor', 'male'),
        person('p-diana', 'Diana', 'Spencer', 'female'),
        person('p-camilla', 'Camilla', 'Parker Bowles', 'female'),
      ],
      parentChildRelationships: [
        { id: 'r1', parentId: 'p-charles', childId: 'p-william' },
        { id: 'r2', parentId: 'p-diana', childId: 'p-william' },
      ],
      marriages: [
        { id: 'm1', spouse1Id: 'p-charles', spouse2Id: 'p-diana', marriageDate: null, divorceDate: null },
        { id: 'm2', spouse1Id: 'p-charles', spouse2Id: 'p-camilla', marriageDate: null, divorceDate: null },
      ],
    };

    const { nodes, conns } = computeUnifiedLayout('p-william', state);

    const charles = nodes.find(n => n.id === 'p-charles');
    const diana = nodes.find(n => n.id === 'p-diana');
    const camilla = nodes.find(n => n.id === 'p-camilla');

    expect(charles).toBeDefined();
    expect(diana).toBeDefined();
    expect(camilla).toBeDefined();

    // Charles i Diana są parą (matka Williama) — taki sam Y, standardowy odstęp
    expect(charles!.y).toBe(diana!.y);
    expect(Math.abs(charles!.x - diana!.x)).toBe(2 * COUPLE_SPACING);
    expect(charles!.partnerId).toBe('p-diana');

    // Camilla jest umieszczona w wolnym miejscu obok Charlesa (po przeciwnej
    // stronie niż Diana) — połączona linią przerywaną, bez nakładania się.
    expect(camilla!.id).not.toBe(charles!.id);
    // Po przeciwnej stronie Charlesa niż Diana
    expect(Math.sign(camilla!.x - charles!.x)).toBe(-Math.sign(diana!.x - charles!.x));
    // Nie nachodzi na Charlesa ani Dianę (odstęp ≥ szerokość etykiety w poziomie
    // lub rozsunięcie w pionie)
    for (const other of [charles!, diana!]) {
      const apart = Math.abs(camilla!.x - other.x) >= 80 || Math.abs(camilla!.y - other.y) >= 80;
      expect(apart).toBe(true);
    }

    // Istnieje dokładnie jedno połączenie typu 'extra-couple' dla pary Charles-Camilla
    const extraConns = conns.filter(c => c.type === 'extra-couple');
    expect(extraConns).toHaveLength(1);

    // Główne małżeństwo (Charles-Diana) renderowane jako 'couple'
    const coupleConns = conns.filter(c => c.type === 'couple');
    expect(coupleConns.length).toBeGreaterThanOrEqual(1);
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

  it('places the spouse\'s ancestors above the root even when the root has no parents', () => {
    // Root has no parents of his own, but his wife's family (in-laws) is shown.
    // The trunk-direction logic in FamilyTreeCanvas keys off "is any node above
    // the root" — so the spouse's ancestors must sit above the root for the
    // trunk to point roots-down (a tree growing up), not flip up like a
    // childless progenitor.
    const state: FamilyState = {
      people: [
        person('p-me', 'Mateusz', 'Białowąs', 'male'),
        person('p-wife', 'Joanna', 'Preiss', 'female'),
        person('p-fil', 'Marek', 'Preiss', 'male'),
        person('p-mil', 'Barbara', 'Preiss', 'female'),
      ],
      parentChildRelationships: [
        { id: 'r1', parentId: 'p-fil', childId: 'p-wife' },
        { id: 'r2', parentId: 'p-mil', childId: 'p-wife' },
      ],
      marriages: [
        { id: 'm1', spouse1Id: 'p-me', spouse2Id: 'p-wife', marriageDate: null, divorceDate: null },
      ],
    };
    const { nodes } = computeUnifiedLayout('p-me', state);
    const me = nodes.find(n => n.id === 'p-me')!;
    // The root has no own parents…
    expect(state.parentChildRelationships.some(r => r.childId === 'p-me')).toBe(false);
    // …yet the in-laws are laid out above him, so the trunk points roots-down.
    expect(nodes.some(n => n.y < me.y - 1)).toBe(true);
    expect(nodes.find(n => n.id === 'p-fil')!.y).toBeLessThan(me.y);
    expect(nodes.find(n => n.id === 'p-mil')!.y).toBeLessThan(me.y);
  });

  // ─── Core invariants: no overlaps, no crossing branches ──────────────────
  describe('layout invariants (no overlaps, no crossings)', () => {
    // A deliberately gnarly hourglass: 3 generations of ancestors with
    // collateral siblings on both sides, descendants with their own kids,
    // and a remarriage. Every person is exercised as the root.
    const buildComplex = (): FamilyState => {
      const people: Person[] = [];
      const pc: FamilyState['parentChildRelationships'] = [];
      const mar: FamilyState['marriages'] = [];
      let n = 0;
      const P = (g: 'male' | 'female' = 'male') => {
        const id = `c${n++}`;
        people.push(person(id, `Imię${id}`, 'Nazwisko', g));
        return id;
      };
      const marry = (a: string, b: string) =>
        mar.push({ id: `m${mar.length}`, spouse1Id: a, spouse2Id: b, marriageDate: null, divorceDate: null });
      const kid = (p: string, c: string) =>
        pc.push({ id: `r${pc.length}`, parentId: p, childId: c });

      const father = P('male'), mother = P('female'); marry(father, mother);
      const root = P('male'), rootSpouse = P('female'); marry(root, rootSpouse);
      kid(father, root); kid(mother, root);
      // root's siblings (collaterals) with their own kids
      for (let i = 0; i < 2; i++) {
        const s = P('female'); kid(father, s); kid(mother, s);
        const ss = P('male'); marry(ss, s);
        const c = P('male'); kid(s, c); kid(ss, c);
      }
      // root's descendants
      for (let i = 0; i < 3; i++) {
        const c = P('male'); kid(root, c); kid(rootSpouse, c);
        const cs = P('female'); marry(c, cs);
        for (let j = 0; j < 2; j++) { const g = P('male'); kid(c, g); kid(cs, g); }
      }
      // paternal + maternal grandparents, each with extra siblings
      const addGrandparents = (childId: string, sibGender: 'male' | 'female') => {
        const gf = P('male'), gm = P('female'); marry(gf, gm);
        kid(gf, childId); kid(gm, childId);
        for (let i = 0; i < 2; i++) {
          const sib = P(sibGender); kid(gf, sib); kid(gm, sib);
          const sibSp = P(sibGender === 'male' ? 'female' : 'male');
          marry(sib, sibSp);
          const cousin = P('male'); kid(sib, cousin); kid(sibSp, cousin);
        }
      };
      addGrandparents(father, 'male');
      addGrandparents(mother, 'female');
      // a remarriage (extra spouse for the father)
      marry(father, P('female'));
      return { people, parentChildRelationships: pc, marriages: mar };
    };

    const state = buildComplex();

    it('never overlaps node/label boxes, from any root', () => {
      for (const p of state.people) {
        const { nodes } = computeUnifiedLayout(p.id, state);
        expect(countOverlaps(nodes), `overlap when root=${p.id}`).toBe(0);
      }
    });

    it('never crosses parent→child branches, from any root', () => {
      for (const p of state.people) {
        const { conns } = computeUnifiedLayout(p.id, state);
        expect(countBranchCrossings(conns), `crossing when root=${p.id}`).toBe(0);
      }
    });

    it('keeps every couple exactly 2·COUPLE_SPACING apart on the same row', () => {
      for (const p of state.people) {
        const { nodes } = computeUnifiedLayout(p.id, state);
        const byId = new Map(nodes.map(node => [node.id, node]));
        for (const node of nodes) {
          if (!node.partnerId) continue;
          const partner = byId.get(node.partnerId);
          if (!partner) continue;
          expect(node.y).toBe(partner.y);
          expect(Math.abs(node.x - partner.x)).toBe(2 * COUPLE_SPACING);
        }
      }
    });
  });

  // ─── Client-reported scenarios (regression) ──────────────────────────────
  describe('client-reported regressions', () => {
    it('adding many siblings never overlaps labels and spreads them out', () => {
      // "Dopisywanie nowego rodzeństwa powoduje że napisy nachodzą na siebie."
      const people: Person[] = [
        person('p-mama', 'Mama', 'Test', 'female'),
        person('p-tata', 'Tata', 'Test', 'male'),
        person('p-root', 'Ja', 'Test', 'male'),
      ];
      const pc: FamilyState['parentChildRelationships'] = [
        { id: 'rm', parentId: 'p-mama', childId: 'p-root' },
        { id: 'rt', parentId: 'p-tata', childId: 'p-root' },
      ];
      const mar: FamilyState['marriages'] = [
        { id: 'm', spouse1Id: 'p-mama', spouse2Id: 'p-tata', marriageDate: null, divorceDate: null },
      ];
      // Add eight siblings one by one; the layout must stay overlap-free each time.
      for (let i = 0; i < 8; i++) {
        people.push(person(`p-sib${i}`, `Brat${i}`, 'Test', 'male'));
        pc.push({ id: `rms${i}`, parentId: 'p-mama', childId: `p-sib${i}` });
        pc.push({ id: `rts${i}`, parentId: 'p-tata', childId: `p-sib${i}` });
        const state: FamilyState = { people, parentChildRelationships: pc, marriages: mar };
        const { nodes } = computeUnifiedLayout('p-root', state);
        expect(countOverlaps(nodes), `overlap after adding sibling #${i}`).toBe(0);
        // Siblings sit on the same row, each at a distinct X (tree makes room).
        const row = nodes.filter(n => n.id === 'p-root' || n.id.startsWith('p-sib'));
        const xs = row.map(n => Math.round(n.x)).sort((a, b) => a - b);
        for (let k = 1; k < xs.length; k++) {
          expect(xs[k] - xs[k - 1]).toBeGreaterThanOrEqual(SOLO_WIDTH);
        }
      }
    });

    it('four generations of descendants never cross branches', () => {
      // "Przy czwartym pokoleniu na dole niepotrzebnie krzyżują się gałęzie."
      const people: Person[] = [];
      const pc: FamilyState['parentChildRelationships'] = [];
      const mar: FamilyState['marriages'] = [];
      let n = 0;
      const P = (g: 'male' | 'female') => {
        const id = `d${n++}`;
        people.push(person(id, `Os${id}`, 'Ród', g));
        return id;
      };
      const marry = (a: string, b: string) =>
        mar.push({ id: `m${mar.length}`, spouse1Id: a, spouse2Id: b, marriageDate: null, divorceDate: null });
      const kid = (p: string, q: string, c: string) => {
        pc.push({ id: `r${pc.length}`, parentId: p, childId: c });
        pc.push({ id: `r${pc.length}`, parentId: q, childId: c });
      };
      const expand = (a: string, b: string, depth: number) => {
        if (depth === 0) return;
        for (let i = 0; i < 3; i++) {
          const c = P(i % 2 === 0 ? 'male' : 'female');
          kid(a, b, c);
          const sp = P(i % 2 === 0 ? 'female' : 'male');
          marry(c, sp);
          expand(c, sp, depth - 1);
        }
      };
      const rootA = P('male'), rootB = P('female'); marry(rootA, rootB);
      expand(rootA, rootB, 4); // 4 generations below the root couple
      const state: FamilyState = { people, parentChildRelationships: pc, marriages: mar };
      const { nodes, conns } = computeUnifiedLayout(rootA, state);
      expect(countBranchCrossings(conns)).toBe(0);
      expect(countOverlaps(nodes)).toBe(0);
    });
  });
});
