import { defineEventHandler, getQuery, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { AdministrationsService } from '~~/server/services/administrations.service'
import { AdministrationQuerySchema } from '~~/server/dto/administrations.dto'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const parsed = AdministrationQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 422, message: parsed.error.errors[0].message })
  try {
    return await AdministrationsService.findAll(parsed.data)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
