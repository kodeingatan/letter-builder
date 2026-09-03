import { defineEventHandler, getHeader, getRouterParam, createError } from 'h3'
import { verifyToken } from '~~/server/utils/jwt'
import { SystemLogsService } from '~~/server/services/system-logs.service'

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) throw createError({ statusCode: 401, message: 'Unauthorized' })
  try { verifyToken(auth.slice(7)) } catch { throw createError({ statusCode: 401, message: 'Invalid token' }) }
  const filename = getRouterParam(event, 'filename')
  if (!filename) throw createError({ statusCode: 400, message: 'Filename required' })
  try {
    return await SystemLogsService.getStats(filename)
  } catch (e: any) {
    throw createError({ statusCode: 404, message: e.message })
  }
})
