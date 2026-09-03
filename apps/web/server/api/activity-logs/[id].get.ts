import { defineEventHandler, getHeader, getRouterParam, createError } from 'h3'
import { verifyToken } from '~~/server/utils/jwt'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) throw createError({ statusCode: 401, message: 'Unauthorized' })
  try { verifyToken(auth.slice(7)) } catch { throw createError({ statusCode: 401, message: 'Invalid token' }) }
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' })
  try {
    return await ActivityLogsService.findOne(id)
  } catch (e: any) {
    throw createError({ statusCode: 404, message: e.message })
  }
})
