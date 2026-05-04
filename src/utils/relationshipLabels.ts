import type { FamilyState } from '../types';
import { getKinshipLabels, type KinshipLabels } from './kinshipLabels';

type StepKind = 'up' | 'down' | 'spouse';
export type LabelMode = 'colloquial' | 'formal';

interface BfsEntry {
  personId: string;
  path: StepKind[];
  /** IDs of persons visited along the path (excluding root, including current) */
  nodeIds: string[];
}

/**
 * BFS from root through the family graph. For each reachable person,
 * records the shortest path of steps and maps it to a localized label
 * via the per-locale `KinshipLabels` dictionary.
 */
export function computeRelationshipLabels(
  rootId: string,
  state: FamilyState,
  mode: LabelMode = 'colloquial',
): Map<string, string> {
  const genderMap = new Map(state.people.map((p) => [p.id, p.gender]));
  const labels = getKinshipLabels();

  const parentOf = new Map<string, string[]>();
  const childOf = new Map<string, string[]>();
  for (const r of state.parentChildRelationships) {
    if (!childOf.has(r.parentId)) childOf.set(r.parentId, []);
    childOf.get(r.parentId)!.push(r.childId);
    if (!parentOf.has(r.childId)) parentOf.set(r.childId, []);
    parentOf.get(r.childId)!.push(r.parentId);
  }

  const spouseOf = new Map<string, string[]>();
  for (const m of state.marriages) {
    if (!spouseOf.has(m.spouse1Id)) spouseOf.set(m.spouse1Id, []);
    spouseOf.get(m.spouse1Id)!.push(m.spouse2Id);
    if (!spouseOf.has(m.spouse2Id)) spouseOf.set(m.spouse2Id, []);
    spouseOf.get(m.spouse2Id)!.push(m.spouse1Id);
  }

  const result = new Map<string, string>();
  const visited = new Set<string>([rootId]);
  const queue: BfsEntry[] = [{ personId: rootId, path: [], nodeIds: [] }];

  while (queue.length > 0) {
    const { personId, path, nodeIds } = queue.shift()!;

    if (path.length > 0) {
      const gender = genderMap.get(personId) ?? 'male';
      const label = pathToLabel(path, gender, nodeIds, genderMap, mode, labels);
      if (label) result.set(personId, label);
    }

    for (const pid of parentOf.get(personId) ?? []) {
      if (!visited.has(pid)) {
        visited.add(pid);
        queue.push({ personId: pid, path: [...path, 'up'], nodeIds: [...nodeIds, pid] });
      }
    }

    for (const cid of childOf.get(personId) ?? []) {
      if (!visited.has(cid)) {
        visited.add(cid);
        queue.push({ personId: cid, path: [...path, 'down'], nodeIds: [...nodeIds, cid] });
      }
    }

    for (const sid of spouseOf.get(personId) ?? []) {
      if (!visited.has(sid)) {
        visited.add(sid);
        queue.push({ personId: sid, path: [...path, 'spouse'], nodeIds: [...nodeIds, sid] });
      }
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────
//  Path → label
//  All paths interpreted from the root's perspective. `gender` is the
//  gender of the *target* person (the one being labeled).
// ─────────────────────────────────────────────────────────────────────

function pathToLabel(
  path: StepKind[],
  gender: 'male' | 'female',
  nodeIds: string[],
  genderMap: Map<string, 'male' | 'female'>,
  _mode: LabelMode,
  L: KinshipLabels,
): string {
  const f = gender === 'female';
  const key = path.join(',');

  // ── Direct ──
  if (key === 'up') return f ? L.mother : L.father;
  if (key === 'down') return f ? L.daughter : L.son;
  if (key === 'spouse') return f ? L.wife : L.husband;

  // ── Sibling ──
  if (key === 'up,down') return f ? L.sister : L.brother;

  // ── Pure ancestors ──
  if (path.every((s) => s === 'up')) {
    return L.ancestor(path.length - 2, f);
  }

  // ── Pure descendants ──
  if (path.every((s) => s === 'down')) {
    return L.descendant(path.length - 2, f);
  }

  // ── Uncle / aunt (parent's sibling) ──
  if (key === 'up,up,down') return f ? L.aunt : L.uncle;

  // ── Nephew / niece (sibling's child) ──
  if (key === 'up,down,down') {
    const sibGender = nodeIds.length >= 2 ? genderMap.get(nodeIds[1]) : undefined;
    const sisterChild = sibGender === 'female' ? true : sibGender === 'male' ? false : null;
    return f ? L.niece(sisterChild) : L.nephew(sisterChild);
  }

  // ── Cousin ──
  if (key === 'up,up,down,down') return L.cousin(f);

  // ── Great-uncle / great-aunt ──
  if (key === 'up,up,up,down') return f ? L.aunt : L.uncle;

  // ── Cousin's child ──
  if (key === 'up,up,down,down,down') return f ? L.niece(null) : L.nephew(null);

  // ── Parent's cousin ──
  if (key === 'up,up,up,down,down') return L.cousin(f);

  // ── Second cousin ──
  if (key === 'up,up,up,down,down,down') return L.cousinNumbered(2, f);

  // ── Sibling's grandchild ──
  if (key === 'up,down,down,down') {
    const sibGender = nodeIds.length >= 2 ? genderMap.get(nodeIds[1]) : undefined;
    const sf = sibGender === 'female' ? true : sibGender === 'male' ? false : null;
    return L.siblingGrandchild(sf, f);
  }

  // ═══════════════════════════════════════════
  // IN-LAW RELATIONSHIPS
  // ═══════════════════════════════════════════

  if (key === 'spouse,up') return f ? L.motherInLaw : L.fatherInLaw;
  if (key === 'spouse,down') return f ? L.stepdaughter : L.stepson;
  if (key === 'spouse,up,down') return f ? L.sisterInLaw : L.brotherInLaw;
  if (key === 'spouse,up,up') return f ? L.spousesGrandmother(0) : L.spousesGrandfather(0);
  if (key === 'spouse,up,up,down') return f ? L.spousesAunt : L.spousesUncle;
  if (key === 'spouse,up,down,down') return f ? L.spousesNiece : L.spousesNephew;

  if (key === 'down,spouse') return f ? L.daughterInLaw : L.sonInLaw;
  if (key === 'down,down,spouse') return f ? L.grandsonWife : L.granddaughterHusband;
  if (key === 'up,down,spouse') return f ? L.sisterInLaw : L.brotherInLaw;
  if (key === 'up,spouse') return f ? L.stepmother : L.stepfather;
  if (key === 'up,spouse,down') return f ? L.halfSister : L.halfBrother;
  if (key === 'spouse,up,down,spouse') return f ? L.sisterInLaw : L.brotherInLaw;
  if (key === 'up,up,down,spouse') return f ? L.aunt : L.uncle;
  if (key === 'up,up,down,down,spouse') return f ? L.cousinWife : L.cousinHusband;
  if (key === 'up,down,down,spouse') return f ? L.nephewWife : L.nieceHusband;
  if (key === 'up,down,down,down,spouse') return L.siblingGrandchildSpouse(f);

  // ═══════════════════════════════════════════
  // GENERIC PATTERNS
  // ═══════════════════════════════════════════

  const ups = path.filter((s) => s === 'up').length;
  const downs = path.filter((s) => s === 'down').length;
  const spouses = path.filter((s) => s === 'spouse').length;

  // ── Blood (no spouse step) ──
  if (spouses === 0 && isUpsThenDowns(path)) {
    if (ups > downs) {
      const diff = ups - downs;
      if (diff === 1) return f ? L.aunt : L.uncle;
      return f ? L.aunt : L.uncle;
    }
    if (ups === downs && ups >= 2) {
      if (ups === 2) return L.cousin(f);
      return L.cousinNumbered(ups - 1, f);
    }
    if (downs > ups && downs - ups === 1) {
      return f ? L.niece(null) : L.nephew(null);
    }
    if (ups >= 2 && downs >= 2 && ups !== downs) return L.cousin(f);
  }

  // ── Blood + trailing spouse ──
  if (spouses === 1 && isUpsThenDownsThenSpouse(path) && downs > 0) {
    if (ups > downs) return f ? L.aunt : L.uncle;
    if (ups === downs && ups >= 2) return f ? L.cousinWife : L.cousinHusband;
    if (downs > ups) return f ? L.nephewWife : L.nieceHusband;
  }

  // ── Spouse's blood relatives ──
  if (spouses === 1 && path[0] === 'spouse' && isUpsThenDowns(path.slice(1))) {
    if (ups > 0 && downs === 0) {
      if (ups === 1) return f ? L.motherInLaw : L.fatherInLaw;
      return f ? L.spousesGrandmother(ups - 2) : L.spousesGrandfather(ups - 2);
    }
    if (ups === 0 && downs > 0) {
      if (downs === 1) return f ? L.stepdaughter : L.stepson;
      if (downs === 2) return f ? L.spousesGranddaughter(0) : L.spousesGrandson(0);
      return L.spousesDescendant(f);
    }
    if (ups === 1 && downs === 1) return f ? L.sisterInLaw : L.brotherInLaw;
    if (ups > downs && ups - downs === 1) return f ? L.spousesAunt : L.spousesUncle;
    if (ups === downs && ups >= 2) return L.spousesCousin(f);
    if (downs > ups) return f ? L.spousesNiece : L.spousesNephew;
  }

  // ── Descendant's spouse ──
  if (spouses === 1 && ups === 0 && path[path.length - 1] === 'spouse') {
    if (downs === 1) return f ? L.daughterInLaw : L.sonInLaw;
    if (downs === 2) return f ? L.grandsonWife : L.granddaughterHusband;
    return L.descendantSpouse(f);
  }

  // ── Ancestor's spouse ──
  if (spouses === 1 && downs === 0 && path[path.length - 1] === 'spouse') {
    if (ups === 1) return f ? L.stepmother : L.stepfather;
    return L.ancestor(ups - 2, f);
  }

  // ── Step-parent's relatives ──
  if (spouses === 1 && path[0] === 'up' && path[1] === 'spouse') {
    const rest = path.slice(2);
    const restUps = rest.filter((s) => s === 'up').length;
    const restDowns = rest.filter((s) => s === 'down').length;

    if (rest.length === 0) return f ? L.stepmother : L.stepfather;

    if (restDowns === 0 && restUps > 0) return L.ancestor(restUps - 1, f);
    if (restUps === 0 && restDowns > 0) {
      if (restDowns === 1) return f ? L.halfSister : L.halfBrother;
      return L.spousesHalfRelative(f);
    }
    if (isUpsThenDowns(rest)) {
      if (restUps > restDowns && restUps - restDowns === 1) return f ? L.aunt : L.uncle;
      if (restUps === restDowns && restUps >= 1) {
        if (restUps === 1) return f ? L.halfSister : L.halfBrother;
        return L.cousin(f);
      }
      if (restDowns > restUps) return f ? L.niece(null) : L.nephew(null);
    }
  }

  // ── Generic in-law ──
  if (spouses >= 1) return L.inLaw(f);

  return L.relative(f);
}

function isUpsThenDowns(path: StepKind[]): boolean {
  let phase: 'up' | 'down' = 'up';
  for (const step of path) {
    if (step === 'spouse') return false;
    if (phase === 'up' && step === 'down') phase = 'down';
    if (phase === 'down' && step === 'up') return false;
  }
  return true;
}

function isUpsThenDownsThenSpouse(path: StepKind[]): boolean {
  if (path.length < 3 || path[path.length - 1] !== 'spouse') return false;
  return isUpsThenDowns(path.slice(0, -1));
}
