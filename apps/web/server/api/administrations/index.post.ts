import { defineEventHandler, readBody, createError, setResponseStatus } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { AdministrationsService } from '~~/server/services/administrations.service'
import { CreateAdministrationSchema } from '~~/server/dto/administrations.dto'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const body = await readBody(event)
  const parsed = CreateAdministrationSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 422, message: parsed.error.errors[0].message })
  try {
    const created = await AdministrationsService.create(parsed.data)
    setResponseStatus(event, 201)
    return created
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
