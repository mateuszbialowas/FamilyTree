import type { FamilyState } from '../types';
import { siblingGroup } from './siblingOrder';
import { computeUnifiedLayout } from './treeLayout';
import { familyReducer } from '../context/familyReducers';

/**
 * Whether reordering `personId` among its siblings would change the tree drawn
 * for `rootId` *at all*. Some nodes can't move in the current view — most
 * notably a married root, pinned to the edge of its sibling row so branches
 * don't cross — and an arrow that silently does nothing reads as a bug.
 *
 * This is a per-node property (pinned or not), independent of the current order,
 * so callers compute it ONCE when the menu opens rather than on every arrow tap
 * — the layout simulation here is too costly to repeat per interaction.
 *
 * The check simulates the layout (apply a move, re-run `computeUnifiedLayout`,
 * compare the siblings' drawn order). That's deliberately general: it catches
 * every reason a move might not stick, not just the root case.
 */
export function isNodeReorderable(
  personId: string,
  rootId: string | null,
  state: FamilyState,
): boolean {
  if (!rootId) return false;
  const siblings = siblingGroup(personId, state);
  const index = siblings.findIndex((p) => p.id === personId);
  if (siblings.length <= 1 || index < 0) return false;

  const ids = siblings.map((p) => p.id);
  const drawnOrder = (s: FamilyState): string => {
    const xById = new Map(computeUnifiedLayout(rootId, s).nodes.map((n) => [n.id, n.x]));
    return ids.slice().sort((a, b) => (xById.get(a) ?? 0) - (xById.get(b) ?? 0)).join('>');
  };
  const base = drawnOrder(state);
  const movesTree = (direction: 'left' | 'right'): boolean =>
    drawnOrder(familyReducer(state, { type: 'REORDER_SIBLING', payload: { personId, direction } })) !== base;

  return (index > 0 && movesTree('left')) || (index < siblings.length - 1 && movesTree('right'));
}
