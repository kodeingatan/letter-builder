import type { Guard } from '~/shared/types/guard'

export function formatGuardDisplayName(guard: Guard): string {
  return guard.guardName
}

export function findGuardByName(guards: Guard[], name: string): Guard | undefined {
  return guards.find((g) => g.guardName === name)
}

export function findGuardById(guards: Guard[], id: number): Guard | undefined {
  return guards.find((g) => g.id === id)
}

export function filterGuardsByType(guards: Guard[], type: 'allow' | 'deny'): Guard[] {
  return guards.filter((g) => g.urls?.some((u) => u.type === type))
}

export function sortGuardsByName(guards: Guard[]): Guard[] {
  return [...guards].sort((a, b) => a.guardName.localeCompare(b.guardName))
}
