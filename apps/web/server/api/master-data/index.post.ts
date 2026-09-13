import { defineEventHandler, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { CreateMasterTableSchema } from '~~/server/dto/master-data.dto'
import { MasterDataService } from '~~/server/services/master-data.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** POST /api/master-data — create definition + physical DDL (Master Data Write). */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const parsed = CreateMasterTableSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    const table = await MasterDataService.createTable(parsed.data)
    await ActivityLogsService.log({
      userId, action: 'MASTER_TABLE_CREATE', entity: 'MasterTable',
      description: `Create master table ${(table as { slug: string }).slug}`,
    }).catch(() => {})
    return table
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
