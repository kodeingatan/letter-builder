import { z } from 'zod'

export const QueryActivityLogSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  userId: z.coerce.number().optional(),
  level: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type QueryActivityLogInput = z.infer<typeof QueryActivityLogSchema>
