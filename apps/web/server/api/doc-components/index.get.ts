import { defineEventHandler, getQuery, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { QuerySchema } from '~~/server/dto/persuratan.dto'
import { DocComponentsService } from '~~/server/services/doc-components.service'

/** GET /api/doc-components — list (Component Read). */
export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const parsed = QuerySchema.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  return DocComponentsService.findAll(parsed.data)
})
