import { defineEventHandler, getQuery, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { QuerySchema } from '~~/server/dto/persuratan.dto'
import { DocTemplatesService } from '~~/server/services/doc-templates.service'

/** GET /api/doc-templates — list (Template Read). */
export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const parsed = QuerySchema.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  return DocTemplatesService.findAll(parsed.data)
})
