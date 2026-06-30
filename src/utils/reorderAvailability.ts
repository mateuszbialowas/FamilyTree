import type { FamilyState, Person } from '../types';
import { siblingGroup } from './siblingOrder';
import { computeUnifiedLayout } from './treeLayout';
import { familyReducer } from '../context/familyReducers';

export type ReorderAvailability = {
  /** The person's sibling group, in current left→right order. */
  siblings: Person[];
  /** The person's index within `siblings` (-1 if none). */
  index: number;
  /** A left/right move is offered only when it would actually move the tree. */
  canLeft: boolean;
  canRight: boolean;
};

/**
 * Whether reordering `personId` among its siblings would actually change the
 * tree drawn for `rootId`. Some nodes can't move in the current view — most
 * notably a married root, pinned to the edge of its sibling row so branches
 * don't cross — and an arrow that silently does nothing reads as a bug.
 *
 * The check simulates the layout (apply the move, re-run `computeUnifiedLayout`,
 * compare the siblings' drawn order). That's deliberately general: it catches
 * every reason a move might not stick, not just the root case, with no special
 * casing to drift out of sync with the real layout rules.
 */
export function reorderAvailability(
  personId: string | null,
  rootId: string | null,
  state: FamilyState,
): ReorderAvailability {
  if (!personId) return { siblings: [], index: -1, canLeft: false, canRight: false };

  const siblings = siblingGroup(personId, state);
  const index = siblings.findIndex((p) => p.id === personId);
  if (siblings.length <= 1 || index < 0 || !rootId) {
    return { siblings, index, canLeft: false, canRight: false };
  }

  const ids = siblings.map((p) => p.id);
  const drawnOrder = (s: FamilyState): string => {
    const xById = new Map(computeUnifiedLayout(rootId, s).nodes.map((n) => [n.id, n.x]));
    return ids.slice().sort((a, b) => (xById.get(a) ?? 0) - (xById.get(b) ?? 0)).join('>');
  };

  const base = drawnOrder(state);
  const movesTree = (direction: 'left' | 'right'): boolean =>
    drawnOrder(familyReducer(state, { type: 'REORDER_SIBLING', payload: { personId, direction } })) !== base;

  return {
    siblings,
    index,
    canLeft: index > 0 && movesTree('left'),
    canRight: index < siblings.length - 1 && movesTree('right'),
  };
}
