/**
 * Migration drift detection (Task 23).
 *
 * `runStartupChecks` (`server/utils/startup-check.ts`) stays pure and
 * untouched — this module computes its real `migrationInSync` input by
 * comparing the TypeORM `migrations` bookkeeping table against the
 * checked-in migration classes (`appMigrations` in
 * `server/utils/orm-data-source.ts`, wired into `getDataSource()`).
 *
 * Drift = any pending (checked-in but not applied) OR any unknown
 * (applied but no longer checked-in) migration. Either refuses prod boot
 * with the existing `MIGRATION_DRIFT` fatal.
 */

export type MigrationDriftReason =
  | 'in-sync'
  | 'pending'
  | 'unknown-applied'
  | 'migrations-table-missing'

export interface MigrationSyncState {
  inSync: boolean
  applied: string[]
  local: string[]
  /** Checked-in but not applied. */
  pending: string[]
  /** Applied but not checked-in (extra/unknown). */
  unknown: string[]
  reason: MigrationDriftReason
}

/**
 * Pure set-diff core — unit-tested without a database.
 */
export function computeMigrationSync(applied: string[], local: string[]): MigrationSyncState {
  const appliedSet = new Set(applied)
  const localSet = new Set(local)
  const pending = local.filter((name) => !appliedSet.has(name))
  const unknown = applied.filter((name) => !localSet.has(name))
  const reason: MigrationDriftReason =
    pending.length > 0
      ? 'pending'
      : unknown.length > 0
        ? 'unknown-applied'
        : 'in-sync'
  return {
    inSync: pending.length === 0 && unknown.length === 0,
    applied: [...applied],
    local: [...local],
    pending,
    unknown,
    reason,
  }
}

interface MigrationCapableDataSource {
  options: { migrations?: unknown }
  query: (sql: string) => Promise<{ name: string }[]>
}

function localMigrationNames(ds: MigrationCapableDataSource): string[] {
  const migrations = (ds.options.migrations ?? []) as { name?: string }[]
  return migrations.map((m) => m.name ?? 'unknown').filter((n) => n !== 'unknown')
}

/**
 * Real drift check against a live DataSource. Returns not-in-sync (never
 * throws) when the `migrations` bookkeeping table is absent — e.g. a
 * pre-migration database file or `synchronize:true` dev databases — so the
 * prod gate fails closed with an actionable `MIGRATION_DRIFT`.
 */
export async function checkMigrationStatus(
  ds: MigrationCapableDataSource,
): Promise<MigrationSyncState> {
  const local = localMigrationNames(ds)
  let applied: string[]
  try {
    const rows = await ds.query('SELECT name FROM migrations ORDER BY name')
    applied = rows.map((row) => row.name)
  } catch {
    return {
      inSync: false,
      applied: [],
      local,
      pending: [...local],
      unknown: [],
      reason: 'migrations-table-missing',
    }
  }
  return computeMigrationSync(applied, local)
}
