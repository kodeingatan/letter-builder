import { defineEventHandler, getQuery, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { QueryMasterTableSchema } from '~~/server/dto/master-data.dto'
import { MasterDataService } from '~~/server/services/master-data.service'

/** GET /api/master-data — list table definitions (Master Data Read). */
export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const parsed = QueryMasterTableSchema.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  return MasterDataService.findAllTables(parsed.data)
})
