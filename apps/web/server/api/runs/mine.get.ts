import { defineEventHandler, getQuery, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { RunsService } from '~~/server/services/runs.service'
import { RunsQuerySchema } from '~~/server/dto/runs.dto'

export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  const parsed = RunsQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 422, message: parsed.error.errors[0].message })
  try {
    return await RunsService.findMine(parsed.data, userId)
  } catch (e: any) {
    throw createError({ statusCode: e.statusCode ?? 400, message: e.message, data: e.data })
  }
})
