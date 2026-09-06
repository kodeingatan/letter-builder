import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { RunsService } from '~~/server/services/runs.service'

export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' })
  try {
    return await RunsService.start(id, userId)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
