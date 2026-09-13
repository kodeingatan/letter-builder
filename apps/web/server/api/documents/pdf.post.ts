import { defineEventHandler, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { PdfDocumentSchema, assertTreeLimits } from '~~/server/dto/documents.dto'
import { PdfService } from '~~/server/services/pdf.service'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

/**
 * POST /api/documents/pdf — render a document tree to PDF via Puppeteer.
 * Permission: POST /api/documents/pdf (Document PDF).
 */
export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const body = await readBody(event)
  const parsed = PdfDocumentSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    assertTreeLimits(parsed.data.schema_json)
  } catch (error) {
    throw createError({ statusCode: 400, message: (error as Error).message })
  }
  try {
    const result = await PdfService.generatePdf(
      parsed.data.schema_json as import('~/shared/types/document').DocNode,
      parsed.data.data as Record<string, unknown>,
      parsed.data.page,
    )
    await ActivityLogsService.log({
      userId,
      action: 'DOCUMENT_PDF',
      entity: 'Document',
      description: 'Generate document PDF',
      metadata: result.url,
    }).catch(() => {})
    return result
  } catch (error) {
    throw createError({ statusCode: 500, message: (error as Error).message })
  }
})
