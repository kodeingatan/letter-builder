import type { Role } from '~/shared/types/role'

export function formatRoleDisplayName(role: Role): string {
  return role.roleName
}

export function findRoleByName(roles: Role[], name: string): Role | undefined {
  return roles.find((r) => r.roleName === name)
}

export function findRoleById(roles: Role[], id: number): Role | undefined {
  return roles.find((r) => r.id === id)
}

export function filterRolesWithPermissions(roles: Role[]): Role[] {
  return roles.filter((r) => r.permissions && r.permissions.length > 0)
}

export function sortRolesByName(roles: Role[]): Role[] {
  return [...roles].sort((a, b) => a.roleName.localeCompare(b.roleName))
}
