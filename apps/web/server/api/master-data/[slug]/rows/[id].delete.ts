import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { MasterDataService } from '~~/server/services/master-data.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** DELETE /api/master-data/:slug/rows/:id — hard delete row (soft-delete deferred, Open Question). */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const slug = getRouterParam(event, 'slug') as string
  const id = Number(getRouterParam(event, 'id'))
  try {
    const result = await MasterDataService.removeRow(slug, id)
    await ActivityLogsService.log({
      userId, action: 'MASTER_ROW_DELETE', entity: 'MasterRow',
      description: `Delete ${slug} row ${id}`,
    }).catch(() => {})
    return result
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
