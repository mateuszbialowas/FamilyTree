/**
 * One-shot overrides applied by the family-tree://load-sample/<locale>
 * or load-marketing/<locale> deep links (used by the Maestro screenshot
 * flow). Each is consumed exactly once by the corresponding screen.
 *
 * Two ways to specify the initial tree root:
 *   - rootId   — exact id (locale-independent; preferred for automation)
 *   - rootName — "FirstName LastName" (human-readable, locale-specific)
 *
 * If both are set, the screen consumes rootId first.
 */
let pendingInitialZoom: number | null = null;
let pendingInitialRootName: string | null = null;
let pendingInitialRootId: string | null = null;

export function setInitialTreeZoom(zoom: number | null): void {
  pendingInitialZoom = zoom;
}

export function consumeInitialTreeZoom(): number | null {
  const z = pendingInitialZoom;
  pendingInitialZoom = null;
  return z;
}

export function setInitialTreeRootName(name: string | null): void {
  pendingInitialRootName = name;
}

export function consumeInitialTreeRootName(): string | null {
  const n = pendingInitialRootName;
  pendingInitialRootName = null;
  return n;
}

export function setInitialTreeRootId(id: string | null): void {
  pendingInitialRootId = id;
}

export function consumeInitialTreeRootId(): string | null {
  const i = pendingInitialRootId;
  pendingInitialRootId = null;
  return i;
}
