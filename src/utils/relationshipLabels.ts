import type { FamilyState } from '../types';

type StepKind = 'up' | 'down' | 'spouse';

interface BfsEntry {
  personId: string;
  path: StepKind[];
}

/**
 * BFS from root through the family graph. For each reachable person,
 * records the shortest path of steps and maps it to a Polish label.
 */
export function computeRelationshipLabels(
  rootId: string,
  state: FamilyState,
): Map<string, string> {
  const genderMap = new Map(state.people.map(p => [p.id, p.gender]));

  // Build adjacency
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
  const queue: BfsEntry[] = [{ personId: rootId, path: [] }];

  while (queue.length > 0) {
    const { personId, path } = queue.shift()!;

    if (path.length > 0) {
      const gender = genderMap.get(personId) ?? 'male';
      const label = pathToLabel(path, gender);
      if (label) result.set(personId, label);
    }

    // Parents (up)
    for (const pid of parentOf.get(personId) ?? []) {
      if (!visited.has(pid)) {
        visited.add(pid);
        queue.push({ personId: pid, path: [...path, 'up'] });
      }
    }

    // Children (down)
    for (const cid of childOf.get(personId) ?? []) {
      if (!visited.has(cid)) {
        visited.add(cid);
        queue.push({ personId: cid, path: [...path, 'down'] });
      }
    }

    // Spouses (spouse)
    for (const sid of spouseOf.get(personId) ?? []) {
      if (!visited.has(sid)) {
        visited.add(sid);
        queue.push({ personId: sid, path: [...path, 'spouse'] });
      }
    }
  }

  return result;
}

// ======================== PATH → LABEL ========================

function pathToLabel(path: StepKind[], gender: 'male' | 'female'): string {
  const m = gender === 'male';
  const key = path.join(',');

  // Direct relationships
  if (key === 'up') return m ? 'Ojciec' : 'Matka';
  if (key === 'down') return m ? 'Syn' : 'Córka';
  if (key === 'spouse') return m ? 'Mąż' : 'Żona';

  // Siblings
  if (key === 'up,down') return m ? 'Brat' : 'Siostra';

  // Grandparents / great-grandparents
  if (path.every(s => s === 'up')) {
    const depth = path.length;
    if (depth === 2) return m ? 'Dziadek' : 'Babcia';
    if (depth >= 3) {
      const prefix = 'Pra'.repeat(depth - 2);
      return m ? `${prefix}dziadek` : `${prefix}babcia`;
    }
  }

  // Grandchildren / great-grandchildren
  if (path.every(s => s === 'down')) {
    const depth = path.length;
    if (depth === 2) return m ? 'Wnuk' : 'Wnuczka';
    if (depth >= 3) {
      const prefix = 'Pra'.repeat(depth - 2);
      return m ? `${prefix}wnuk` : `${prefix}wnuczka`;
    }
  }

  // Uncle/Aunt: up, up, down
  if (key === 'up,up,down') return m ? 'Wuj' : 'Ciotka';

  // Cousin: up, up, down, down
  if (key === 'up,up,down,down') return m ? 'Kuzyn' : 'Kuzynka';

  // Great-uncle/aunt: up, up, up, down
  if (key === 'up,up,up,down') return m ? 'Dziadek stryjeczny' : 'Babcia stryjeczna';

  // Nephew/Niece: up, down, down
  if (key === 'up,down,down') return m ? 'Bratanek' : 'Bratanica';

  // In-laws through spouse
  if (key === 'spouse,up') return m ? 'Teść' : 'Teściowa';
  if (key === 'spouse,down') return m ? 'Pasierb' : 'Pasierbica';
  if (key === 'spouse,up,down') return m ? 'Szwagier' : 'Szwagierka';
  if (key === 'spouse,up,up') return m ? 'Dziadek żony/męża' : 'Babcia żony/męża';

  // Child's spouse
  if (key === 'down,spouse') return m ? 'Zięć' : 'Synowa';

  // Sibling's spouse
  if (key === 'up,down,spouse') return m ? 'Szwagier' : 'Szwagierka';

  // Parent's spouse (step-parent)
  if (key === 'up,spouse') return m ? 'Ojczym' : 'Macocha';

  // Spouse's sibling's spouse
  if (key === 'spouse,up,down,spouse') return m ? 'Szwagier' : 'Szwagierka';

  // Generic patterns: count ups, downs, spouse steps
  const ups = path.filter(s => s === 'up').length;
  const downs = path.filter(s => s === 'down').length;
  const spouses = path.filter(s => s === 'spouse').length;

  // Deep uncle/aunt: many ups then one down
  if (ups >= 3 && downs === 1 && spouses === 0 && isUpsThenDowns(path)) {
    const prefix = 'Pra'.repeat(ups - 2);
    return m ? `${prefix}wuj` : `${prefix}ciotka`;
  }

  // Deep cousin: equal ups and downs
  if (ups >= 2 && ups === downs && spouses === 0 && isUpsThenDowns(path)) {
    const prefix = ups > 2 ? `${ups - 1}. ` : '';
    return m ? `${prefix}Kuzyn` : `${prefix}Kuzynka`;
  }

  // Deep nephew/niece: one up then many downs
  if (ups === 1 && downs >= 2 && spouses === 0 && isUpsThenDowns(path)) {
    const prefix = 'Pra'.repeat(downs - 2);
    return m ? `${prefix}bratanek` : `${prefix}bratanica`;
  }

  // Fallback
  return m ? 'Krewny' : 'Krewna';
}

/** Check if path is all ups followed by all downs (no interleaving) */
function isUpsThenDowns(path: StepKind[]): boolean {
  let phase: 'up' | 'down' = 'up';
  for (const step of path) {
    if (step === 'spouse') return false;
    if (phase === 'up' && step === 'down') phase = 'down';
    if (phase === 'down' && step === 'up') return false;
  }
  return true;
}
