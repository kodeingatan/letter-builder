import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { AdministrationsService } from '~~/server/services/administrations.service'
import { BulkStepsSchema } from '~~/server/dto/administrations.dto'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' })
  const body = await readBody(event)
  const parsed = BulkStepsSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 422, message: parsed.error.errors[0].message })
  try {
    return await AdministrationsService.saveSteps(id, parsed.data)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
