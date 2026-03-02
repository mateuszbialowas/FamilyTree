import type { FamilyState } from '../types';

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
 * records the shortest path of steps and maps it to a Polish label.
 *
 * @param mode 'colloquial' — potoczne nazwy (drzewo), 'formal' — literackie (szczegóły)
 */
export function computeRelationshipLabels(
  rootId: string,
  state: FamilyState,
  mode: LabelMode = 'colloquial',
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
  const queue: BfsEntry[] = [{ personId: rootId, path: [], nodeIds: [] }];

  while (queue.length > 0) {
    const { personId, path, nodeIds } = queue.shift()!;

    if (path.length > 0) {
      const gender = genderMap.get(personId) ?? 'male';
      const label = pathToLabel(path, gender, nodeIds, genderMap, mode);
      if (label) result.set(personId, label);
    }

    // Parents (up)
    for (const pid of parentOf.get(personId) ?? []) {
      if (!visited.has(pid)) {
        visited.add(pid);
        queue.push({ personId: pid, path: [...path, 'up'], nodeIds: [...nodeIds, pid] });
      }
    }

    // Children (down)
    for (const cid of childOf.get(personId) ?? []) {
      if (!visited.has(cid)) {
        visited.add(cid);
        queue.push({ personId: cid, path: [...path, 'down'], nodeIds: [...nodeIds, cid] });
      }
    }

    // Spouses (spouse)
    for (const sid of spouseOf.get(personId) ?? []) {
      if (!visited.has(sid)) {
        visited.add(sid);
        queue.push({ personId: sid, path: [...path, 'spouse'], nodeIds: [...nodeIds, sid] });
      }
    }
  }

  return result;
}

// ======================== PATH → LABEL ========================

