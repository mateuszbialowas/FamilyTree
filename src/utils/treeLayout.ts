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

/** Horizontal gap between sibling subtrees */
export const CHILD_GAP = 40;

/** Minimum width allocated for a couple (2 nodes side by side) */
export const COUPLE_WIDTH = COUPLE_SPACING * 4; // 160

/** Minimum width allocated for a solo node */
export const SOLO_WIDTH = COUPLE_SPACING * 2; // 80

/** Extra vertical space added to root generation height */
const ROOT_GEN_EXTRA_H = 60;

/** Left margin — minimum X position for any node */
export const MIN_EDGE_X = 60;

/** Y position where the root node is placed */
export const INITIAL_Y = 80;

/** Extra horizontal margin for initial tree placement */
const INITIAL_MARGIN = 50;

/** Pixel gap between node circle edge and trunk/branch connection point */
export const TRUNK_OFFSET = 4;

/** Minimum horizontal distance between non-couple nodes */
const MIN_NODE_DIST = SOLO_WIDTH + CHILD_GAP;

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
 * The `primarySpouseMap` is indexed by person ID and returns that person's
 * single layout spouse. `extraSpousesMap` is indexed by person ID and returns
 * the list of spouse IDs that should be drawn as "extras" attached to them.
 *
 * Note: the relationship is asymmetric on purpose. Example — Charles has kids
 * with Diana, so `primary[Charles] = Diana`. Camilla only married Charles, so
 * `primary[Camilla] = Charles`. But Camilla is in `extra[Charles]`, because
 * from Charles's perspective she's the secondary marriage.
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

/**
 * Unified bidirectional family tree layout.
 *
 * Architecture:
 *   1. Assign generation numbers via BFS (root=0, parents=-1, children=+1)
 *   2. Compute Y coordinate per generation (fixed rows)
 *   3. Place descendant nodes (width-allocated recursive placement)
 *   4. Place ancestor nodes (generation-by-generation, overlap-aware)
 *   5. Sweep every generation to fix any remaining horizontal overlaps
 *   6. Generate ALL connections from final node positions
 *   7. Normalize coordinates
 */
