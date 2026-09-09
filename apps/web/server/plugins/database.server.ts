import { access, constants } from 'node:fs/promises'
import { join } from 'node:path'
import { getDataSource } from '~~/server/utils/db'
import { seedDatabase } from '~~/server/services/seeder.service'
import { runStartupChecks } from '~~/server/utils/startup-check'
import { checkMigrationStatus } from '~~/server/utils/migration-status'

export default defineNitroPlugin(async () => {
  const ds = await getDataSource()

  // Task 23: real drift detection — compare the `migrations` bookkeeping
  // table against the checked-in migration classes. `runStartupChecks`
  // itself stays pure; only this input becomes real (was hardcoded `true`).
  const migrationStatus = await checkMigrationStatus(ds)
  if (!migrationStatus.inSync) {
    const detail = [
      ...migrationStatus.pending.map((name) => `pending:${name}`),
      ...migrationStatus.unknown.map((name) => `unknown:${name}`),
    ].join(', ')
    // eslint-disable-next-line no-console
    console.warn(`[startup] migration drift detected (${migrationStatus.reason}): ${detail || 'no bookkeeping'}`)
  }

  await seedDatabase(ds)

  // Task 22: startup self-check — fail fast with an actionable message in
  // production when secrets/storage/migrations are misconfigured.
  let storageWritable = true
  try {
    await access(join(process.cwd(), 'storage'), constants.W_OK)
  } catch {
    try {
      const { mkdir } = await import('node:fs/promises')
      await mkdir(join(process.cwd(), 'storage'), { recursive: true })
    } catch {
      storageWritable = false
    }
  }
  const issues = runStartupChecks({
    jwtSecret: process.env.JWT_SECRET ?? 'default-secret-change-me',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    storageWritable,
    migrationInSync: migrationStatus.inSync,
  })
  for (const issue of issues) {
    if (issue.level === 'fatal') {
      // Fail fast for real: a thrown error inside a Nitro plugin surfaces
      // as a logged `unhandledRejection` while the server keeps listening,
      // so a fatal must terminate the process (prod-only by construction —
      // every `fatal` level above is gated on `NODE_ENV=production`).
      // eslint-disable-next-line no-console
      console.error(`[startup] ${issue.code}: ${issue.message}`)
      process.exit(1)
    }
    // eslint-disable-next-line no-console
    console.warn(`[startup] ${issue.code}: ${issue.message}`)
  }
})
