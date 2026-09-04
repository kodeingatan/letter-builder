import { defineEventHandler, readBody, createError } from 'h3'
import { requireApiAccess } from '~~/server/utils/route-guard'
import { ValidateExpressionSchema } from '~~/server/dto/expressions.dto'
import { validate } from '~~/server/utils/expressions'

export default defineEventHandler(async (event) => {
  await requireApiAccess(event)
  const body = await readBody(event)
  const parsed = ValidateExpressionSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.errors[0].message })
  }

  const { expression, sampleContext } = parsed.data
  const result = validate(expression, sampleContext)

  return result
})
