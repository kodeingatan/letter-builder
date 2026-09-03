import { defineEventHandler, getHeader, createError } from 'h3'
import { verifyToken } from '~~/server/utils/jwt'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) throw createError({ statusCode: 401, message: 'Unauthorized' })
  try { verifyToken(auth.slice(7)) } catch { throw createError({ statusCode: 401, message: 'Invalid token' }) }
  return ActivityLogsService.getStats()
})
