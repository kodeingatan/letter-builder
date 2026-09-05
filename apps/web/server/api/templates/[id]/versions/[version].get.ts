import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { TemplatesService } from '~~/server/services/templates.service'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  const version = Number(getRouterParam(event, 'version'))
  if (isNaN(id) || isNaN(version)) throw createError({ statusCode: 400, message: 'Invalid id or version' })
  try {
    return await TemplatesService.findVersion(id, version)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 404, message: e.message, data: e.data })
  }
})
