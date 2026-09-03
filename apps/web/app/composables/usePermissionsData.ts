import type { Permission } from '~/shared/types/permission'

export function formatPermissionDisplayName(permission: Permission): string {
  return permission.permissionName
}

export function findPermissionByName(permissions: Permission[], name: string): Permission | undefined {
  return permissions.find((p) => p.permissionName === name)
}

export function filterPermissionsByMethod(permissions: Permission[], method: string): Permission[] {
  return permissions.filter((p) => p.methods?.some((m) => m.method === method))
}

export function filterPermissionsByUrl(permissions: Permission[], url: string): Permission[] {
  return permissions.filter((p) => p.urls?.some((u) => u.url === url))
}

export function sortPermissionsByName(permissions: Permission[]): Permission[] {
  return [...permissions].sort((a, b) => a.permissionName.localeCompare(b.permissionName))
}
