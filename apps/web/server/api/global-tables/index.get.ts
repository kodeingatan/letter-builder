import { defineEventHandler, getQuery, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { GlobalTablesService } from '~~/server/services/global-tables.service'
import { GlobalTableQuerySchema } from '~~/server/dto/global-tables.dto'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const query = getQuery(event)
  const parsed = GlobalTableQuerySchema.safeParse(query)
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  return GlobalTablesService.findAll(parsed.data)
})
