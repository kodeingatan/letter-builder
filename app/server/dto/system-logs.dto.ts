import { z } from 'zod'

export const QuerySystemLogSchema = z.object({
  level: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().default(100),
  offset: z.coerce.number().default(0),
})

export type QuerySystemLogInput = z.infer<typeof QuerySystemLogSchema>
