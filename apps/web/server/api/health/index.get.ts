import { defineEventHandler } from 'h3'
import { access, constants } from 'node:fs/promises'
import { join } from 'node:path'
import { getDataSource } from '~~/server/utils/db'

/**
 * Public ops probe (RBAC-Only after Task 01). No auth, no PII:
 * `{ status, db, storage, version }`.
 */
export default defineEventHandler(async () => {
  let db: 'healthy' | 'degraded' = 'healthy'
  try {
    const ds = await getDataSource()
    await ds.query('SELECT 1')
  } catch {
    db = 'degraded'
  }

  let storage: 'healthy' | 'degraded' = 'healthy'
  try {
    await access(join(process.cwd(), 'storage'), constants.W_OK)
  } catch {
    storage = 'degraded'
  }

  const status = db === 'healthy' && storage === 'healthy'
    ? 'healthy'
    : 'degraded'

  return {
    status,
    db,
    storage,
    version: process.env.npm_package_version ?? '1.0.0',
  }
})
