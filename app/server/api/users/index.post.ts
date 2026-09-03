import { defineEventHandler, getHeader, readBody, createError } from 'h3'
import { verifyToken } from '~~/server/utils/jwt'
import { UsersService } from '~~/server/services/users.service'
import { CreateUserSchema } from '~~/server/dto/users.dto'

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) throw createError({ statusCode: 401, message: 'Unauthorized' })
  try { verifyToken(auth.slice(7)) } catch { throw createError({ statusCode: 401, message: 'Invalid token' }) }
  const body = await readBody(event)
  const parsed = CreateUserSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    return await UsersService.create(parsed.data)
  } catch (e: any) {
    throw createError({ statusCode: 400, message: e.message })
  }
})
