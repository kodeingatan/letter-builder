import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { DocumentsService } from '~~/server/services/documents.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/** POST /api/documents/:id/pdf — regenerate PDF from the snapshot (ERR-03 retry). */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  try {
    const document = await DocumentsService.regeneratePdf(id)
    await ActivityLogsService.log({
      userId, action: 'DOCUMENT_REGENERATE_PDF', entity: 'Document',
      description: `Regenerate PDF document ${id}`,
    }).catch(() => {})
    return document
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
