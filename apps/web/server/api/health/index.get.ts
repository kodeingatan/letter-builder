import { defineEventHandler } from 'h3'
import { access, constants } from 'node:fs/promises'
import { join } from 'node:path'
import { getDataSource } from '~~/server/utils/db'
import { activeRenderCount } from '~~/server/utils/render-guard'

/**
 * Public ops probe (Task 22, REQ-003). No auth, no PII:
 * `{ status, db, storage, renderer, version }`.
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

  const renderer = activeRenderCount() >= 4 ? 'degraded' : 'healthy'
  const status = db === 'healthy' && storage === 'healthy' && renderer === 'healthy'
    ? 'healthy'
    : 'degraded'

  return {
    status,
    db,
    storage,
    renderer,
    version: process.env.npm_package_version ?? '1.0.0',
  }
})
