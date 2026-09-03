import { defineEventHandler, getHeader, createError } from 'h3'
import { verifyToken } from '~~/server/utils/jwt'
import { AuthService } from '~~/server/services/auth.service'

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) throw createError({ statusCode: 401, message: 'Unauthorized' })
  try {
    const payload = verifyToken(auth.slice(7))
    return await AuthService.getProfile(payload.sub)
  } catch (e: any) {
    throw createError({ statusCode: 401, message: e.message })
  }
})
