import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { TemplateBindingsService } from '~~/server/services/template-bindings.service'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' })
  const bindingId = Number(getRouterParam(event, 'bindingId'))
  if (isNaN(bindingId)) throw createError({ statusCode: 400, message: 'Invalid binding id' })
  try {
    return await TemplateBindingsService.remove(id, bindingId)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
