import { defineEventHandler, getRouterParam, createError, setHeader } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { DocumentsService } from '~~/server/services/documents.service'

export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' })
  try {
    const html = await DocumentsService.getHtml(id, userId)
    setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    return html
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
