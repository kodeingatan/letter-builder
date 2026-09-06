import { z } from 'zod'

export const StepSaveSchema = z.object({
  fields: z.record(z.string(), z.unknown()).optional().default({}),
  rowSelections: z.record(z.string(), z.array(z.coerce.number().int().positive()).max(500)).optional().default({}),
  manualInputs: z.record(z.string(), z.unknown()).optional().default({}),
})

export type StepSaveInput = z.infer<typeof StepSaveSchema>

export const RunsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['in_progress', 'completed', 'cancelled']).optional(),
  scope: z.enum(['mine', 'all']).optional().default('mine'),
  search: z.string().optional(),
  searchField: z.string().optional(),
  sortBy: z.string().default('id'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type RunsQueryInput = z.infer<typeof RunsQuerySchema>
