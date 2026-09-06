import { defineEventHandler, getRouterParam, createError, setHeader, sendStream } from 'h3'
import { createReadStream } from 'fs'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { DocumentsService } from '~~/server/services/documents.service'
import { StorageService } from '~~/server/services/storage.service'
import { buildPdfFilename, safeStorageFilename } from '~~/server/utils/document-helpers'

export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' })
  try {
    const info = await DocumentsService.getPdf(id, userId)
    const filename = safeStorageFilename(info.filePath.split('/').pop() ?? '')
    const filePath = await StorageService.getFilePath('documents', filename).catch(() => {
      throw createError({ statusCode: 404, message: 'PDF file missing from storage' })
    })
    setHeader(event, 'Content-Type', 'application/pdf')
    setHeader(event, 'Content-Disposition', `attachment; filename="${buildPdfFilename(info.administrationName, id)}"`)
    return sendStream(event, createReadStream(filePath))
  } catch (e: any) {
    if (e.statusCode) throw e
    throw createError({ statusCode: 400, message: e.message })
  }
})
