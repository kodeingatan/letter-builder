import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { MasterDataService } from '~~/server/services/master-data.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** PUT /api/master-data/:slug/rows/:id — update row (operations recomputed). */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const slug = getRouterParam(event, 'slug') as string
  const id = Number(getRouterParam(event, 'id'))
  const body = (await readBody(event)) as Record<string, unknown>
  try {
    const row = await MasterDataService.updateRow(slug, id, body ?? {})
    await ActivityLogsService.log({
      userId, action: 'MASTER_ROW_UPDATE', entity: 'MasterRow',
      description: `Update ${slug} row ${id}`,
    }).catch(() => {})
    return row
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
