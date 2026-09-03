import { defineEventHandler, readBody, createError } from 'h3'
import { AuthService } from '~~/server/services/auth.service'
import { RegisterSchema } from '~~/server/dto/auth.dto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  try {
    return await AuthService.register(parsed.data)
  } catch (e: any) {
    throw createError({ statusCode: 400, message: e.message })
  }
})
