import { defineEventHandler, getHeader, readBody, createError } from 'h3'
import { verifyToken } from '~~/server/utils/jwt'
import { RolesService } from '~~/server/services/roles.service'
import { CreateRoleSchema } from '~~/server/dto/roles.dto'

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) throw createError({ statusCode: 401, message: 'Unauthorized' })
  try { verifyToken(auth.slice(7)) } catch { throw createError({ statusCode: 401, message: 'Invalid token' }) }
  const body = await readBody(event)
  const parsed = CreateRoleSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    return await RolesService.create(parsed.data)
  } catch (e: any) {
    throw createError({ statusCode: 400, message: e.message })
  }
})
