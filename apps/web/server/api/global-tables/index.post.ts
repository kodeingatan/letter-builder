import { defineEventHandler, readBody, createError, setResponseStatus } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { GlobalTablesService } from '~~/server/services/global-tables.service'
import { CreateGlobalTableSchema } from '~~/server/dto/global-tables.dto'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const body = await readBody(event)
  const parsed = CreateGlobalTableSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 422, message: parsed.error.errors[0].message })
  try {
    const created = await GlobalTablesService.create(parsed.data)
    setResponseStatus(event, 201)
    return created
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
