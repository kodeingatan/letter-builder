import { z } from 'zod'

export const TableDataQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  searchField: z.string().optional(),
  sortBy: z.string().default('id'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type TableDataQueryInput = z.infer<typeof TableDataQuerySchema>

export const TableDataExportQuerySchema = TableDataQuerySchema.extend({
  format: z.enum(['csv']).default('csv'),
})

export type TableDataExportQueryInput = z.infer<typeof TableDataExportQuerySchema>
