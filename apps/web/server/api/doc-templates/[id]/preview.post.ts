import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { DocTemplatesService } from '~~/server/services/doc-templates.service'

/**
 * POST /api/doc-templates/:id/preview — render HTML without saving.
 * Decided addition (builder UX): mirrors /api/documents/preview per template.
 */
export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = (await readBody(event)) as { data?: Record<string, unknown> }
  try {
    return await DocTemplatesService.preview(id, body?.data ?? {})
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
