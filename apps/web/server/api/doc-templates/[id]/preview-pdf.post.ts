import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { PreviewPdfSchema } from '~~/server/dto/persuratan.dto'
import { DocTemplatesService } from '~~/server/services/doc-templates.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** POST /api/doc-templates/:id/preview-pdf — form data → PDF via Task 05 (FR-006). */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  const parsed = PreviewPdfSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    const result = await DocTemplatesService.previewPdf(id, parsed.data)
    await ActivityLogsService.log({
      userId, action: 'TEMPLATE_PREVIEW_PDF', entity: 'DocTemplate',
      description: `Preview PDF template ${id}`,
    }).catch(() => {})
    return result
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
