import { defineEventHandler, getQuery, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { DocumentsService } from '~~/server/services/documents.service'
import { DocumentQuerySchema } from '~~/server/dto/documents.dto'

export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const parsed = DocumentQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 422, message: parsed.error.errors[0].message })
  try {
    return await DocumentsService.findAll(parsed.data, userId)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
