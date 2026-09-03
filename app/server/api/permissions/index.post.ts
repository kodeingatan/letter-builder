import { defineEventHandler, getHeader, readBody, createError } from 'h3'
import { verifyToken } from '~~/server/utils/jwt'
import { PermissionsService } from '~~/server/services/permissions.service'
import { CreatePermissionSchema } from '~~/server/dto/permissions.dto'

export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) throw createError({ statusCode: 401, message: 'Unauthorized' })
  try { verifyToken(auth.slice(7)) } catch { throw createError({ statusCode: 401, message: 'Invalid token' }) }
  const body = await readBody(event)
  const parsed = CreatePermissionSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    return await PermissionsService.create(parsed.data)
  } catch (e: any) {
    throw createError({ statusCode: 400, message: e.message })
  }
})
