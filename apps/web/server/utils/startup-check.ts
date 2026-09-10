/**
 * Production startup self-checks (Task 22, Validation section).
 *
 * Fail fast with an actionable message when:
 * - `JWT_SECRET` is left at the default (critical in production),
 * - storage directory is not writable,
 * - migration drift is detected (production runs `synchronize:false`).
 *
 * Pure core (`runStartupChecks`) is dependency-free and unit-tested; the
 * Nitro plugin wires in the real environment.
 */

export const DEFAULT_JWT_SECRET = 'default-secret-change-me'

/**
 * Whether TypeORM `synchronize` is active for the current environment
 * (Task 24: single home for the condition — `server/utils/db.ts` and the
 * Nitro startup plugin both use this, so dev-silence gating can never drift
 * from the actual DataSource setting. Dev default `true`, prod `false`.)
 */
export function isSynchronizeEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.DB_SYNCHRONIZE) return env.DB_SYNCHRONIZE !== 'false'
  return env.NODE_ENV !== 'production'
}

export interface StartupCheckInput {
  jwtSecret: string
  nodeEnv: string
  storageWritable: boolean
  /** True when the DB schema matches the checked-in baseline. */
  migrationInSync: boolean
}

export interface StartupIssue {
  level: 'fatal' | 'warn'
  code: string
  message: string
}

export function runStartupChecks(input: StartupCheckInput): StartupIssue[] {
  const issues: StartupIssue[] = []
  const isProd = input.nodeEnv === 'production'

  if (!input.jwtSecret || input.jwtSecret === DEFAULT_JWT_SECRET) {
    issues.push({
      level: isProd ? 'fatal' : 'warn',
      code: 'JWT_SECRET_DEFAULT',
      message: 'JWT_SECRET is not set — set a strong JWT_SECRET env var before production use.',
    })
  }
  if (!input.storageWritable) {
    issues.push({
      level: isProd ? 'fatal' : 'warn',
      code: 'STORAGE_UNWRITABLE',
      message: 'Storage directory is not writable — document/PDF persistence and uploads will fail.',
    })
  }
  if (isProd && !input.migrationInSync) {
    issues.push({
      level: 'fatal',
      code: 'MIGRATION_DRIFT',
      message: 'Migration drift detected — apply the checked-in baseline migration before booting (see docs/production-runbook.md).',
    })
  }
  return issues
}

/**
 * Dev-silence gate (Task 24): with `synchronize:true` outside production the
 * `migrations` bookkeeping table intentionally does not exist and no
 * `JWT_SECRET` is configured — both are noise on a dev boot. Production
 * behaviour is unchanged: every prod input returns `true`.
 *
 * Pure and unit-tested; the Nitro plugin routes both its raw drift warn and
 * the `runStartupChecks` warn loop through here. Fatal handling is untouched
 * (fatals always emit — the plugin exits on them before reaching this gate).
 */
export function shouldEmitStartupWarn(code: string, nodeEnv: string, synchronize: boolean): boolean {
  if (nodeEnv === 'production') return true
  if (synchronize && (code === 'JWT_SECRET_DEFAULT' || code === 'MIGRATION_DRIFT')) return false
  return true
}
