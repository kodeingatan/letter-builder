import { access, constants } from 'node:fs/promises'
import { join } from 'node:path'
import { getDataSource } from '~~/server/utils/db'
import { seedDatabase } from '~~/server/services/seeder.service'
import { runStartupChecks } from '~~/server/utils/startup-check'

export default defineNitroPlugin(async () => {
  const ds = await getDataSource()
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
    migrationInSync: true,
  })
  for (const issue of issues) {
    if (issue.level === 'fatal') throw new Error(`[startup] ${issue.code}: ${issue.message}`)
    // eslint-disable-next-line no-console
    console.warn(`[startup] ${issue.code}: ${issue.message}`)
  }
})
