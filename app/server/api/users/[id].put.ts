import { defineEventHandler, getHeader, getRouterParam, readBody, createError } from 'h3'
import { verifyToken } from '~~/server/utils/jwt'
import { UsersService } from '~~/server/services/users.service'
import { UpdateUserSchema } from '~~/server/dto/users.dto'

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) throw createError({ statusCode: 401, message: 'Unauthorized' })
  try { verifyToken(auth.slice(7)) } catch { throw createError({ statusCode: 401, message: 'Invalid token' }) }
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Invalid id' })
  const body = await readBody(event)
  const parsed = UpdateUserSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    return await UsersService.update(id, parsed.data)
  } catch (e: any) {
    throw createError({ statusCode: 400, message: e.message })
  }
})
