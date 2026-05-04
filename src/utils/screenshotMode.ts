/**
 * One-shot override for the tree's initial zoom level.
 * Set by the family-tree://load-sample/<locale>?zoom=<n> deep link
 * (used by the Maestro screenshot flow), consumed by FamilyTreeCanvas
 * the next time it centers on a root.
 */
let pendingInitialZoom: number | null = null;

export function setInitialTreeZoom(zoom: number | null): void {
  pendingInitialZoom = zoom;
}

export function consumeInitialTreeZoom(): number | null {
  const z = pendingInitialZoom;
  pendingInitialZoom = null;
  return z;
}
