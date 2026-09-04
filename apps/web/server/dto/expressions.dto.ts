import { z } from 'zod'

export const ValidateExpressionSchema = z.object({
  expression: z.string().min(1).max(2000),
  sampleContext: z.record(z.unknown()).optional(),
})

export type ValidateExpressionInput = z.infer<typeof ValidateExpressionSchema>

export const EvaluateExpressionSchema = z.object({
  expression: z.string().min(1).max(2000),
  context: z.record(z.unknown()).optional().default(() => ({})),
})

export type EvaluateExpressionInput = z.infer<typeof EvaluateExpressionSchema>
