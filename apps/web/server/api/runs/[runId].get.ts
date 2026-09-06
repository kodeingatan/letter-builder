import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { RunsService } from '~~/server/services/runs.service'

export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const runId = Number(getRouterParam(event, 'runId'))
  if (isNaN(runId)) throw createError({ statusCode: 400, message: 'Invalid runId' })
  try {
    return await RunsService.findOne(runId, userId)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
