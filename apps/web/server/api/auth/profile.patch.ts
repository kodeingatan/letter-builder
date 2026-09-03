import { defineEventHandler, getHeader, readBody, createError } from 'h3'
import { verifyToken } from '~~/server/utils/jwt'
import { AuthService } from '~~/server/services/auth.service'
import { UpdateProfileSchema } from '~~/server/dto/auth.dto'

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) throw createError({ statusCode: 401, message: 'Unauthorized' })
  const body = await readBody(event)
  const parsed = UpdateProfileSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    const payload = verifyToken(auth.slice(7))
    return await AuthService.updateProfile(payload.sub, parsed.data)
  } catch (e: any) {
    throw createError({ statusCode: 400, message: e.message })
  }
})
