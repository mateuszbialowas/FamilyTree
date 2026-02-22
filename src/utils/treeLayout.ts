import type { FamilyState } from '../types';

// ======================== TYPES ========================
export interface TreePerson {
  id: string;
  name: string;
  born: string;
  partners?: { person: TreePerson | null; children?: TreePerson[] }[];
}

export interface LNode {
  id: string;
  name: string;
  born: string;
  x: number;
  y: number;
  depth: number;
  partnerId?: string;
}

export interface Conn {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'couple' | 'trunk' | 'branch';
  seed: number;
  depth: number;
}

// ======================== TREE MODE ========================
export type TreeMode = 'descendants' | 'ancestors' | 'both';

export function detectTreeMode(state: FamilyState, rootId: string): TreeMode {
  const hasChildren = state.parentChildRelationships.some(r => r.parentId === rootId);
  const hasParents = state.parentChildRelationships.some(r => r.childId === rootId);
  // Use 'both' whenever there are parents — the branch-based ancestor layout
  // handles all cases (with or without children) correctly.
  if (hasParents) return 'both';
  if (hasChildren) return 'descendants';
  return 'descendants';
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

/** Trunk length from root-level nodes (longer for visual prominence) */
const ROOT_TRUNK_LEN = 120;

/** Trunk length from deeper-level nodes */
const INNER_TRUNK_LEN = 60;

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

// ======================== UTILS ========================
export function hsh(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 42;
}

// ======================== BUILD TREE (DESCENDANTS) ========================
export function buildTree(state: FamilyState, rootId: string): TreePerson {
  const pMap = new Map(state.people.map(p => [p.id, p]));

  function getSpouse(id: string): string | null {
    const m = state.marriages.find(m => m.spouse1Id === id || m.spouse2Id === id);
    if (!m) return null;
    return m.spouse1Id === id ? m.spouse2Id : m.spouse1Id;
  }

  function getCoupleChildren(p1: string, p2: string): string[] {
    const kids = new Set<string>();
    state.parentChildRelationships
      .filter(r => r.parentId === p1 || r.parentId === p2)
      .forEach(r => kids.add(r.childId));
    return [...kids];
  }

  function getSoloChildren(pid: string): string[] {
    return state.parentChildRelationships
      .filter(r => r.parentId === pid)
      .map(r => r.childId);
  }

  const visited = new Set<string>();

  function build(id: string): TreePerson {
    visited.add(id);
    const row = pMap.get(id)!;
    const p: TreePerson = {
      id: row.id,
      name: `${row.firstName} ${row.lastName}`,
      born: row.birthDate || '',
    };

    const spouseId = getSpouse(id);
    if (spouseId && !visited.has(spouseId)) {
      visited.add(spouseId);
      const sp = pMap.get(spouseId)!;
      const childIds = getCoupleChildren(id, spouseId);
      const children = childIds.map(cid => build(cid));
      p.partners = [{
        person: { id: sp.id, name: `${sp.firstName} ${sp.lastName}`, born: sp.birthDate || '' },
        children: children.length > 0 ? children : undefined,
      }];
    } else {
      const childIds = getSoloChildren(id).filter(cid => !visited.has(cid));
      if (childIds.length > 0) {
        const children = childIds.map(cid => build(cid));
        p.partners = [{ person: null, children }];
      }
    }

    return p;
  }

  return build(rootId);
}

// ======================== BUILD ANCESTOR TREE ========================
/**
 * Builds the ancestor tree where each parent is an independent subtree.
 * Married parents are NOT grouped into couples here — each parent carries
 * their own ancestors as children. Couple connections are added post-layout
 * via `addAncestorCoupleConns`.
 */
export function buildAncestorTree(state: FamilyState, rootId: string): TreePerson {
  const pMap = new Map(state.people.map(p => [p.id, p]));
  const visited = new Set<string>();

  function getParentIds(childId: string): string[] {
    return state.parentChildRelationships
      .filter(r => r.childId === childId)
      .map(r => r.parentId)
      .filter(pid => pMap.has(pid));
  }

  function makePerson(id: string): TreePerson {
    const row = pMap.get(id)!;
    return { id: row.id, name: `${row.firstName} ${row.lastName}`, born: row.birthDate || '' };
  }

  function build(id: string): TreePerson {
    visited.add(id);
    const tp = makePerson(id);
    const parentIds = getParentIds(id).filter(pid => !visited.has(pid));

    if (parentIds.length > 0) {
      // Each parent is built independently with their own ancestors
      tp.partners = [{
        person: null,
        children: parentIds.map(pid => build(pid)),
      }];
    }

    return tp;
  }

  return build(rootId);
}

/**
 * After laying out an ancestor tree, detect married pairs among the nodes
 * and add couple connections between them.
 */
export function addAncestorCoupleConns(nodes: LNode[], state: FamilyState): Conn[] {
  const conns: Conn[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  for (const m of state.marriages) {
    const n1 = nodeMap.get(m.spouse1Id);
    const n2 = nodeMap.get(m.spouse2Id);
    // Only connect if both are in the tree and on the same Y level (same generation)
    if (n1 && n2 && Math.abs(n1.y - n2.y) < 1) {
      conns.push({
        x1: n1.x, y1: n1.y,
        x2: n2.x, y2: n2.y,
        type: 'couple',
        seed: hsh(n1.id + n2.id),
        depth: n1.depth,
      });
    }
  }

  return conns;
}

// ======================== FLIP LAYOUT Y ========================
export function flipLayoutY(nodes: LNode[], conns: Conn[]): { nodes: LNode[]; conns: Conn[] } {
  let minY = Infinity, maxY = -Infinity;
  nodes.forEach(n => { if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y; });
  conns.forEach(c => {
    const ys = [c.y1, c.y2];
    ys.forEach(y => { if (y < minY) minY = y; if (y > maxY) maxY = y; });
  });

  if (minY === Infinity) return { nodes, conns };

  const axisY = (minY + maxY) / 2;
  const flip = (y: number) => 2 * axisY - y;

  return {
    nodes: nodes.map(n => ({ ...n, y: flip(n.y) })),
    conns: conns.map(c => ({ ...c, y1: flip(c.y1), y2: flip(c.y2) })),
  };
}

// ======================== LAYOUT ========================
export function layoutTree(tree: TreePerson): { nodes: LNode[]; conns: Conn[] } {
  const nodes: LNode[] = [];
  const conns: Conn[] = [];

  /** Calculate the total horizontal width needed for a subtree */
  function subW(p: TreePerson): number {
    const kids = p.partners?.flatMap(pt => pt.children || []) || [];
    const hasPartner = p.partners?.length && p.partners[0].person;
    const myW = hasPartner ? COUPLE_WIDTH : SOLO_WIDTH;
    if (!kids.length) return myW;
    return Math.max(myW, kids.reduce((s, c, i) => s + subW(c) + (i > 0 ? CHILD_GAP : 0), 0));
  }

  /**
   * Place children below a parent node/couple.
   * Shared by both couple and solo parent layouts to avoid duplication.
   */
  function placeChildren(
    kids: TreePerson[],
    parentX: number,
    parentY: number,
    parentSeed: string,
    depth: number,
  ) {
    const trunkLen = depth === 0 ? ROOT_TRUNK_LEN : INNER_TRUNK_LEN;
    const trunkBottom = parentY + NODE_R + trunkLen;

    // Trunk connection: vertical line from parent down to branch junction
    conns.push({
      x1: parentX,
      y1: parentY + NODE_R + TRUNK_OFFSET,
      x2: parentX,
      y2: trunkBottom,
      type: 'trunk',
      seed: hsh(parentSeed + 't'),
      depth,
    });

    // Calculate total width of all children
    const totalWidth = kids.reduce((s, c, i) => s + subW(c) + (i > 0 ? CHILD_GAP : 0), 0);
    let cursorLeft = parentX - totalWidth / 2;

    const genH = depth === 0 ? GEN_H + ROOT_GEN_EXTRA_H : GEN_H;

    kids.forEach(child => {
      const childWidth = subW(child);
      const childCenter = cursorLeft + childWidth / 2;
      const hasPartner = child.partners && child.partners.length > 0 && child.partners[0].person;
      // If child has a partner, branch targets the child node (left of couple center)
      const branchTarget = hasPartner ? childCenter - COUPLE_SPACING : childCenter;

      conns.push({
        x1: parentX,
        y1: trunkBottom,
        x2: branchTarget,
        y2: parentY + genH - NODE_R - TRUNK_OFFSET,
        type: 'branch',
        seed: hsh(child.id),
        depth: depth + 1,
      });

      place(child, childCenter, parentY + genH, depth + 1);
      cursorLeft += childWidth + CHILD_GAP;
    });
  }

  /** Recursively place a person (and their partner/children) at the given position */
  function place(p: TreePerson, cx: number, y: number, d: number) {
    const hasPartner = p.partners && p.partners.length > 0 && p.partners[0].person;
    const kids = hasPartner
      ? (p.partners![0].children || [])
      : (p.partners?.[0]?.children || []);

    if (hasPartner) {
      // Couple layout: person on the left, partner on the right
      const px = cx - COUPLE_SPACING;
      const ptx = cx + COUPLE_SPACING;
      const pt = p.partners![0].person!;

      nodes.push({ id: p.id, name: p.name, born: p.born, x: px, y, depth: d });
      nodes.push({ id: pt.id, name: pt.name, born: pt.born, x: ptx, y, depth: d, partnerId: p.id });
      conns.push({ x1: px, y1: y, x2: ptx, y2: y, type: 'couple', seed: hsh(p.id + pt.id), depth: d });

      if (kids.length) {
        const coupleCenter = (px + ptx) / 2;
        placeChildren(kids, coupleCenter, y, p.id, d);
      }
    } else {
      // Solo node
      nodes.push({ id: p.id, name: p.name, born: p.born, x: cx, y, depth: d });

      if (kids.length) {
        placeChildren(kids, cx, y, p.id, d);
      }
    }
  }

  // Start layout: place root centered with margin
  place(tree, subW(tree) / 2 + INITIAL_MARGIN, INITIAL_Y, 0);

  // Normalize: shift all nodes so the leftmost is at MIN_EDGE_X
  let minX = Infinity;
  nodes.forEach(n => { if (n.x < minX) minX = n.x; });
  const shift = MIN_EDGE_X - minX;
  nodes.forEach(n => (n.x += shift));
  conns.forEach(c => { c.x1 += shift; c.x2 += shift; });

  return { nodes, conns };
}

// ======================== GET VISITED IDS ========================
export function getTreePersonIds(tree: TreePerson): Set<string> {
  const ids = new Set<string>();
  function collect(p: TreePerson) {
    ids.add(p.id);
    p.partners?.forEach(pt => {
      if (pt.person) ids.add(pt.person.id);
      pt.children?.forEach(collect);
    });
  }
  collect(tree);
  return ids;
}
