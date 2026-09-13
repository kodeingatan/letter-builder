import { defineEventHandler, getRouterParam, createError, sendStream } from 'h3'
import { createReadStream } from 'node:fs'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { DocumentsService } from '~~/server/services/documents.service'

/** GET /api/documents/:id/pdf — download the run PDF (Step 6). */
export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  try {
    const filePath = await DocumentsService.pdfFilePath(id)
    event.node.res.setHeader('Content-Type', 'application/pdf')
    return sendStream(event, createReadStream(filePath))
  } catch (error) {
    throw createError({
      statusCode: (error as Error & { statusCode?: number }).statusCode ?? 500,
      message: (error as Error).message,
    })
  }
})
