import { defineEventHandler, getHeader, getQuery, createError } from 'h3'
import { verifyToken } from '~~/server/utils/jwt'
import { RolesService } from '~~/server/services/roles.service'
import { QuerySchema } from '~~/server/dto/users.dto'

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) throw createError({ statusCode: 401, message: 'Unauthorized' })
  try { verifyToken(auth.slice(7)) } catch { throw createError({ statusCode: 401, message: 'Invalid token' }) }
  const query = getQuery(event)
  const parsed = QuerySchema.safeParse(query)
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  return RolesService.findAll(parsed.data)
})
