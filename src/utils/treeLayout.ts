import type { FamilyState } from '../types';

// ======================== TYPES ========================

export interface LNode {
  id: string;
  name: string;
  born: string;
  x: number;
  y: number;
  depth: number;
  partnerId?: string;
  label?: string;
  isDead?: boolean;
}

export interface Conn {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /**
   * `couple` — primary marriage (shared children or first listed). Rendered with rings.
   * `branch` — parent→child tree branch.
   * `extra-couple` — secondary marriage without shared children (e.g. remarriage).
   *                  Rendered as dashed line without rings.
   */
  type: 'couple' | 'branch' | 'extra-couple';
  seed: number;
  depth: number;
}

// ======================== LAYOUT CONSTANTS ========================

/** Radius of each person circle on the canvas */
export const NODE_R = 28;

/** Vertical distance between generations */
export const GEN_H = 200;

/** Half-distance between coupled partner nodes (total gap = COUPLE_SPACING * 2) */
export const COUPLE_SPACING = 40;

/** Horizontal gap between sibling subtrees (edge-to-edge) */
export const CHILD_GAP = 40;

/** Footprint width of a couple unit (two label boxes side by side) */
export const COUPLE_WIDTH = COUPLE_SPACING * 4; // 160

/** Footprint width of a solo unit (one label box, with side margin) */
export const SOLO_WIDTH = COUPLE_SPACING * 2; // 80

/** Extra vertical space added below the root generation */
const ROOT_GEN_EXTRA_H = 60;

/** Left margin — minimum X position for any node */
export const MIN_EDGE_X = 60;

/** Y position where the topmost node is placed */
export const INITIAL_Y = 80;

/** Pixel gap between node circle edge and trunk/branch connection point */
export const TRUNK_OFFSET = 4;

/** Label box under each node — mirrors LABEL_BOX in FamilyTreeCanvas. The
 *  height is the worst case (two-line surname + birth + relation rows) so the
 *  off-grid extra-spouse search reserves enough vertical room. */
const LABEL_W = 80;
const LABEL_H = 96;
const LABEL_GAP = 3;

// ======================== UTILS ========================
export function hsh(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 42;
}

/**
 * Classify each person's marriages into "primary" (used for main layout) and
 * "extras" (rendered as dangling leaf nodes with a dashed line).
 *
 * Primary selection per person: the marriage with shared children (or the
 * first marriage when none have shared children). Extras = all other marriages.
 *
 * The relationship is asymmetric on purpose. Example — Charles has kids with
 * Diana, so `primary[Charles] = Diana`. Camilla only married Charles, so
 * `primary[Camilla] = Charles`. But Camilla is in `extra[Charles]`, because
 * from Charles's perspective she's the secondary marriage. A "couple" in the
 * layout exists only when the choice is mutual (primary[A]===B && primary[B]===A).
 */
export function classifyMarriages(
  state: FamilyState,
  childrenOf: Map<string, string[]>,
): {
  primarySpouseMap: Map<string, string>;
  extraSpousesMap: Map<string, string[]>;
} {
  const primarySpouseMap = new Map<string, string>();
  const extraSpousesMap = new Map<string, string[]>();

  const marriageHasSharedChildren = (m: { spouse1Id: string; spouse2Id: string }) => {
    const kids1 = new Set(childrenOf.get(m.spouse1Id) ?? []);
    const kids2 = childrenOf.get(m.spouse2Id) ?? [];
    return kids2.some(k => kids1.has(k));
  };

  const marriagesByPerson = new Map<string, typeof state.marriages>();
  for (const m of state.marriages) {
    if (!marriagesByPerson.has(m.spouse1Id)) marriagesByPerson.set(m.spouse1Id, []);
    marriagesByPerson.get(m.spouse1Id)!.push(m);
    if (!marriagesByPerson.has(m.spouse2Id)) marriagesByPerson.set(m.spouse2Id, []);
    marriagesByPerson.get(m.spouse2Id)!.push(m);
  }

  for (const [personId, marriages] of marriagesByPerson) {
    // Stable sort: marriages with shared children first, then preserve original order.
    const sorted = marriages
      .map((m, i) => ({ m, i, shared: marriageHasSharedChildren(m) ? 1 : 0 }))
      .sort((a, b) => b.shared - a.shared || a.i - b.i)
      .map(x => x.m);

    const primary = sorted[0];
    const otherSide = (m: { spouse1Id: string; spouse2Id: string }) =>
      m.spouse1Id === personId ? m.spouse2Id : m.spouse1Id;

    primarySpouseMap.set(personId, otherSide(primary));

    const extras: string[] = [];
    for (let i = 1; i < sorted.length; i++) extras.push(otherSide(sorted[i]));
    if (extras.length > 0) extraSpousesMap.set(personId, extras);
  }

  return { primarySpouseMap, extraSpousesMap };
}

