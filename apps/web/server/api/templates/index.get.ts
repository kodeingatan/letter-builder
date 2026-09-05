import { defineEventHandler, getQuery, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { TemplatesService } from '~~/server/services/templates.service'
import { TemplateQuerySchema } from '~~/server/dto/templates.dto'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const query = getQuery(event)
  const parsed = TemplateQuerySchema.safeParse(query)
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  return TemplatesService.findAll(parsed.data)
})
