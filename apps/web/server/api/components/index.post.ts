import { defineEventHandler, readBody, createError, setResponseStatus } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { ComponentsService } from '~~/server/services/components.service'
import { CreateComponentSchema } from '~~/server/dto/components.dto'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const body = await readBody(event)
  const parsed = CreateComponentSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 422, message: parsed.error.errors[0].message })
  try {
    const created = await ComponentsService.create(parsed.data)
    setResponseStatus(event, 201)
    return created
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