function pathToLabel(
  path: StepKind[],
  gender: 'male' | 'female',
  nodeIds: string[],
  genderMap: Map<string, 'male' | 'female'>,
  mode: LabelMode,
): string {
  const m = gender === 'male';
  const f = mode === 'formal';
  const key = path.join(',');

  // ── Direct relationships (same in both modes) ──
  if (key === 'up') return m ? 'Ojciec' : 'Matka';
  if (key === 'down') return m ? 'Syn' : 'Córka';
  if (key === 'spouse') return m ? 'Mąż' : 'Żona';

  // ── Siblings ──
  if (key === 'up,down') return m ? 'Brat' : 'Siostra';

  // ── Ancestors (all ups) ──
  if (path.every(s => s === 'up')) {
    const d = path.length;
    if (d === 2) return m ? 'Dziadek' : 'Babcia';
    const prefix = 'Pra'.repeat(d - 2);
    return m ? `${prefix}dziadek` : `${prefix}babcia`;
  }

  // ── Descendants (all downs) ──
  if (path.every(s => s === 'down')) {
    const d = path.length;
    if (d === 2) return m ? 'Wnuk' : 'Wnuczka';
    const prefix = 'Pra'.repeat(d - 2);
    return m ? `${prefix}wnuk` : `${prefix}wnuczka`;
  }

  // ── Uncle / Aunt (blood) ──
  if (key === 'up,up,down') return m ? 'Wuj' : 'Ciotka';

  // ── Nephew / Niece ──
  if (key === 'up,down,down') {
    const sibGender = nodeIds.length >= 2 ? genderMap.get(nodeIds[1]) : undefined;
    if (sibGender === 'female') return m ? 'Siostrzeniec' : 'Siostrzenica';
    return m ? 'Bratanek' : 'Bratanica';
  }

  // ── Cousins ──
  if (key === 'up,up,down,down') return m ? 'Kuzyn' : 'Kuzynka';

  // ── Great-uncle / Great-aunt ──
  if (key === 'up,up,up,down') {
    if (f) return m ? 'Dziadek stryjeczny' : 'Babcia stryjeczna';
    return m ? 'Wujek' : 'Ciocia';
  }

  // ── Cousin's child ──
  if (key === 'up,up,down,down,down') {
    if (f) return m ? 'Cioteczny bratanek' : 'Cioteczna bratanica';
    return m ? 'Bratanek' : 'Bratanica';
  }

  // ── Parent's cousin ──
  if (key === 'up,up,up,down,down') {
    if (f) {
      const firstUpIdx = path.indexOf('up');
      if (firstUpIdx >= 0 && firstUpIdx < nodeIds.length) {
        const pg = genderMap.get(nodeIds[firstUpIdx]);
        if (pg === 'female') return m ? 'Kuzyn matki' : 'Kuzynka matki';
        if (pg === 'male') return m ? 'Kuzyn ojca' : 'Kuzynka ojca';
      }
      return m ? 'Kuzyn rodzica' : 'Kuzynka rodzica';
    }
    return m ? 'Kuzyn' : 'Kuzynka';
  }

  // ── Second cousin ──
  if (key === 'up,up,up,down,down,down') return m ? '2. Kuzyn' : '2. Kuzynka';

  // ── Sibling's grandchild ──
  if (key === 'up,down,down,down') {
    const sibGender = nodeIds.length >= 2 ? genderMap.get(nodeIds[1]) : undefined;
    const sibLabel = sibGender === 'female' ? 'siostry' : sibGender === 'male' ? 'brata' : 'brata/siostry';
    return m ? `Wnuk ${sibLabel}` : `Wnuczka ${sibLabel}`;
  }

  // ═══════════════════════════════════════════
  // IN-LAW RELATIONSHIPS (with spouse step)
  // ═══════════════════════════════════════════

  // ── Spouse's parents ──
  if (key === 'spouse,up') return m ? 'Teść' : 'Teściowa';

  // ── Spouse's child (step-child) ──
  if (key === 'spouse,down') return m ? 'Pasierb' : 'Pasierbica';

  // ── Spouse's sibling ──
  if (key === 'spouse,up,down') return m ? 'Szwagier' : 'Szwagierka';

  // ── Spouse's grandparent ──
  if (key === 'spouse,up,up') return m ? 'Dziadek małżonka' : 'Babcia małżonka';

  // ── Spouse's uncle/aunt ──
  if (key === 'spouse,up,up,down') return m ? 'Wuj małżonka' : 'Ciotka małżonka';

  // ── Spouse's sibling's child (spouse's nephew) ──
  if (key === 'spouse,up,down,down') return m ? 'Bratanek małżonka' : 'Bratanica małżonka';

  // ── Child's spouse ──
  if (key === 'down,spouse') return m ? 'Zięć' : 'Synowa';

  // ── Grandchild's spouse ──
  if (key === 'down,down,spouse') return m ? 'Mąż wnuczki' : 'Żona wnuka';

  // ── Sibling's spouse (brother/sister-in-law) ──
  if (key === 'up,down,spouse') return m ? 'Szwagier' : 'Szwagierka';

  // ── Parent's spouse (step-parent) ──
  if (key === 'up,spouse') return m ? 'Ojczym' : 'Macocha';

  // ── Parent's spouse's child (step-sibling) ──
  if (key === 'up,spouse,down') return m ? 'Brat przyrodni' : 'Siostra przyrodnia';

  // ── Spouse's sibling's spouse ──
  if (key === 'spouse,up,down,spouse') return m ? 'Szwagier' : 'Szwagierka';

  // ── Uncle/Aunt by marriage (spouse of wuj/ciotka) ──
  if (key === 'up,up,down,spouse') return m ? 'Wujek' : 'Ciotka';

  // ── Cousin's spouse ──
  if (key === 'up,up,down,down,spouse') return m ? 'Mąż kuzynki' : 'Żona kuzyna';

  // ── Nephew's/Niece's spouse ──
  if (key === 'up,down,down,spouse') return m ? 'Mąż bratanicy' : 'Żona bratanka';

  // ── Sibling's grandchild's spouse ──
  if (key === 'up,down,down,down,spouse') return m ? 'Małżonek wnuka rodzeństwa' : 'Małżonka wnuka rodzeństwa';

  // ═══════════════════════════════════════════
  // GENERIC PATTERNS (for deep/unusual paths)
  // ═══════════════════════════════════════════

  const ups = path.filter(s => s === 'up').length;
  const downs = path.filter(s => s === 'down').length;
  const spouses = path.filter(s => s === 'spouse').length;

  // ── Blood relationships (no spouse step) ──
  if (spouses === 0 && isUpsThenDowns(path)) {
    // Uncle/Aunt at any depth: more ups than downs
    if (ups > downs) {
      const diff = ups - downs;
      if (diff === 1) {
        if (ups === 2) return m ? 'Wuj' : 'Ciotka';
        if (f) {
          const prefix = 'Pra'.repeat(ups - 2);
          return m ? `${prefix}wuj` : `${prefix}ciotka`;
        }
        return m ? 'Wujek' : 'Ciocia';
      }
      // diff >= 2
      if (f) {
        const prefix = diff > 2 ? 'Pra'.repeat(diff - 2) : '';
        return m ? `${prefix}Dziadek stryjeczny` : `${prefix}Babcia stryjeczna`;
      }
      return m ? 'Wujek' : 'Ciocia';
    }

    // Cousin at any depth: equal ups and downs
    if (ups === downs && ups >= 2) {
      if (ups === 2) return m ? 'Kuzyn' : 'Kuzynka';
      if (f) return m ? `${ups - 1}. Kuzyn` : `${ups - 1}. Kuzynka`;
      return m ? 'Kuzyn' : 'Kuzynka';
    }

    // Nephew/Niece at any depth: more downs than ups, diff == 1
    if (downs > ups && downs - ups === 1) {
      if (ups === 1 && downs === 2) return m ? 'Bratanek' : 'Bratanica';
      if (f) {
        const prefix = ups > 1 ? 'Cioteczny ' : '';
        const suffix = downs > 2 ? ` ${downs - 1}. stopnia` : '';
        return m ? `${prefix}Bratanek${suffix}` : `${prefix}Bratanica${suffix}`;
      }
      return m ? 'Bratanek' : 'Bratanica';
    }

    // Cousin once removed (ups != downs, diff > 1)
    if (ups >= 2 && downs >= 2 && ups !== downs) {
      if (f) {
        const cousinDeg = Math.min(ups, downs) - 1;
        const removed = Math.abs(ups - downs);
        const deg = cousinDeg > 1 ? `${cousinDeg}. ` : '';
        return m
          ? `${deg}Kuzyn ${removed}x usunięty`
          : `${deg}Kuzynka ${removed}x usunięta`;
      }
      return m ? 'Kuzyn' : 'Kuzynka';
    }
  }

  // ── By marriage: blood path + trailing spouse ──
  if (spouses === 1 && isUpsThenDownsThenSpouse(path)) {
    const bloodUps = ups;
    const bloodDowns = downs;
    const diff = Math.abs(bloodUps - bloodDowns);

    // Spouse of uncle/aunt (at any depth)
    if (bloodUps > bloodDowns) {
      if (diff === 1) {
        if (f) {
          const prefix = bloodUps > 2 ? 'Pra'.repeat(bloodUps - 2) : '';
          return m ? `${prefix}Wujek (powinowaty)` : `${prefix}Ciotka (powinowata)`;
        }
        return m ? 'Wujek' : 'Ciocia';
      }
      // diff >= 2: spouse of great-uncle/aunt
      if (f) {
        const prefix = diff > 2 ? 'Pra'.repeat(diff - 2) : '';
        return m ? `${prefix}Dziadek stryjeczny (powinowaty)` : `${prefix}Babcia stryjeczna (powinowata)`;
      }
      return m ? 'Wujek' : 'Ciocia';
    }

    // Spouse of cousin
    if (bloodUps === bloodDowns && bloodUps >= 2) {
      return m ? 'Mąż kuzynki' : 'Żona kuzyna';
    }

    // Spouse of nephew/niece (at any depth)
    if (bloodDowns > bloodUps) {
      return m ? 'Mąż bratanicy' : 'Żona bratanka';
    }
  }

  // ── Spouse's blood relatives: leading spouse + blood path ──
  if (spouses === 1 && path[0] === 'spouse' && isUpsThenDowns(path.slice(1))) {
    const bloodUps = ups;
    const bloodDowns = downs;

    if (bloodUps > 0 && bloodDowns === 0) {
      // Spouse's ancestor
      if (bloodUps === 1) return m ? 'Teść' : 'Teściowa';
      if (bloodUps === 2) return m ? 'Dziadek małżonka' : 'Babcia małżonka';
      const prefix = 'Pra'.repeat(bloodUps - 2);
      return m ? `${prefix}dziadek małżonka` : `${prefix}babcia małżonka`;
    }

    if (bloodUps === 0 && bloodDowns > 0) {
      // Spouse's descendant (step-child, step-grandchild)
      if (bloodDowns === 1) return m ? 'Pasierb' : 'Pasierbica';
      if (bloodDowns === 2) return m ? 'Wnuk małżonka' : 'Wnuczka małżonka';
      return m ? 'Potomek małżonka' : 'Potomek małżonka';
    }

    if (bloodUps === 1 && bloodDowns === 1) return m ? 'Szwagier' : 'Szwagierka';

    if (bloodUps > bloodDowns && bloodUps - bloodDowns === 1) {
      return m ? 'Wuj małżonka' : 'Ciotka małżonka';
    }

    if (bloodUps === bloodDowns && bloodUps >= 2) {
      return m ? 'Kuzyn małżonka' : 'Kuzynka małżonka';
    }

    if (bloodDowns > bloodUps) {
      return m ? 'Bratanek małżonka' : 'Bratanica małżonka';
    }
  }

  // ── Descendant's spouse: all downs then spouse ──
  if (spouses === 1 && ups === 0 && path[path.length - 1] === 'spouse') {
    if (downs === 1) return m ? 'Zięć' : 'Synowa';
    if (downs === 2) return m ? 'Mąż wnuczki' : 'Żona wnuka';
    return m ? 'Małżonek potomka' : 'Małżonka potomka';
  }

  // ── Ancestor's spouse: all ups then spouse ──
  if (spouses === 1 && downs === 0 && path[path.length - 1] === 'spouse') {
    if (ups === 1) return m ? 'Ojczym' : 'Macocha';
    if (ups === 2) return m ? 'Dziadek' : 'Babcia';
    const prefix = 'Pra'.repeat(ups - 2);
    return m ? `${prefix}dziadek` : `${prefix}babcia`;
  }

  // ── Step-parent's relatives: up,spouse,... ──
  if (spouses === 1 && path[0] === 'up' && path[1] === 'spouse') {
    const rest = path.slice(2);
    const restUps = rest.filter(s => s === 'up').length;
    const restDowns = rest.filter(s => s === 'down').length;

    if (rest.length === 0) return m ? 'Ojczym' : 'Macocha';

    if (restDowns === 0 && restUps > 0) {
      if (restUps === 1) return m ? 'Dziadek' : 'Babcia';
      if (restUps === 2) return m ? 'Pradziadek' : 'Prababcia';
      const prefix = 'Pra'.repeat(restUps - 1);
      return m ? `${prefix}dziadek` : `${prefix}babcia`;
    }

    if (restUps === 0 && restDowns > 0) {
      if (restDowns === 1) return m ? 'Brat przyrodni' : 'Siostra przyrodnia';
      return m ? 'Krewny przyrodni' : 'Krewna przyrodnia';
    }

    if (isUpsThenDowns(rest)) {
      if (restUps > restDowns && restUps - restDowns === 1) return m ? 'Wuj' : 'Ciotka';
      if (restUps === restDowns && restUps >= 1) {
        if (restUps === 1) return m ? 'Brat przyrodni' : 'Siostra przyrodnia';
        return m ? 'Kuzyn' : 'Kuzynka';
      }
      if (restDowns > restUps) return m ? 'Bratanek' : 'Bratanica';
    }
  }

  // ── General single-spouse in the middle ──
  if (spouses === 1) {
    // For distant relatives' in-laws, use generic labels
    return m ? 'Powinowaty' : 'Powinowata';
  }

  // Fallback
  if (spouses > 0) return m ? 'Powinowaty' : 'Powinowata';
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

/** Check if path is ups, then downs, then a single trailing spouse step */
function isUpsThenDownsThenSpouse(path: StepKind[]): boolean {
  if (path.length < 3 || path[path.length - 1] !== 'spouse') return false;
  return isUpsThenDowns(path.slice(0, -1));
}
