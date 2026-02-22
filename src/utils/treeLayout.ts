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
export type TreeMode = 'descendants' | 'ancestors';

export function detectTreeMode(state: FamilyState, rootId: string): TreeMode {
  const hasChildren = state.parentChildRelationships.some(r => r.parentId === rootId);
  if (hasChildren) return 'descendants';
  const hasParents = state.parentChildRelationships.some(r => r.childId === rootId);
  if (hasParents) return 'ancestors';
  return 'descendants';
}

// ======================== CONSTANTS ========================
export const NODE_R = 28;
export const GEN_H = 200;

// ======================== UTILS ========================
export function hsh(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 42;
}

// ======================== BUILD TREE ========================
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
      // Single parent case
      const childIds = getSoloChildren(id).filter(cid => !visited.has(cid));
      if (childIds.length > 0) {
        const children = childIds.map(cid => build(cid));
        p.partners = [{
          person: null,
          children,
        }];
      }
    }

    return p;
  }

  return build(rootId);
}

// ======================== BUILD ANCESTOR TREE ========================
export function buildAncestorTree(state: FamilyState, rootId: string): TreePerson {
  const pMap = new Map(state.people.map(p => [p.id, p]));
  const visited = new Set<string>();

  function getParentIds(childId: string): string[] {
    return state.parentChildRelationships
      .filter(r => r.childId === childId)
      .map(r => r.parentId)
      .filter(pid => pMap.has(pid));
  }

  function getSpouseId(id: string): string | null {
    const m = state.marriages.find(m => m.spouse1Id === id || m.spouse2Id === id);
    if (!m) return null;
    return m.spouse1Id === id ? m.spouse2Id : m.spouse1Id;
  }

  function build(id: string): TreePerson {
    visited.add(id);
    const row = pMap.get(id)!;
    const tp: TreePerson = {
      id: row.id,
      name: `${row.firstName} ${row.lastName}`,
      born: row.birthDate || '',
    };

    const parentIds = getParentIds(id).filter(pid => !visited.has(pid));

    if (parentIds.length >= 2) {
      // Check if first two parents are married — render as couple
      const sp = getSpouseId(parentIds[0]);
      if (sp === parentIds[1]) {
        visited.add(parentIds[0]);
        visited.add(parentIds[1]);
        const p1 = pMap.get(parentIds[0])!;
        const p2 = pMap.get(parentIds[1])!;

        // Each parent's own ancestors become "children" in the tree structure
        const p1Ancestors = getParentIds(parentIds[0]).filter(pid => !visited.has(pid)).map(pid => build(pid));
        const p2Ancestors = getParentIds(parentIds[1]).filter(pid => !visited.has(pid)).map(pid => build(pid));
        const allAncestors = [...p1Ancestors, ...p2Ancestors];

        // Model parent1 as main node, parent2 as partner, ancestors as children
        tp.partners = [{
          person: null,
          children: [{
            id: p1.id,
            name: `${p1.firstName} ${p1.lastName}`,
            born: p1.birthDate || '',
            partners: [{
              person: { id: p2.id, name: `${p2.firstName} ${p2.lastName}`, born: p2.birthDate || '' },
              children: allAncestors.length > 0 ? allAncestors : undefined,
            }],
          }],
        }];
      } else {
        // Unmarried parents — each rendered as separate branch
        tp.partners = [{
          person: null,
          children: parentIds.map(pid => build(pid)),
        }];
      }
    } else if (parentIds.length === 1) {
      // Single known parent
      visited.add(parentIds[0]);
      const parent = pMap.get(parentIds[0])!;
      const spId = getSpouseId(parentIds[0]);

      if (spId && !visited.has(spId) && pMap.has(spId)) {
        // Parent has a spouse (the other parent may not have a direct relationship to root)
        visited.add(spId);
        const sp = pMap.get(spId)!;
        const pAncestors = getParentIds(parentIds[0]).filter(pid => !visited.has(pid)).map(pid => build(pid));
        const spAncestors = getParentIds(spId).filter(pid => !visited.has(pid)).map(pid => build(pid));
        const allAncestors = [...pAncestors, ...spAncestors];

        tp.partners = [{
          person: null,
          children: [{
            id: parent.id,
            name: `${parent.firstName} ${parent.lastName}`,
            born: parent.birthDate || '',
            partners: [{
              person: { id: sp.id, name: `${sp.firstName} ${sp.lastName}`, born: sp.birthDate || '' },
              children: allAncestors.length > 0 ? allAncestors : undefined,
            }],
          }],
        }];
      } else {
        // Solo parent, no spouse
        tp.partners = [{
          person: null,
          children: [build(parentIds[0])],
        }];
      }
    }

    return tp;
  }

  return build(rootId);
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

  function subW(p: TreePerson): number {
    const kids = p.partners?.flatMap(pt => pt.children || []) || [];
    const myW = p.partners?.length && p.partners[0].person ? 160 : 80;
    if (!kids.length) return myW;
    return Math.max(myW, kids.reduce((s, c, i) => s + subW(c) + (i > 0 ? 40 : 0), 0));
  }

  function place(p: TreePerson, cx: number, y: number, d: number) {
    const hp = p.partners && p.partners.length > 0 && p.partners[0].person;

    if (hp) {
      // Couple layout
      const px = cx - 40;
      nodes.push({ id: p.id, name: p.name, born: p.born, x: px, y, depth: d });
      const pt = p.partners![0].person!;
      const ptx = cx + 40;
      nodes.push({ id: pt.id, name: pt.name, born: pt.born, x: ptx, y, depth: d, partnerId: p.id });
      conns.push({ x1: px, y1: y, x2: ptx, y2: y, type: 'couple', seed: hsh(p.id + pt.id), depth: d });

      const kids = p.partners![0].children || [];
      if (kids.length) {
        const trunkLen = d === 0 ? 120 : 60;
        const mid = (px + ptx) / 2;
        const ty2 = y + NODE_R + trunkLen;
        // Trunk from couple midpoint (both are parents)
        conns.push({ x1: mid, y1: y + NODE_R + 4, x2: mid, y2: ty2, type: 'trunk', seed: hsh(p.id + 't'), depth: d });

        const tw = kids.reduce((s, c, i) => s + subW(c) + (i > 0 ? 40 : 0), 0);
        let cl = mid - tw / 2;
        kids.forEach(ch => {
          const cw = subW(ch);
          const cc = cl + cw / 2;
          // If child has a partner, branch targets the child node (cc - 40), not the couple center
          const hasPartner = ch.partners && ch.partners.length > 0 && ch.partners[0].person;
          const branchTarget = hasPartner ? cc - 40 : cc;
          const genH = d === 0 ? GEN_H + 60 : GEN_H;
          conns.push({ x1: mid, y1: ty2, x2: branchTarget, y2: y + genH - NODE_R - 4, type: 'branch', seed: hsh(ch.id), depth: d + 1 });
          place(ch, cc, y + genH, d + 1);
          cl += cw + 40;
        });
      }
    } else {
      // Solo node (single parent or leaf)
      nodes.push({ id: p.id, name: p.name, born: p.born, x: cx, y, depth: d });

      const kids = p.partners?.[0]?.children || [];
      if (kids.length) {
        const trunkLen = d === 0 ? 120 : 60;
        const ty2 = y + NODE_R + trunkLen;
        conns.push({ x1: cx, y1: y + NODE_R + 4, x2: cx, y2: ty2, type: 'trunk', seed: hsh(p.id + 't'), depth: d });

        const tw = kids.reduce((s, c, i) => s + subW(c) + (i > 0 ? 40 : 0), 0);
        let cl = cx - tw / 2;
        kids.forEach(ch => {
          const cw = subW(ch);
          const cc = cl + cw / 2;
          const hasPartner = ch.partners && ch.partners.length > 0 && ch.partners[0].person;
          const branchTarget = hasPartner ? cc - 40 : cc;
          const genH = d === 0 ? GEN_H + 60 : GEN_H;
          conns.push({ x1: cx, y1: ty2, x2: branchTarget, y2: y + genH - NODE_R - 4, type: 'branch', seed: hsh(ch.id), depth: d + 1 });
          place(ch, cc, y + genH, d + 1);
          cl += cw + 40;
        });
      }
    }
  }

  place(tree, subW(tree) / 2 + 50, 80, 0);

  // Normalize: shift all to ensure minimum x is at 60
  let mn = Infinity;
  nodes.forEach(n => { if (n.x < mn) mn = n.x; });
  const sh = 60 - mn;
  nodes.forEach(n => (n.x += sh));
  conns.forEach(c => { c.x1 += sh; c.x2 += sh; });

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