// ======================== UNIFIED LAYOUT ========================
//
// "Contour hourglass" layout. The selected root sits in the middle; ancestors
// grow upward, descendants downward, collateral relatives (siblings, aunts,
// uncles, cousins) fan out to the sides.
//
// The single invariant that guarantees a clean drawing:
//
//     Every subtree we place is fit against a GLOBAL per-generation
//     occupancy contour. A new subtree is shifted sideways until, at every
//     generation it spans, its horizontal extent clears everything already
//     placed by at least CHILD_GAP.
//
// Because subtrees never share horizontal space at any generation:
//   • no two node/label boxes can overlap (proved per generation row), and
//   • branches of different family units live in disjoint x-bands, so they
//     cannot cross — and within one family the parent is centred over its
//     children, so its own branches fan out without crossing either.
//
// Coordinates are produced relative to the root (root unit centred at x=0),
// then normalised at the end.

interface Unit {
  id: string;
  members: string[]; // 1 (solo) or 2 (couple, deterministic order)
  gen: number;
  isCouple: boolean;
}

interface DNode {
  unit: Unit;
  children: DNode[];
}

export function computeUnifiedLayout(
  rootId: string,
  state: FamilyState,
  labels?: Map<string, string>,
): { nodes: LNode[]; conns: Conn[] } {
  const pMap = new Map(state.people.map(p => [p.id, p]));
  if (!pMap.has(rootId)) return { nodes: [], conns: [] };

  // ---- Person adjacency ----
  const childrenOf = new Map<string, string[]>();
  const parentsOf = new Map<string, string[]>();
  for (const r of state.parentChildRelationships) {
    if (!pMap.has(r.parentId) || !pMap.has(r.childId)) continue;
    if (!childrenOf.has(r.parentId)) childrenOf.set(r.parentId, []);
    childrenOf.get(r.parentId)!.push(r.childId);
    if (!parentsOf.has(r.childId)) parentsOf.set(r.childId, []);
    parentsOf.get(r.childId)!.push(r.parentId);
  }

  const { primarySpouseMap, extraSpousesMap } = classifyMarriages(state, childrenOf);
  const spouseOf = (id: string): string | null => primarySpouseMap.get(id) ?? null;

  // ============================================================
  // PHASE 1 — generations via BFS (root=0, parents=-1, children=+1)
  // ============================================================
  const genOf = new Map<string, number>();
  {
    const q: string[] = [rootId];
    genOf.set(rootId, 0);
    while (q.length > 0) {
      const id = q.shift()!;
      const g = genOf.get(id)!;
      const visit = (nid: string, ng: number) => {
        if (!pMap.has(nid) || genOf.has(nid)) return;
        genOf.set(nid, ng);
        q.push(nid);
      };
      for (const cid of childrenOf.get(id) ?? []) visit(cid, g + 1);
      for (const pid of parentsOf.get(id) ?? []) visit(pid, g - 1);
      const sid = spouseOf(id);
      if (sid) visit(sid, g);
    }
  }

  // ============================================================
  // PHASE 2 — Y per generation (fixed rows)
  // ============================================================
  let minGen = 0, maxGen = 0;
  for (const g of genOf.values()) {
    if (g < minGen) minGen = g;
    if (g > maxGen) maxGen = g;
  }
  const genY = new Map<number, number>();
  genY.set(0, 0);
  for (let g = 1; g <= maxGen; g++) {
    genY.set(g, genY.get(g - 1)! + GEN_H + (g === 1 ? ROOT_GEN_EXTRA_H : 0));
  }
  for (let g = -1; g >= minGen; g--) {
    genY.set(g, genY.get(g + 1)! - GEN_H);
  }

  // ============================================================
  // PHASE 3 — pair people into layout couples, then build units
  // ============================================================
  // A "couple" is drawn as two adjacent nodes with a marriage ring. It comes
  // from a mutual primary marriage, OR — when neither partner has a marriage —
  // is inferred from a shared child. Inferring co-parents keeps two people who
  // raised a child together side by side (and their branches clean) even when
  // no marriage was recorded.
  const layoutPartner = new Map<string, string>();
  const pair = (a: string, b: string) => { layoutPartner.set(a, b); layoutPartner.set(b, a); };

  for (const pid of genOf.keys()) {
    if (layoutPartner.has(pid)) continue;
    const sp = spouseOf(pid);
    if (sp && genOf.has(sp) && spouseOf(sp) === pid && !layoutPartner.has(sp)) pair(pid, sp);
  }
  for (const child of genOf.keys()) {
    const ps = [...new Set((parentsOf.get(child) ?? []).filter(p => genOf.has(p)))];
    if (ps.length === 2 && !layoutPartner.has(ps[0]) && !layoutPartner.has(ps[1])) pair(ps[0], ps[1]);
  }

  const unitOfPerson = new Map<string, Unit>();
  const unitsById = new Map<string, Unit>();
  for (const pid of genOf.keys()) {
    if (unitOfPerson.has(pid)) continue;
    const partner = layoutPartner.get(pid);
    const isCouple = !!partner && genOf.has(partner);
    const members = isCouple ? [pid, partner!].sort() : [pid];
    const unit: Unit = { id: members.join('+'), members, gen: genOf.get(pid)!, isCouple };
    unitsById.set(unit.id, unit);
    members.forEach(m => unitOfPerson.set(m, unit));
  }

  const unitOf = (pid: string) => unitOfPerson.get(pid)!;
  const unitHalf = (u: Unit) => (u.isCouple ? COUPLE_WIDTH : SOLO_WIDTH) / 2;

  /** Distinct child units (child + their spouse), in stable order. */
  const childUnitsOf = (u: Unit): Unit[] => {
    const seen = new Set<string>();
    const out: Unit[] = [];
    for (const m of u.members) {
      for (const cid of childrenOf.get(m) ?? []) {
        const cu = unitOf(cid);
        if (cu.id === u.id || seen.has(cu.id)) continue;
        seen.add(cu.id);
        out.push(cu);
      }
    }
    return out;
  };

  /** Distinct parent units, in stable order. */
  const parentUnitsOf = (u: Unit): Unit[] => {
    const seen = new Set<string>();
    const out: Unit[] = [];
    for (const m of u.members) {
      for (const pid of parentsOf.get(m) ?? []) {
        const pu = unitOf(pid);
        if (pu.id === u.id || seen.has(pu.id)) continue;
        seen.add(pu.id);
        out.push(pu);
      }
    }
    return out;
  };

  // ============================================================
  // Placement state — px (per-person X), commit + occupancy contour
  // ============================================================
  const px = new Map<string, number>();
  const partnerOf = new Map<string, string>();
  const placedUnits = new Set<string>();
  const placedPersons = new Set<string>();

  /** Per-generation occupied interval [min,max] of node footprints (final coords). */
  const occ = new Map<number, { min: number; max: number }>();
  const mergeOcc = (gen: number, min: number, max: number) => {
    const o = occ.get(gen);
    if (!o) occ.set(gen, { min, max });
    else { o.min = Math.min(o.min, min); o.max = Math.max(o.max, max); }
  };

  const commitUnit = (u: Unit, center: number) => {
    if (u.isCouple) {
      px.set(u.members[0], center - COUPLE_SPACING);
      px.set(u.members[1], center + COUPLE_SPACING);
      partnerOf.set(u.members[0], u.members[1]);
      partnerOf.set(u.members[1], u.members[0]);
    } else {
      px.set(u.members[0], center);
    }
    u.members.forEach(m => placedPersons.add(m));
    placedUnits.add(u.id);
    mergeOcc(u.gen, center - unitHalf(u), center + unitHalf(u));
  };

  // ---- Descendant subtree builder + width-allocation placement ----
  const descVisited = new Set<string>();
  const buildDescTree = (u: Unit): DNode => {
    descVisited.add(u.id);
    const children: DNode[] = [];
    for (const cu of childUnitsOf(u)) {
      if (cu.gen === u.gen + 1 && !descVisited.has(cu.id)) {
        children.push(buildDescTree(cu));
      }
    }
    return { unit: u, children };
  };

  const widthCache = new Map<string, number>();
  const subWidth = (d: DNode): number => {
    const cached = widthCache.get(d.unit.id);
    if (cached != null) return cached;
    const myW = d.unit.isCouple ? COUPLE_WIDTH : SOLO_WIDTH;
    let w = myW;
    if (d.children.length > 0) {
      const cw = d.children.reduce((s, c, i) => s + subWidth(c) + (i > 0 ? CHILD_GAP : 0), 0);
      w = Math.max(myW, cw);
    }
    widthCache.set(d.unit.id, w);
    return w;
  };

  /** Widest subtrees to the outside, narrow ones centred — reduces long branches. */
  const orderChildren = (kids: DNode[]): DNode[] => {
    if (kids.length <= 1) return kids;
    const sorted = [...kids].sort((a, b) => subWidth(b) - subWidth(a));
    const result: DNode[] = new Array(sorted.length);
    let left = 0, right = sorted.length - 1, pickRight = true;
    for (const child of sorted) {
      if (pickRight) result[right--] = child; else result[left++] = child;
      pickRight = !pickRight;
    }
    return result;
  };

  /** Compute relative centres for a descendant tree (no side effects). */
  const layoutDescTree = (d: DNode, center: number, out: Map<string, number>) => {
    out.set(d.unit.id, center);
    if (d.children.length === 0) return;
    const ordered = orderChildren(d.children);
    const totalW = ordered.reduce((s, c, i) => s + subWidth(c) + (i > 0 ? CHILD_GAP : 0), 0);
    let cursor = center - totalW / 2;
    for (const child of ordered) {
      const cw = subWidth(child);
      layoutDescTree(child, cursor + cw / 2, out);
      cursor += cw + CHILD_GAP;
    }
  };

  /** Per-generation extent of a relative placement map. */
  const extentsOf = (out: Map<string, number>): Map<number, { min: number; max: number }> => {
    const ext = new Map<number, { min: number; max: number }>();
    for (const [uid, c] of out) {
      const u = unitsById.get(uid)!;
      const h = unitHalf(u);
      const e = ext.get(u.gen);
      if (!e) ext.set(u.gen, { min: c - h, max: c + h });
      else { e.min = Math.min(e.min, c - h); e.max = Math.max(e.max, c + h); }
    }
    return ext;
  };

  /**
   * Shift to apply to a relative placement so it sits flush against the current
   * occupancy contour on the given side, clearing it by CHILD_GAP everywhere.
   */
  const fitShift = (out: Map<string, number>, side: 'left' | 'right'): number => {
    const ext = extentsOf(out);
    let shift = side === 'left' ? Infinity : -Infinity;
    let constrained = false;
    for (const [g, e] of ext) {
      const o = occ.get(g);
      if (!o) continue;
      constrained = true;
      if (side === 'left') shift = Math.min(shift, o.min - CHILD_GAP - e.max);
      else shift = Math.max(shift, o.max + CHILD_GAP - e.min);
    }
    return constrained ? shift : 0;
  };

  const commitMap = (out: Map<string, number>, shift: number) => {
    for (const [uid, c] of out) commitUnit(unitsById.get(uid)!, c + shift);
  };

  /** Place a whole descendant subtree beside everything already placed. */
  const placeDescendantSubtree = (u: Unit, side: 'left' | 'right') => {
    const tree = buildDescTree(u);
    subWidth(tree);
    const out = new Map<string, number>();
    layoutDescTree(tree, 0, out);
    commitMap(out, fitShift(out, side));
  };

  // ============================================================
  // PHASE 4 — place the root's own descendant tree (centred at 0)
  // ============================================================
  {
    const rootUnit = unitOf(rootId);
    const tree = buildDescTree(rootUnit);
    subWidth(tree);
    const out = new Map<string, number>();
    layoutDescTree(tree, 0, out);
    commitMap(out, 0); // first placement defines the contour, no shift
  }

  // ============================================================
  // PHASE 5 — place ancestors + their collateral descendants
  // ============================================================
  // Walk up from the root unit. For each parent unit P of the current child
  // unit: place P's *other* children (collateral siblings) as descendant
  // subtrees on the appropriate side, then centre P over all of its children,
  // then recurse upward from P.

  const isChildOfUnit = (personId: string, u: Unit) =>
    (parentsOf.get(personId) ?? []).some(pid => u.members.includes(pid));

  const placeParentUnit = (P: Unit, desiredCenter: number, side: 'left' | 'right') => {
    const half = unitHalf(P);
    let center = desiredCenter;
    const o = occ.get(P.gen);
    if (o) {
      const clearsLeft = center + half + CHILD_GAP <= o.min;
      const clearsRight = center - half - CHILD_GAP >= o.max;
      if (!clearsLeft && !clearsRight) {
        // overlaps existing nodes on this row — push outward to the chosen side
        center = side === 'left' ? o.min - CHILD_GAP - half : o.max + CHILD_GAP + half;
      }
    }
    commitUnit(P, center);
  };

  const placeAncestors = (childUnit: Unit) => {
    const parents = parentUnitsOf(childUnit).filter(
      p => !placedUnits.has(p.id) && p.gen === childUnit.gen - 1,
    );
    if (parents.length === 0) return;

    // Anchor each parent unit at the average X of the child members it parents,
    // then order left→right so collateral subtrees fan outward consistently.
    const anchored = parents.map(P => {
      const xs = childUnit.members
        .filter(m => isChildOfUnit(m, P))
        .map(m => px.get(m)!)
        .filter(v => v != null);
      const anchorX = xs.length
        ? xs.reduce((s, v) => s + v, 0) / xs.length
        : (px.get(childUnit.members[0]) ?? 0);
      return { P, anchorX };
    }).sort((a, b) => a.anchorX - b.anchorX);

    anchored.forEach(({ P }, idx) => {
      // Side: the leftmost parent fans its collaterals left, the rightmost right.
      // A single parent over a couple uses the side of the child it parents.
      let side: 'left' | 'right';
      if (anchored.length > 1) side = idx === 0 ? 'left' : 'right';
      else if (childUnit.isCouple) {
        side = isChildOfUnit(childUnit.members[0], P) ? 'left' : 'right';
      } else side = 'right';

      // Place collateral siblings (P's children other than the spine child) as
      // descendant subtrees fit against the contour, then centre P over all of
      // its placed children.
      const collaterals = childUnitsOf(P).filter(
        cu => !placedUnits.has(cu.id) && cu.gen === P.gen + 1,
      );
      for (const cu of collaterals) placeDescendantSubtree(cu, side);

      const childXs: number[] = [];
      for (const m of P.members) {
        for (const cid of childrenOf.get(m) ?? []) {
          const x = px.get(cid);
          if (x != null) childXs.push(x);
        }
      }
      const desired = childXs.length
        ? (Math.min(...childXs) + Math.max(...childXs)) / 2
        : 0;
      placeParentUnit(P, desired, side);

      placeAncestors(P);
    });
  };

  placeAncestors(unitOf(rootId));

  // ============================================================
  // PHASE 6 — build LNodes from final person positions
  // ============================================================
  const mkNode = (id: string, x: number, gen: number): LNode => {
    const p = pMap.get(id)!;
    const n: LNode = {
      id, x,
      y: genY.get(gen)!,
      depth: gen,
      name: `${p.firstName} ${p.lastName}`,
      born: p.birthDate || '',
      label: labels?.get(id),
      isDead: !!p.deathDate,
    };
    const partner = partnerOf.get(id);
    if (partner) n.partnerId = partner;
    return n;
  };

  const nodes: LNode[] = [];
  const nodeMap = new Map<string, LNode>();
  for (const pid of placedPersons) {
    const n = mkNode(pid, px.get(pid)!, genOf.get(pid)!);
    nodes.push(n);
    nodeMap.set(pid, n);
  }

  // ============================================================
  // PHASE 7 — connections (derived from final positions)
  // ============================================================
  const conns: Conn[] = [];

  // 7a — couple rings (mutual primary marriages that are placed side by side)
  for (const m of state.marriages) {
    const n1 = nodeMap.get(m.spouse1Id);
    const n2 = nodeMap.get(m.spouse2Id);
    if (!n1 || !n2) continue;
    if (Math.abs(n1.y - n2.y) > 1) continue; // not a layout couple (handled as extra)
    const left = n1.x < n2.x ? n1 : n2;
    const right = n1.x < n2.x ? n2 : n1;
    conns.push({
      x1: left.x, y1: left.y, x2: right.x, y2: right.y,
      type: 'couple', seed: hsh(left.id + right.id), depth: left.depth,
    });
  }

  // 7b — parent→child branches, one fan per parent unit
  const familyUnits = new Map<string, { parentIds: string[]; childIds: string[] }>();
  for (const r of state.parentChildRelationships) {
    const parent = nodeMap.get(r.parentId);
    const child = nodeMap.get(r.childId);
    if (!parent || !child) continue;
    // Co-parent = this parent's layout partner (marriage or inferred), placed on
    // the same row — so a couple's children fan out from one shared midpoint.
    const sp = partnerOf.get(r.parentId);
    const coParent = sp && nodeMap.has(sp) && Math.abs(parent.y - nodeMap.get(sp)!.y) < 1
      ? sp : null;
    const parentPair = coParent ? [r.parentId, coParent].sort() : [r.parentId];
    const fk = parentPair.join('+');
    if (!familyUnits.has(fk)) familyUnits.set(fk, { parentIds: parentPair, childIds: [] });
    const unit = familyUnits.get(fk)!;
    if (!unit.childIds.includes(r.childId)) unit.childIds.push(r.childId);
  }

  for (const { parentIds, childIds } of familyUnits.values()) {
    const parents = parentIds.map(id => nodeMap.get(id)!).filter(Boolean);
    const children = childIds.map(id => nodeMap.get(id)!).filter(Boolean);
    if (parents.length === 0 || children.length === 0) continue;
    const pxs = parents.map(p => p.x);
    const parentCenterX = (Math.min(...pxs) + Math.max(...pxs)) / 2;
    const parentY = parents[0].y;
    const childY = children[0].y;
    const downward = parentY < childY;
    const startY = downward ? parentY + NODE_R : parentY - NODE_R;
    for (const child of children) {
      conns.push({
        x1: parentCenterX, y1: startY,
        x2: child.x, y2: childY - (downward ? NODE_R : -NODE_R),
        type: 'branch', seed: hsh(child.id + (downward ? '' : 'anc')), depth: child.depth,
      });
    }
  }

  // ============================================================
  // PHASE 8 — extra spouses (secondary marriages) as dangling leaves
  // ============================================================
  // Each extra is attached to its partner by a short dashed line and placed in
  // free space found by an outward/downward search, so it never overlaps an
  // existing node — same guarantee as the main layout, just collision-checked
  // directly (extras are off-grid, so the generation contour does not apply).
  const EXTRA_X_GAP = SOLO_WIDTH + CHILD_GAP; // 120
  const EXTRA_Y_STEP = NODE_R + LABEL_H + LABEL_GAP + 10; // one row below
  const HALF_W = LABEL_W / 2 + 2;
  const BOX_TOP = NODE_R + 2;
  const BOX_BOT = NODE_R + LABEL_GAP + LABEL_H + 2;
  const boxes = nodes.map(n => ({ x: n.x, y: n.y }));
  const collides = (x: number, y: number) =>
    boxes.some(b =>
      Math.abs(x - b.x) < 2 * HALF_W &&
      y - BOX_TOP < b.y + BOX_BOT && b.y - BOX_TOP < y + BOX_BOT);

  for (const [personId, extraIds] of extraSpousesMap) {
    const personNode = nodeMap.get(personId);
    if (!personNode) continue;
    const primaryId = primarySpouseMap.get(personId);
    const primaryNode = primaryId ? nodeMap.get(primaryId) : null;
    const sign = primaryNode ? (primaryNode.x > personNode.x ? -1 : 1) : -1;

    for (const extraId of extraIds) {
      if (!pMap.has(extraId) || placedPersons.has(extraId)) continue;
      // Search outward then down for the first free slot near the partner.
      let ex = personNode.x + sign * EXTRA_X_GAP;
      let ey = personNode.y;
      let placed = false;
      for (let row = 0; row < 12 && !placed; row++) {
        for (let step = 1; step <= 8; step++) {
          const cx = personNode.x + sign * EXTRA_X_GAP * step;
          const cy = personNode.y + EXTRA_Y_STEP * row;
          if (!collides(cx, cy)) { ex = cx; ey = cy; placed = true; break; }
        }
      }
      const p = pMap.get(extraId)!;
      const extraNode: LNode = {
        id: extraId, x: ex, y: ey, depth: personNode.depth,
        name: `${p.firstName} ${p.lastName}`, born: p.birthDate || '',
        label: labels?.get(extraId), isDead: !!p.deathDate,
      };
      nodes.push(extraNode);
      nodeMap.set(extraId, extraNode);
      boxes.push({ x: ex, y: ey });
      placedPersons.add(extraId);
      conns.push({
        x1: personNode.x, y1: personNode.y, x2: extraNode.x, y2: extraNode.y,
        type: 'extra-couple', seed: hsh(personId + extraId + 'extra'), depth: personNode.depth,
      });
    }
  }

  // ============================================================
  // PHASE 9 — normalise to top-left margin, then append disconnected people
  // ============================================================
  if (nodes.length > 0) {
    let minX = Infinity, minY = Infinity;
    for (const n of nodes) { if (n.x < minX) minX = n.x; if (n.y < minY) minY = n.y; }
    const xShift = MIN_EDGE_X - minX;
    const yShift = INITIAL_Y - minY;
    if (xShift !== 0 || yShift !== 0) {
      for (const n of nodes) { n.x += xShift; n.y += yShift; }
      for (const c of conns) { c.x1 += xShift; c.y1 += yShift; c.x2 += xShift; c.y2 += yShift; }
    }
  }

  const disconnected = state.people.filter(p => !placedPersons.has(p.id));
  if (disconnected.length > 0) {
    let maxX = 0;
    for (const n of nodes) if (n.x > maxX) maxX = n.x;
    let offsetX = maxX + 120;
    for (const p of disconnected) {
      nodes.push({
        id: p.id, name: `${p.firstName} ${p.lastName}`, born: p.birthDate || '',
        x: offsetX, y: INITIAL_Y, depth: 0, label: labels?.get(p.id),
        isDead: !!p.deathDate,
      });
      offsetX += SOLO_WIDTH + CHILD_GAP;
    }
  }

  return { nodes, conns };
}
