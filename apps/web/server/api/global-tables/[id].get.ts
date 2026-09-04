import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { GlobalTablesService } from '~~/server/services/global-tables.service'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' })
  try {
    return await GlobalTablesService.findOne(id)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 404, message: e.message })
  }
})
