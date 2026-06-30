import type { FamilyState, Person } from '../types';

/**
 * Single source of truth for the left→right order of siblings on the tree.
 *
 * Priority:
 *  1. `manualOrder` — set when the user reorders a sibling group by hand.
 *  2. `birthDate` — ISO YYYY-MM-DD sorts lexicographically = chronologically.
 *  3. insertion order — undated siblings keep the order they were entered
 *     (callers rely on Array.sort being stable, ES2019+).
 *
 * Manually-placed siblings always come before auto-placed ones, so a freshly
 * added (undated, no manualOrder) sibling lands at the right edge of a group
 * that was already arranged by hand.
 */
export function compareSiblings(a?: Person, b?: Person): number {
  const ma = a?.manualOrder, mb = b?.manualOrder;
  if (ma != null && mb != null) return ma - mb;
  if (ma != null) return -1;
  if (mb != null) return 1;

  const da = a?.birthDate || null, db = b?.birthDate || null;
  if (da && db) return da < db ? -1 : da > db ? 1 : 0;
  if (da) return -1;
  if (db) return 1;
  return 0;
}

/**
 * A person together with their siblings, in current left→right (visual) order.
 *
 * The base order is the parent-child relationship (insertion) order — exactly
 * how the layout builds its `childrenOf` lists — and only THEN is it sorted by
 * compareSiblings. Building it the same way the tree does is essential: a naive
 * `[self, ...siblings]` base would break ties for undated siblings differently
 * than the tree, so the menu's "3 / 7" position could disagree with the drawn
 * left→right order.
 */
export function siblingGroup(personId: string, state: FamilyState): Person[] {
  const byId = new Map(state.people.map((p) => [p.id, p]));
  const self = byId.get(personId);
  if (!self) return [];

  const parentIds = new Set(
    state.parentChildRelationships
      .filter((r) => r.childId === personId)
      .map((r) => r.parentId),
  );
  if (parentIds.size === 0) return [self];

  const ids: string[] = [];
  for (const r of state.parentChildRelationships) {
    if (parentIds.has(r.parentId) && !ids.includes(r.childId)) ids.push(r.childId);
  }
  return ids.map((id) => byId.get(id)!).sort(compareSiblings);
}
