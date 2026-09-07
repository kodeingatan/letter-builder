import { getDataSource } from '~~/server/utils/db'
import { GlobalTableSchema } from '~~/server/entities/global-table.entity'
import { AdministrationSchema } from '~~/server/entities/administration.entity'
import { UserSchema } from '~~/server/entities/user.entity'
import { matchUrlPattern } from '~~/server/utils/url-matcher'
import { isMenuIconAllowed } from '~~/server/dto/navigation.dto'
import type { MenuUpdateInput } from '~~/server/dto/navigation.dto'

export interface NavigationDataEntry {
  tableName: string
  label: string
  icon: string | null
  order: number | null
}

export interface NavigationPersuratanEntry {
  administrationId: number
  label: string
  icon: string | null
  order: number | null
}

export interface NavigationProjection {
  data: NavigationDataEntry[]
  persuratan: NavigationPersuratanEntry[]
}

function httpError(statusCode: number, message: string, data?: unknown): Error {
  return Object.assign(new Error(message), { statusCode, data })
}

interface RoleLike {
  roleName?: string
  permissions?: Array<{
    permissionName?: string
    methods?: Array<{ method?: string }>
    urls?: Array<{ url?: string }>
  }>
}

/**
 * BR-004: order by `menuOrder` ascending (nulls last); collisions and
 * nulls fall back to alphabetical label — never a hard error.
 */
export function sortMenuItems<T extends { label: string; order: number | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ao = a.order ?? Number.POSITIVE_INFINITY
    const bo = b.order ?? Number.POSITIVE_INFINITY
    if (ao !== bo) return ao - bo
    return a.label.localeCompare(b.label)
  })
}

/** Unknown/legacy icons fall back to the group default (null = default). */
export function normalizeMenuIcon(icon: unknown): string | null {
  return isMenuIconAllowed(icon) ? icon : null
}

function permissionMatches(
  roles: RoleLike[],
  method: string | string[],
  paths: string | string[],
): boolean {
  const methods = Array.isArray(method) ? method : [method]
  const targets = Array.isArray(paths) ? paths : [paths]
  return roles.some((role) =>
    (role.permissions ?? []).some((permission) => {
      const granted: string[] = (permission.methods ?? []).map((m) => m.method ?? '')
      const urls: string[] = (permission.urls ?? []).map((u) => u.url ?? '')
      const methodOk = methods.some((m) => granted.includes('*') || granted.includes(m))
      if (!methodOk) return false
      return targets.some((target) => urls.some((pattern) => matchUrlPattern(pattern, target)))
    }),
  )
}

/**
 * BR-002: a table entry is included only when the caller holds a GET grant
 * covering its row-CRUD URL (`Data:<table>:Read`, broad `/*` rules, …).
 */
export function userMayReadTable(roles: RoleLike[], tableName: string): boolean {
  return permissionMatches(roles, 'GET', [`/api/data/${tableName}`, `/api/data/${tableName}/1`])
}

/**
 * BR-002: an administration entry is included only when the caller may run
 * it — a POST grant on the nested start route (or the runs session routes).
 * Named run permissions are honoured explicitly so intent stays readable.
 */
export function userMayRunAdministration(roles: RoleLike[], administrationId: number): boolean {
  const named = roles.some((role) =>
    (role.permissions ?? []).some((p) =>
      ['Administration Run', 'Administration Management', 'Full Access', 'Read Write'].includes(
        p.permissionName ?? '',
      ),
    ),
  )
  if (named) return true
  return permissionMatches(roles, ['POST', '*'], [
    `/api/administrations/${administrationId}/runs`,
    '/api/runs/mine',
  ])
}

const CACHE_TTL_MS = 30_000
const projectionCache = new Map<number, { at: number; projection: NavigationProjection }>()

/** Invalidation hook — call from table/admin mutations (no redeploy needed). */
export function invalidateNavigationCache(userId?: number) {
  if (userId === undefined) projectionCache.clear()
  else projectionCache.delete(userId)
}

export const NavigationService = {
  async getProjection(userId: number): Promise<NavigationProjection> {
    const cached = projectionCache.get(userId)
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.projection

    const ds = await getDataSource()
    const user: any = await ds.getRepository(UserSchema).findOne({ where: { id: userId } })
    if (!user) throw httpError(401, 'Invalid token')
    const roles: RoleLike[] = user.roles ?? []

    const tables: any[] = await ds.getRepository(GlobalTableSchema).find()
    let columnCounts = new Map<number, number>()
    if (ds.hasMetadata('global_table_columns')) {
      const rows: Array<{ globalTableId: number; count: number }> = await ds.query(
        'SELECT "globalTableId", COUNT(*) AS count FROM global_table_columns GROUP BY "globalTableId"',
      )
      columnCounts = new Map(rows.map((r) => [Number(r.globalTableId), Number(r.count)]))
    }

    // BR-001: draft tables (zero columns) never appear in menus.
    const dataEntries: NavigationDataEntry[] = tables
      .filter((t) => (columnCounts.get(Number(t.id)) ?? 0) > 0)
      .filter((t) => userMayReadTable(roles, t.name))
      .map((t) => ({
        tableName: t.name,
        // BR-003: labels derive from displayName — renames propagate.
        label: t.displayName,
        icon: normalizeMenuIcon(t.menuIcon),
        order: t.menuOrder ?? null,
      }))

    const administrations: any[] = await ds.getRepository(AdministrationSchema).find()
    // BR-001: only published administrations are runnable → listed.
    const persuratanEntries: NavigationPersuratanEntry[] = administrations
      .filter((a) => a.status === 'published')
      .filter((a) => userMayRunAdministration(roles, a.id))
      .map((a) => ({
        administrationId: a.id,
        label: a.name,
        icon: normalizeMenuIcon(a.menuIcon),
        order: a.menuOrder ?? null,
      }))

    const projection: NavigationProjection = {
      data: sortMenuItems(dataEntries),
      persuratan: sortMenuItems(persuratanEntries),
    }
    projectionCache.set(userId, { at: Date.now(), projection })
    return projection
  },

  /** Designer-gated reorder/icon update for a Data entry. */
  async updateTableMenu(id: number, input: MenuUpdateInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(GlobalTableSchema)
    const table: any = await repo.findOne({ where: { id } })
    if (!table) throw httpError(404, 'Global table not found')
    if (input.menuOrder !== undefined) table.menuOrder = input.menuOrder
    if (input.menuIcon !== undefined) table.menuIcon = input.menuIcon
    const saved = await repo.save(table)
    invalidateNavigationCache()
    return saved
  },

  /** Designer-gated reorder/icon update for a Persuratan entry. */
  async updateAdministrationMenu(id: number, input: MenuUpdateInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(AdministrationSchema)
    const administration: any = await repo.findOne({ where: { id } })
    if (!administration) throw httpError(404, 'Administration not found')
    if (input.menuOrder !== undefined) administration.menuOrder = input.menuOrder
    if (input.menuIcon !== undefined) administration.menuIcon = input.menuIcon
    const saved = await repo.save(administration)
    invalidateNavigationCache()
    return saved
  },
}