export function computeUnifiedLayout(
  rootId: string,
  state: FamilyState,
  labels?: Map<string, string>,
): { nodes: LNode[]; conns: Conn[] } {
  const pMap = new Map(state.people.map(p => [p.id, p]));
  if (!pMap.has(rootId)) return { nodes: [], conns: [] };

  // === Adjacency maps ===
  const childrenOf = new Map<string, string[]>();
  const parentsOf = new Map<string, string[]>();
  for (const r of state.parentChildRelationships) {
    if (!childrenOf.has(r.parentId)) childrenOf.set(r.parentId, []);
    childrenOf.get(r.parentId)!.push(r.childId);
    if (!parentsOf.has(r.childId)) parentsOf.set(r.childId, []);
    parentsOf.get(r.childId)!.push(r.parentId);
  }

  // ============================================================
  // Marriage classification: primary (main layout) vs extra (dangling)
  // ============================================================
  // A marriage is "primary" if the couple has shared children. If a person has
  // multiple marriages, the one with shared children is picked as their layout
  // spouse. Other marriages become "extras" rendered as dashed leaf nodes.
  // This handles cases like Charles III → Diana (primary, kids) + Camilla (extra).
  const { primarySpouseMap, extraSpousesMap } = classifyMarriages(state, childrenOf);

  const spouseOf = (id: string): string | null => primarySpouseMap.get(id) ?? null;

  const coupleChildrenOf = (...pids: string[]): string[] => {
    const s = new Set<string>();
    for (const pid of pids) {
      for (const cid of childrenOf.get(pid) ?? []) s.add(cid);
    }
    return [...s];
  };

  // ============================================================
  // PHASE 1: Assign generation numbers via BFS
  // ============================================================
  const genOf = new Map<string, number>();
  {
    const q: { id: string; gen: number }[] = [{ id: rootId, gen: 0 }];
    genOf.set(rootId, 0);
    while (q.length > 0) {
      const { id, gen } = q.shift()!;
      for (const cid of childrenOf.get(id) ?? []) {
        if (!genOf.has(cid) && pMap.has(cid)) {
          genOf.set(cid, gen + 1);
          q.push({ id: cid, gen: gen + 1 });
        }
      }
      for (const pid of parentsOf.get(id) ?? []) {
        if (!genOf.has(pid) && pMap.has(pid)) {
          genOf.set(pid, gen - 1);
          q.push({ id: pid, gen: gen - 1 });
        }
      }
      // Spouses share the same generation
      const sid = spouseOf(id);
      if (sid && !genOf.has(sid) && pMap.has(sid)) {
        genOf.set(sid, gen);
        q.push({ id: sid, gen });
      }
    }
  }

  // ============================================================
  // PHASE 2: Compute Y per generation (fixed horizontal rows)
  // ============================================================
  let minGen = 0, maxGen = 0;
  for (const g of genOf.values()) {
    minGen = Math.min(minGen, g);
    maxGen = Math.max(maxGen, g);
  }

  const genY = new Map<number, number>();
  genY.set(0, 0);
  for (let g = 1; g <= maxGen; g++) {
    const extra = g === 1 ? ROOT_GEN_EXTRA_H : 0;
    genY.set(g, genY.get(g - 1)! + GEN_H + extra);
  }
  for (let g = -1; g >= minGen; g--) {
    genY.set(g, genY.get(g + 1)! - GEN_H);
  }

  // Map generation → depth (for Conn.depth and LNode.depth)
  // depth 0 = root gen, depth grows in both directions
  const depthOf = (gen: number) => gen;

  // ============================================================
  // PHASE 3: Place descendant nodes (gen >= 0)
  // ============================================================
  // Uses recursive width-allocated placement (works well for descendants)

  const nodes: LNode[] = [];
  const placed = new Set<string>();
  const nodeMap = new Map<string, LNode>();

  const mkNode = (id: string, x: number, gen: number, partnerId?: string): LNode => {
    const p = pMap.get(id)!;
    const node: LNode = {
      id, x,
      y: genY.get(gen)!,
      depth: depthOf(gen),
      name: `${p.firstName} ${p.lastName}`,
      born: p.birthDate || '',
      label: labels?.get(id),
      isDead: !!p.deathDate,
    };
    if (partnerId) node.partnerId = partnerId;
    return node;
  };

  const addNode = (n: LNode) => {
    nodes.push(n);
    nodeMap.set(n.id, n);
    placed.add(n.id);
  };

  interface DescNode {
    id: string;
    gen: number;
    spouseId: string | null;
    children: DescNode[];
  }

  const descVisited = new Set<string>();

  function buildDesc(id: string): DescNode {
    descVisited.add(id);
    const gen = genOf.get(id) ?? 0;
    const sp = spouseOf(id);
    let spouseId: string | null = null;
    let kids: string[] = [];

    if (sp && !descVisited.has(sp) && pMap.has(sp)) {
      descVisited.add(sp);
      spouseId = sp;
      kids = coupleChildrenOf(id, sp).filter(cid => !descVisited.has(cid) && pMap.has(cid));
    } else {
      kids = (childrenOf.get(id) ?? []).filter(cid => !descVisited.has(cid) && pMap.has(cid));
    }

    return { id, gen, spouseId, children: kids.map(cid => buildDesc(cid)) };
  }

  const widthCache = new Map<string, number>();

  function subWidth(node: DescNode): number {
    if (widthCache.has(node.id)) return widthCache.get(node.id)!;
    const myW = node.spouseId ? COUPLE_WIDTH : SOLO_WIDTH;
    if (node.children.length === 0) {
      widthCache.set(node.id, myW);
      return myW;
    }
    const childW = node.children.reduce(
      (sum, c, i) => sum + subWidth(c) + (i > 0 ? CHILD_GAP : 0), 0,
    );
    const w = Math.max(myW, childW);
    widthCache.set(node.id, w);
    return w;
  }

  /**
   * Order children to minimize edge crossings.
   * Widest subtrees go to the outside edges, leaf/narrow nodes
   * stay in the center. This prevents branches from crossing
   * sibling trunks.
   */
  function orderChildren(kids: DescNode[]): DescNode[] {
    if (kids.length <= 1) return kids;
    const sorted = [...kids].sort((a, b) => subWidth(b) - subWidth(a));
    const result: DescNode[] = new Array(sorted.length);
    let left = 0, right = sorted.length - 1;
    let pickRight = true;
    for (const child of sorted) {
      if (pickRight) {
        result[right--] = child;
      } else {
        result[left++] = child;
      }
      pickRight = !pickRight;
    }
    return result;
  }

  function placeDesc(node: DescNode, cx: number) {
    if (node.spouseId) {
      addNode(mkNode(node.id, cx - COUPLE_SPACING, node.gen, node.spouseId));
      addNode(mkNode(node.spouseId, cx + COUPLE_SPACING, node.gen, node.id));
    } else {
      addNode(mkNode(node.id, cx, node.gen));
    }

    if (node.children.length > 0) {
      const ordered = orderChildren(node.children);
      const totalW = ordered.reduce(
        (s, c, i) => s + subWidth(c) + (i > 0 ? CHILD_GAP : 0), 0,
      );
      let cursor = cx - totalW / 2;
      for (const child of ordered) {
        const cw = subWidth(child);
        placeDesc(child, cursor + cw / 2);
        cursor += cw + CHILD_GAP;
      }
    }
  }

  const descTree = buildDesc(rootId);
  subWidth(descTree);
  placeDesc(descTree, subWidth(descTree) / 2 + INITIAL_MARGIN);

  // ============================================================
  // PHASE 4: Place ancestor nodes (gen < 0), generation by generation
  // ============================================================
  // Process from gen -1 downward. For each generation, find all
  // "family units" (parent couple → children) and place parents
  // centered above their children, checking for overlaps with
  // ALL existing nodes at that generation level.

  const doneGroups = new Set<string>();

  /** Get the rightmost X of any placed node at a given generation */
  function rightmostAtGen(gen: number): number {
    let rx = -Infinity;
    for (const n of nodes) {
      if ((genOf.get(n.id) ?? -9999) === gen) {
        rx = Math.max(rx, n.x);
      }
    }
    return rx;
  }

  function processAncestors() {
    // Iteratively find nodes with unplaced parents and place them
    let changed = true;
    while (changed) {
      changed = false;

      // Collect all nodes that have unplaced parents
      const needingParents = nodes.filter(n => {
        const ups = (parentsOf.get(n.id) ?? []).filter(pid => !placed.has(pid) && pMap.has(pid));
        return ups.length > 0;
      });

      for (const pn of needingParents) {
        const ups = (parentsOf.get(pn.id) ?? []).filter(id => !placed.has(id) && pMap.has(id));
        if (ups.length === 0) continue;

        // Determine parent couple. Include g1's spouse even if not a parent of pn
        // (e.g. step-ancestor or spouse-of-ancestor), so they render side-by-side
        // with marriage rings and don't fall into the "disconnected" bucket.
        const g1 = ups[0];
        const g1s = spouseOf(g1);
        const g2 = g1s && pMap.has(g1s) && !placed.has(g1s) ? g1s : null;

        const gk = g2 ? [g1, g2].sort().join('+') : g1;
        if (doneGroups.has(gk)) continue;
        doneGroups.add(gk);

        const parentGen = (genOf.get(g1) ?? (genOf.get(pn.id)! - 1));

        // Find ALL children of this parent couple
        const allKids = coupleChildrenOf(...(g2 ? [g1, g2] : [g1]))
          .filter(id => pMap.has(id));
        const existingKids = allKids.filter(id => placed.has(id)).map(id => nodeMap.get(id)!);
        const newKids = allKids.filter(id => !placed.has(id));
        const childGen = genOf.get(pn.id)!;

        // Place new siblings to the LEFT of existing children.
        // This avoids crossings: branches to leaf siblings go left,
        // while the existing child (with descendants below) stays right.
        const sibNodes: LNode[] = [];

        if (existingKids.length > 0 && newKids.length > 0) {
          // Place new siblings on the OUTER side of the existing placed child
          // (away from that child's spouse, who is an in-law — not a child of g1/g2).
          const anchor = existingKids[0];
          const anchorSpouseId = spouseOf(anchor.id);
          const anchorSpouse = anchorSpouseId && nodeMap.has(anchorSpouseId)
            ? nodeMap.get(anchorSpouseId)! : null;
          const placeOnRight = anchorSpouse ? anchor.x > anchorSpouse.x : false;

          if (placeOnRight) {
            let sx = anchor.x + MIN_NODE_DIST;
            for (const kid of newKids) {
              const ks = spouseOf(kid);
              if (ks && !placed.has(ks) && pMap.has(ks)) {
                const sn = mkNode(kid, sx, childGen, ks);
                const spn = mkNode(ks, sx + COUPLE_SPACING * 2, childGen, kid);
                addNode(sn);
                addNode(spn);
                sibNodes.push(sn);
                sx += COUPLE_WIDTH + CHILD_GAP;
              } else {
                const sn = mkNode(kid, sx, childGen);
                addNode(sn);
                sibNodes.push(sn);
                sx += SOLO_WIDTH + CHILD_GAP;
              }
            }
          } else {
            let sx = anchor.x - CHILD_GAP;
            for (let i = newKids.length - 1; i >= 0; i--) {
              const kid = newKids[i];
              const ks = spouseOf(kid);
              if (ks && !placed.has(ks) && pMap.has(ks)) {
                const spn = mkNode(ks, sx, childGen, kid);
                const sn = mkNode(kid, sx - COUPLE_SPACING * 2, childGen, ks);
                addNode(sn);
                addNode(spn);
                sibNodes.push(sn);
                sx = sn.x - CHILD_GAP;
              } else {
                const sn = mkNode(kid, sx, childGen);
                addNode(sn);
                sibNodes.push(sn);
                sx -= SOLO_WIDTH + CHILD_GAP;
              }
            }
          }
        } else {
          // No existing kids — place to the right of everything at this gen
          const existingEdge = rightmostAtGen(childGen);
          let sx = existingEdge > -Infinity
            ? existingEdge + MIN_NODE_DIST
            : INITIAL_MARGIN;

          for (const kid of newKids) {
            const ks = spouseOf(kid);
            if (ks && !placed.has(ks) && pMap.has(ks)) {
              const sn = mkNode(kid, sx, childGen, ks);
              const spn = mkNode(ks, sx + COUPLE_SPACING * 2, childGen, kid);
              addNode(sn);
              addNode(spn);
              sibNodes.push(sn);
              sx += COUPLE_WIDTH + CHILD_GAP;
            } else {
              const sn = mkNode(kid, sx, childGen);
              addNode(sn);
              sibNodes.push(sn);
              sx += SOLO_WIDTH + CHILD_GAP;
            }
          }
        }

        // Recursively place descendants of newly-placed siblings
        // (e.g. Teresa's children like Maja, who aren't descendants of the root)
        for (const sib of sibNodes) {
          const sibDesc = buildDesc(sib.id);
          // sib itself is already placed, but we need to place its children
          if (sibDesc.children.length > 0) {
            const sibSp = sibDesc.spouseId ? nodeMap.get(sibDesc.spouseId) : null;
            const sibCx = sibSp ? (sib.x + sibSp.x) / 2 : sib.x;
            const ordered = orderChildren(sibDesc.children);
            const totalW = ordered.reduce(
              (s, c, idx) => s + subWidth(c) + (idx > 0 ? CHILD_GAP : 0), 0,
            );
            let cursor = sibCx - totalW / 2;
            for (const child of ordered) {
              const cw = subWidth(child);
              placeDesc(child, cursor + cw / 2);
              cursor += cw + CHILD_GAP;
            }
          }
        }

        // Center parents above ALL their children
        const allChildNodes = [...existingKids, ...sibNodes];
        const xs = allChildNodes.map(n => n.x);
        let center = (Math.min(...xs) + Math.max(...xs)) / 2;

        // Check parents don't actually overlap with existing nodes at parent generation
        const parentHalfWidth = g2 ? COUPLE_SPACING : 0;
        const existingAtParentGen = nodes.filter(n =>
          (genOf.get(n.id) ?? -9999) === parentGen
        );
        for (const en of existingAtParentGen) {
          const enLeft = en.x;
          const enRight = en.partnerId && nodeMap.has(en.partnerId)
            ? Math.max(en.x, nodeMap.get(en.partnerId)!.x) : en.x;
          const myLeft = center - parentHalfWidth;
          const myRight = center + parentHalfWidth;
          // Only adjust if there's real overlap
          if (myRight + MIN_NODE_DIST > enLeft && myLeft - MIN_NODE_DIST < enRight) {
            const pushRight = enRight + MIN_NODE_DIST + parentHalfWidth;
            const pushLeft = enLeft - MIN_NODE_DIST - parentHalfWidth;
            // Choose direction closer to natural center (above children)
            center = Math.abs(pushRight - center) < Math.abs(pushLeft - center)
              ? pushRight : pushLeft;
          }
        }

        if (g2) {
          addNode(mkNode(g1, center - COUPLE_SPACING, parentGen, g2));
          addNode(mkNode(g2, center + COUPLE_SPACING, parentGen, g1));
        } else {
          addNode(mkNode(g1, center, parentGen));
        }

        changed = true;
      }
    }
  }

  processAncestors();

  // ============================================================
  // PHASE 4b: Barycenter reordering of ancestor generations
  // ============================================================
  // For each ancestor generation, sort family units (couples/solos) by the
  // average X of their children. This eliminates crossings between different
  // family units whose branches would otherwise intersect.

  for (let g = -1; g >= minGen; g--) {
    const genNodes = nodes.filter(n => (genOf.get(n.id) ?? 0) === g);
    if (genNodes.length <= 1) continue;

    // Group into family units (couple or solo)
    interface FamilyUnit { nodeIds: string[]; center: number; barycenter: number }
    const units: FamilyUnit[] = [];
    const seen = new Set<string>();

    for (const n of genNodes) {
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      const partner = n.partnerId ? nodeMap.get(n.partnerId) : null;
      const ids = [n.id];
      if (partner && !seen.has(partner.id)) {
        ids.push(partner.id);
        seen.add(partner.id);
      }
      const xs = ids.map(id => nodeMap.get(id)!.x);
      const unitCenter = (Math.min(...xs) + Math.max(...xs)) / 2;

      // Barycenter = average X of all children at the next generation (gen + 1)
      const childXs: number[] = [];
      for (const uid of ids) {
        for (const cid of childrenOf.get(uid) ?? []) {
          const cn = nodeMap.get(cid);
          if (cn && (genOf.get(cid) ?? 0) === g + 1) childXs.push(cn.x);
        }
      }
      const bc = childXs.length > 0
        ? childXs.reduce((s, x) => s + x, 0) / childXs.length
        : unitCenter;

      units.push({ nodeIds: ids, center: unitCenter, barycenter: bc });
    }

    if (units.length <= 1) continue;

    // Current positions sorted left-to-right
    units.sort((a, b) => a.center - b.center);
    const slots = units.map(u => u.center);

    // Sort by barycenter and assign to slots
    const sorted = [...units].sort((a, b) => a.barycenter - b.barycenter);
    for (let i = 0; i < sorted.length; i++) {
      const unit = sorted[i];
      const shift = slots[i] - unit.center;
      if (Math.abs(shift) < 0.5) continue;
      for (const id of unit.nodeIds) {
        const n = nodeMap.get(id);
        if (n) n.x += shift;
      }
    }
  }

  // ============================================================
  // PHASE 5: Fix any remaining horizontal overlaps (safety sweep)
  // ============================================================
  // Group nodes by generation, sort by X, push right if too close.

  {
    const byGen = new Map<number, LNode[]>();
    for (const n of nodes) {
      const g = genOf.get(n.id) ?? 0;
      if (!byGen.has(g)) byGen.set(g, []);
      byGen.get(g)!.push(n);
    }

    for (const [, levelNodes] of byGen) {
      levelNodes.sort((a, b) => a.x - b.x);
      for (let i = 1; i < levelNodes.length; i++) {
        const prev = levelNodes[i - 1];
        const curr = levelNodes[i];
        // Skip couple pairs (they're intentionally close)
        if (curr.partnerId === prev.id || prev.partnerId === curr.id) continue;
        const minDist = MIN_NODE_DIST;
        if (curr.x - prev.x < minDist) {
          const shift = minDist - (curr.x - prev.x);
          // Shift current and everything to its right
          for (let j = i; j < levelNodes.length; j++) {
            levelNodes[j].x += shift;
          }
        }
      }
    }
  }

  // ============================================================
  // PHASE 6: Generate ALL connections from final node positions
  // ============================================================
  // Connections are computed AFTER all positions are finalized,
  // so they're always consistent with actual node coordinates.

  const conns: Conn[] = [];

  // 6a: Couple connections
  for (const m of state.marriages) {
    const n1 = nodeMap.get(m.spouse1Id);
    const n2 = nodeMap.get(m.spouse2Id);
    if (n1 && n2) {
      const left = n1.x < n2.x ? n1 : n2;
      const right = n1.x < n2.x ? n2 : n1;
      conns.push({
        x1: left.x, y1: left.y,
        x2: right.x, y2: right.y,
        type: 'couple',
        seed: hsh(left.id + right.id),
        depth: left.depth,
      });
    }
  }

  // 6b: Parent→child connections (trunk + branches)
  // Group children by their parent couple to create one trunk per family unit
  const familyUnits = new Map<string, { parentIds: string[]; childIds: string[] }>();

  for (const r of state.parentChildRelationships) {
    const parent = nodeMap.get(r.parentId);
    const child = nodeMap.get(r.childId);
    if (!parent || !child) continue;

    // Determine the "family key" = sorted parent couple IDs
    const sp = spouseOf(r.parentId);
    const hasPlacedSpouse = sp && nodeMap.has(sp) &&
      Math.abs(parent.y - nodeMap.get(sp)!.y) < 1; // same generation
    const parentPair = hasPlacedSpouse
      ? [r.parentId, sp!].sort()
      : [r.parentId];
    const fk = parentPair.join('+');

    if (!familyUnits.has(fk)) {
      familyUnits.set(fk, { parentIds: parentPair, childIds: [] });
    }
    const unit = familyUnits.get(fk)!;
    if (!unit.childIds.includes(r.childId)) {
      unit.childIds.push(r.childId);
    }
  }

  for (const [, unit] of familyUnits) {
    const parents = unit.parentIds.map(id => nodeMap.get(id)!).filter(Boolean);
    const children = unit.childIds.map(id => nodeMap.get(id)!).filter(Boolean);
    if (parents.length === 0 || children.length === 0) continue;

    // Parent center X
    const parentXs = parents.map(p => p.x);
    const parentCenterX = (Math.min(...parentXs) + Math.max(...parentXs)) / 2;
    const parentY = parents[0].y;
    const childY = children[0].y;

    // Direct branches from parent to each child (works for both descendants and ancestors).
    // The "tree base" (trunk + roots) is rendered as a single SVG anchored to the root person.
    const downward = parentY < childY;
    const startY = downward ? parentY + NODE_R : parentY - NODE_R;

    for (const child of children) {
      conns.push({
        x1: parentCenterX, y1: startY,
        x2: child.x, y2: childY - NODE_R,
        type: 'branch',
        seed: hsh(child.id + (downward ? '' : 'anc')),
        depth: child.depth,
      });
    }
  }

  // ============================================================
  // PHASE 6c: Place "extra" spouses (secondary marriages) as dangling leaves
  // ============================================================
  // An extra spouse is attached to their partner by a short dashed line
  // and drawn on the opposite side of the primary spouse (or left if no primary
  // was placed). Extras stack vertically when a person has multiple.
  const EXTRA_Y_OFFSET = 70;  // vertical stacking step between multiple extras
  const EXTRA_X_GAP = SOLO_WIDTH + CHILD_GAP;

  for (const [personId, extraIds] of extraSpousesMap) {
    const personNode = nodeMap.get(personId);
    if (!personNode) continue;

    const primaryId = primarySpouseMap.get(personId);
    const primaryNode = primaryId ? nodeMap.get(primaryId) : null;
    // Side opposite to the primary spouse; default to left (-1) when no primary on canvas.
    const sign = primaryNode
      ? (primaryNode.x > personNode.x ? -1 : 1)
      : -1;

    extraIds.forEach((extraId, idx) => {
      if (!pMap.has(extraId) || placed.has(extraId)) return;
      const extraX = personNode.x + sign * EXTRA_X_GAP;
      const extraY = personNode.y + EXTRA_Y_OFFSET * (idx + 1);
      const extraNode = mkNode(extraId, extraX, genOf.get(personId) ?? 0);
      extraNode.y = extraY; // override genY with offset
      addNode(extraNode);

      conns.push({
        x1: personNode.x, y1: personNode.y,
        x2: extraNode.x, y2: extraNode.y,
        type: 'extra-couple',
        seed: hsh(personId + extraId + 'extra'),
        depth: personNode.depth,
      });
    });
  }

  // ============================================================
  // PHASE 7: Normalize coordinates + add disconnected people
  // ============================================================
  if (nodes.length > 0) {
    let minY = Infinity, minX = Infinity;
    nodes.forEach(n => { if (n.y < minY) minY = n.y; if (n.x < minX) minX = n.x; });
    const yShift = INITIAL_Y - minY;
    const xShift = MIN_EDGE_X - minX;
    if (yShift !== 0 || xShift !== 0) {
      nodes.forEach(n => { n.x += xShift; n.y += yShift; });
      conns.forEach(c => {
        c.x1 += xShift; c.y1 += yShift;
        c.x2 += xShift; c.y2 += yShift;
      });
    }
  }

  const disconnected = state.people.filter(p => !placed.has(p.id));
  if (disconnected.length > 0) {
    let maxX = 0;
    nodes.forEach(n => { if (n.x > maxX) maxX = n.x; });
    let offsetX = maxX + 120;
    for (const p of disconnected) {
      nodes.push({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        born: p.birthDate || '',
        x: offsetX,
        y: INITIAL_Y,
        depth: 0,
        label: labels?.get(p.id),
      });
      offsetX += 100;
    }
  }

  return { nodes, conns };
}
