/**
 * Pure binding-reference helpers (Task 16 — Template Data Binding).
 *
 * Dependency-free so unit tests can import this module directly without
 * pulling the TypeORM chain. Re-exported by `template-bindings.service.ts`.
 */

/**
 * Loop-item scoping (REQ-002): inside collection placements, bindings may
 * reference the current loop item via `item.<field>` instead of outer
 * context. Item refs bypass table/column existence checks (the collection
 * shape is owned by the loop source, Task 15) and resolve at preview/render
 * time against each collection item.
 */
export function isItemScopedRef(sourceRef: string | null | undefined): boolean {
  if (!sourceRef) return false
  const ref = sourceRef.trim()
  return ref === 'item' || ref.startsWith('item.')
}

/** Field after `item.` (`null` for the whole-item `item` ref). */
export function itemFieldOf(sourceRef: string): string | null {
  const ref = sourceRef.trim()
  if (ref === 'item') return null // whole-item reference
  if (ref.startsWith('item.')) return ref.slice('item.'.length) || null
  return null
}

/** Canonical slot key: `${placementId}:${requirementName.toLowerCase()}`. */
export function slotKeyOf(placementId: string, requirementName: string): string {
  return `${placementId}:${requirementName.toLowerCase()}`
}
