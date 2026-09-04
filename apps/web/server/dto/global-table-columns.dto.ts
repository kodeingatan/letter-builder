import { z } from 'zod'

export const GLOBAL_TABLE_COLUMN_TYPES = ['text', 'richtext', 'date', 'select', 'number', 'currency', 'image'] as const

export function isGlobalTableColumnType(type: string): type is (typeof GLOBAL_TABLE_COLUMN_TYPES)[number] {
  return GLOBAL_TABLE_COLUMN_TYPES.includes(type as any)
}

export const GlobalTableColumnQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  searchField: z.string().optional(),
  sortBy: z.string().default('position'),
  sortOrder: z.enum(['ASC', 'DESC']).default('ASC'),
})

export function isValidGlobalTableColumnType(type: unknown): type is string {
  return isGlobalTableColumnType(type)
}

export const CreateGlobalTableColumnSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, 'name must be snake_case, start with a letter'),
  displayName: z.string().min(1).max(100),
  type: z.enum(GLOBAL_TABLE_COLUMN_TYPES),
  defaultValue: z.string().optional(),
  required: z.boolean().default(false),
  searchable: z.boolean().default(false),
  orderable: z.boolean().default(false),
  position: z.number().int().min(0).default(0),
  options: z.string().optional(),
  format: z.string().optional(),
})

export type CreateGlobalTableColumnInput = z.infer<typeof CreateGlobalTableColumnSchema>

export const UpdateGlobalTableColumnSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  type: z.enum(GLOBAL_TABLE_COLUMN_TYPES).optional(),
  defaultValue: z.string().optional(),
  required: z.boolean().optional(),
  searchable: z.boolean().optional(),
  orderable: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
  options: z.string().optional(),
  format: z.string().optional(),
}).strict()

export type UpdateGlobalTableColumnInput = z.infer<typeof UpdateGlobalTableColumnSchema>

export const ReorderGlobalTableColumnsSchema = z.object({
  orderedIds: z.array(z.number()).nonempty('At least one column must be provided'),
})

export type ReorderGlobalTableColumnsInput = z.infer<typeof ReorderGlobalTableColumnsSchema>