import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { MasterDataService } from '~~/server/services/master-data.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** DELETE /api/master-data/:slug — drop table after reference check (409 when used). */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const slug = getRouterParam(event, 'slug') as string
  try {
    const result = await MasterDataService.removeTable(slug)
    await ActivityLogsService.log({
      userId, action: 'MASTER_TABLE_DELETE', entity: 'MasterTable',
      description: `Delete master table ${slug}`,
    }).catch(() => {})
    return result
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
      data: (error as Error & { data?: unknown }).data,
    })
  }
})
