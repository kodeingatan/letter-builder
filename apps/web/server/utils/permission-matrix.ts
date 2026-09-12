/**
 * Least-privilege permission catalog + default role mapping (RBAC-Only after Task 01).
 *
 * Dynamic Administration modules (Global Table, Component, Template,
 * Administration, Document, Rendering, Expression, Navigation) removed Task 01.
 * This file is kept as a stub to preserve import stability for tests/seeder
 * that may import PERMISSION_CATALOG / ROLE_MATRIX.
 */

export interface PermissionCatalogEntry {
  permissionName: string
  description: string
  methods: string[]
  urls: string[]
}

// RBAC-Only: no dynamic permissions. Retained permissions are seeded directly
// in seeder.service.ts (Full Access, Read Only, Read Write, User/Role/Guard/Permission Management, etc.)
export const PERMISSION_CATALOG: PermissionCatalogEntry[] = []

export type DefaultRoleName = 'Designer' | 'Operator' | 'Admin'

export const ROLE_MATRIX: Record<DefaultRoleName, string[]> = {
  Designer: [],
  Operator: [],
  Admin: [],
}

/** Every mutation/lifecycle entity that must appear in activity logs (REQ-002) — RBAC only. */
export const EXPECTED_AUDIT_ENTITIES = [
  'User',
  'Role',
  'Permission',
  'Guard',
] as const

export type AuditEntity = (typeof EXPECTED_AUDIT_ENTITIES)[number]

export function permissionCatalogNames(): string[] {
  return PERMISSION_CATALOG.map((p) => p.permissionName)
}

export function rolePermissions(role: DefaultRoleName): string[] {
  return [...(ROLE_MATRIX[role] ?? [])]
}

/** True when every permission assigned to the role exists in the catalog. */
export function matrixIsConsistent(): boolean {
  const names = new Set(permissionCatalogNames())
  return Object.values(ROLE_MATRIX).every((perms) => perms.every((p) => names.has(p)))
}
