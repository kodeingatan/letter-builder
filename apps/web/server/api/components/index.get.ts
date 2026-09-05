import { defineEventHandler, getQuery, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { ComponentsService } from '~~/server/services/components.service'
import { ComponentQuerySchema } from '~~/server/dto/components.dto'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const query = getQuery(event)
  const parsed = ComponentQuerySchema.safeParse(query)
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  return ComponentsService.findAll(parsed.data)
})
