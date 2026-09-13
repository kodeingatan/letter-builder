import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { UpdateMasterTableSchema } from '~~/server/dto/master-data.dto'
import { MasterDataService } from '~~/server/services/master-data.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** PUT /api/master-data/:slug — update definition + safe alter. */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const slug = getRouterParam(event, 'slug') as string
  const parsed = UpdateMasterTableSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    const table = await MasterDataService.updateTable(slug, parsed.data)
    await ActivityLogsService.log({
      userId, action: 'MASTER_TABLE_UPDATE', entity: 'MasterTable',
      description: `Update master table ${slug}`,
    }).catch(() => {})
    return table
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
      data: (error as Error & { data?: unknown }).data,
    })
  }
})
