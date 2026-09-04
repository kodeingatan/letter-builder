import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { GlobalTablesService } from '~~/server/services/global-tables.service'
import { UpdateGlobalTableSchema } from '~~/server/dto/global-tables.dto'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' })
  const body = await readBody(event)
  if (body && typeof body === 'object' && 'name' in body) {
    throw createError({ statusCode: 422, message: 'name is immutable and cannot be changed' })
  }
  const parsed = UpdateGlobalTableSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 422, message: parsed.error.errors[0].message })
  try {
    return await GlobalTablesService.update(id, parsed.data)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message })
  }
})
