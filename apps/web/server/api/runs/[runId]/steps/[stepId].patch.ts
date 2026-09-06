import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { RunsService } from '~~/server/services/runs.service'
import { StepSaveSchema } from '~~/server/dto/runs.dto'

export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const runId = Number(getRouterParam(event, 'runId'))
  const stepId = Number(getRouterParam(event, 'stepId'))
  if (isNaN(runId) || isNaN(stepId)) throw createError({ statusCode: 400, message: 'Invalid runId or stepId' })
  const body = await readBody(event)
  const parsed = StepSaveSchema.safeParse(body ?? {})
  if (!parsed.success) throw createError({ statusCode: 422, message: parsed.error.errors[0].message })
  try {
    return await RunsService.saveStep(runId, stepId, parsed.data, userId)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
