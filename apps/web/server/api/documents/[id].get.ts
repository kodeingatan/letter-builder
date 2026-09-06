import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { DocumentsService } from '~~/server/services/documents.service'

export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' })
  const metaOnly = (getQuery(event) as Record<string, unknown>).meta === '1'
  try {
    return await DocumentsService.findOne(id, userId, metaOnly)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
