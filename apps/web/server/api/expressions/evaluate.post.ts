import { defineEventHandler, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { EvaluateExpressionSchema } from '~~/server/dto/expressions.dto'
import { evaluate } from '~~/server/utils/expressions'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const body = await readBody(event)
  const parsed = EvaluateExpressionSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  }

  const { expression, context } = parsed.data
  const result = evaluate(expression, context || {})

  return result
})
