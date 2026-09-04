import type { GlobalTable } from '~/shared/types/global-table'

export const GLOBAL_TABLE_NAME_PATTERN = /^[a-z][a-z0-9_]*$/

export const RESERVED_GLOBAL_TABLE_NAMES = [
  'users',
  'roles',
  'permissions',
  'guards',
  'settings',
  'activity_logs',
  'migrations',
]

export function isReservedGlobalTableName(name: string): boolean {
  return RESERVED_GLOBAL_TABLE_NAMES.includes(name.toLowerCase())
}

export function isValidGlobalTableName(name: string): boolean {
  if (!name || name.length > 64) return false
  return GLOBAL_TABLE_NAME_PATTERN.test(name)
}

export function formatGlobalTableDisplayName(table: GlobalTable): string {
  return table.displayName || table.name
}

export function findGlobalTableByName(tables: GlobalTable[], name: string): GlobalTable | undefined {
  return tables.find((t) => t.name.toLowerCase() === name.toLowerCase())
}

export function findGlobalTableById(tables: GlobalTable[], id: number): GlobalTable | undefined {
  return tables.find((t) => t.id === id)
}

export function sortGlobalTablesByName(tables: GlobalTable[]): GlobalTable[] {
  return [...tables].sort((a, b) => a.name.localeCompare(b.name))
}
