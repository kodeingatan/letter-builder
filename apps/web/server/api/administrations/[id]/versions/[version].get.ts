import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { AdministrationsService } from '~~/server/services/administrations.service'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' })
  const version = Number(getRouterParam(event, 'version'))
  if (isNaN(version)) throw createError({ statusCode: 400, message: 'Invalid version' })
  try {
    return await AdministrationsService.findVersion(id, version)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
