import { defineEventHandler, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { PreviewDocumentSchema, assertTreeLimits } from '~~/server/dto/documents.dto'
import { RendererService } from '~~/server/services/renderer.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/**
 * POST /api/documents/preview — render a document tree to HTML without saving.
 * Permission: POST /api/documents/preview (Document Preview).
 */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const body = await readBody(event)
  const parsed = PreviewDocumentSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    assertTreeLimits(parsed.data.schema_json)
  } catch (error) {
    throw createError({ statusCode: 400, message: (error as Error).message })
  }
  const result = RendererService.render(
    parsed.data.schema_json as import('~/shared/types/document').DocNode,
    parsed.data.data as Record<string, unknown>,
  )
  // Best-effort audit trail: logging must never break the preview itself.
  await ActivityLogsService.log({
    userId,
    action: 'DOCUMENT_PREVIEW',
    entity: 'Document',
    description: 'Preview document tree',
  }).catch(() => {})
  return result
})
