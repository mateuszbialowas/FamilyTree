import type { FamilyState, Person } from '../types';
import { getSiblings } from './relationships';

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

/** A person + their full siblings, in current left→right (visual) order. */
export function siblingGroup(personId: string, state: FamilyState): Person[] {
  const self = state.people.find((p) => p.id === personId);
  if (!self) return [];
  return [self, ...getSiblings(personId, state)].sort(compareSiblings);
}
