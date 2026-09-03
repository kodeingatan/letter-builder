import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { matchUrlPattern } from '~/utils/url-matcher'

export function useAuthorization() {
  const authStore = useAuthStore()

  const userRoles = computed(() =>
    authStore.user?.roles?.map((r) => r.roleName) || [],
  )

  const userPermissions = computed(() => {
    const perms = new Set<string>()
    authStore.user?.roles?.forEach((role) => {
      role.permissions?.forEach((p) => perms.add(p.permissionName))
    })
    return Array.from(perms)
  })

  const userGuardUrls = computed(() => {
    const urls: { pattern: string; type: 'allow' | 'deny' }[] = []
    authStore.user?.roles?.forEach((role) => {
      role.guards?.forEach((guard) => {
        guard.urls?.forEach((u) =>
          urls.push({ pattern: u.url, type: u.type }),
        )
      })
    })
    return urls
  })

  function hasRole(roleName: string): boolean {
    return userRoles.value.includes(roleName)
  }

  function hasAnyRole(roles: string[]): boolean {
    return roles.some((r) => userRoles.value.includes(r))
  }

  function hasPermission(permissionName: string): boolean {
    return userPermissions.value.includes(permissionName)
  }

  function hasAnyPermission(perms: string[]): boolean {
    return perms.some((p) => userPermissions.value.includes(p))
  }

  function canAccessUrl(url: string, _method: string = 'GET'): boolean {
    const denyMatch = userGuardUrls.value
      .filter((u) => u.type === 'deny')
      .some((u) => matchUrlPattern(u.pattern, url))
    if (denyMatch) return false

    const allowMatch = userGuardUrls.value
      .filter((u) => u.type === 'allow')
      .some((u) => matchUrlPattern(u.pattern, url))
    return allowMatch
  }

  return {
    userRoles,
    userPermissions,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    canAccessUrl,
  }
}
