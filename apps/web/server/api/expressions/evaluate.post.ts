import { defineEventHandler, readBody, createError, setHeader } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { checkExpressionRateLimit } from '~~/server/utils/security-limits'
import { EvaluateExpressionSchema } from '~~/server/dto/expressions.dto'
import { evaluate } from '~~/server/utils/expressions'

export default defineEventHandler(async (event) => {
  const userId = await requireApiAccess(event)
  try {
    checkExpressionRateLimit(userId)
  } catch (e: any) {
    setHeader(event, 'Retry-After', String(e.data?.retryAfter ?? 60))
    throw createError({ statusCode: e.statusCode ?? 429, message: e.message, data: e.data })
  }
  const body = await readBody(event)
  const parsed = EvaluateExpressionSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  }

  const { expression, context } = parsed.data
  const result = evaluate(expression, context || {})

  return result
})
