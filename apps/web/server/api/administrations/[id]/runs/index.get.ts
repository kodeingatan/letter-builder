import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { QuerySchema } from '~~/server/dto/persuratan.dto'
import { DocumentsService } from '~~/server/services/documents.service'

/** GET /api/administrations/:id/runs — run history (version-locked snapshots). */
export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  const parsed = QuerySchema.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  return DocumentsService.findAll(parsed.data, id)
})
