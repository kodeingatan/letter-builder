import { defineEventHandler, getHeader, getRouterParam, getQuery, createError } from 'h3'
import { verifyToken } from '~~/server/utils/jwt'
import { SystemLogsService } from '~~/server/services/system-logs.service'
import { QuerySystemLogSchema } from '~~/server/dto/system-logs.dto'

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) throw createError({ statusCode: 401, message: 'Unauthorized' })
  try { verifyToken(auth.slice(7)) } catch { throw createError({ statusCode: 401, message: 'Invalid token' }) }
  const filename = getRouterParam(event, 'filename')
  if (!filename) throw createError({ statusCode: 400, message: 'Filename required' })
  const query = getQuery(event)
  const parsed = QuerySystemLogSchema.safeParse(query)
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    return await SystemLogsService.readFileContent(filename, parsed.data)
  } catch (e: any) {
    throw createError({ statusCode: 404, message: e.message })
  }
})
