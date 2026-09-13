import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { MasterDataService } from '~~/server/services/master-data.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** POST /api/master-data/:slug/rows — create row (operations computed server-side). */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const slug = getRouterParam(event, 'slug') as string
  const body = (await readBody(event)) as Record<string, unknown>
  try {
    const row = await MasterDataService.createRow(slug, body ?? {})
    await ActivityLogsService.log({
      userId, action: 'MASTER_ROW_CREATE', entity: 'MasterRow',
      description: `Create ${slug} row`,
    }).catch(() => {})
    return row
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
