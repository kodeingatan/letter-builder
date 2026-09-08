import { defineEventHandler } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { getDataSource } from '~~/server/utils/db'
import { ActivityLogSchema } from '~~/server/entities/activity-log.entity'
import { EXPECTED_AUDIT_ENTITIES } from '~~/server/utils/permission-matrix'

/**
 * Audit verification helper (Task 22, API section / REQ-002).
 * Reports event counts per expected entity so QA can prove 100%
 * mutation coverage. Gated behind the activity-logs GET grant
 * (admin-only in practice).
 */
export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const ds = await getDataSource()
  const repo = ds.getRepository(ActivityLogSchema)

  const rows = await repo
    .createQueryBuilder('log')
    .select('log.entity', 'entity')
    .addSelect('COUNT(*)', 'count')
    .groupBy('log.entity')
    .getRawMany<{ entity: string; count: string }>()

  const counts: Record<string, number> = {}
  for (const row of rows) counts[row.entity] = Number(row.count)

  const entities = EXPECTED_AUDIT_ENTITIES.map((entity) => ({
    entity,
    count: counts[entity] ?? 0,
    covered: (counts[entity] ?? 0) > 0,
  }))

  return {
    entities,
    missing: entities.filter((e) => !e.covered).map((e) => e.entity),
    coverage: `${entities.filter((e) => e.covered).length}/${entities.length}`,
  }
})
