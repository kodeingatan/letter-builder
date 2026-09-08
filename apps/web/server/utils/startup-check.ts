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
