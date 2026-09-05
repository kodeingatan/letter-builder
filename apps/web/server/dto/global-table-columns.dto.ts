import { z } from 'zod'

export const GLOBAL_TABLE_COLUMN_TYPES = ['text', 'richtext', 'date', 'select', 'number', 'currency', 'image', 'hidden-computed', 'readonly-computed', 'select-table-relation', 'select-table-relation-multiple'] as const

export function isGlobalTableColumnType(type: string): type is (typeof GLOBAL_TABLE_COLUMN_TYPES)[number] {
  return GLOBAL_TABLE_COLUMN_TYPES.includes(type as any)
}

export function isRelationalType(type: string): type is 'select-table-relation' | 'select-table-relation-multiple' {
  return type === 'select-table-relation' || type === 'select-table-relation-multiple'
}

export const RelationConfigSchema = z.object({
  displayColumns: z.array(z.string()).min(1, 'At least one display column required'),
  separator: z.string().optional().default(' - '),
  onTargetDelete: z.enum(['restrict', 'detach']).optional(),
})

export type RelationConfigInput = z.infer<typeof RelationConfigSchema>

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

const BaseColumnSchema = {
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
  expression: z.string().max(2000).optional(),
  relationTableId: z.number().nullable().optional(),
  relationConfig: z.string().optional(),
}

export const CreateGlobalTableColumnSchema = z.object(BaseColumnSchema).refine(
  (data) => {
    const isRelational = isRelationalType(data.type)
    if (isRelational && !data.relationTableId) {
      return false
    }
    if (!isRelational && data.relationTableId) {
      return false
    }
    return true
  },
  { message: 'relationTableId is required for relational column types and forbidden for non-relational types' }
)

export type CreateGlobalTableColumnInput = z.infer<typeof CreateGlobalTableColumnSchema>

export const UpdateGlobalTableColumnSchema = z
  .object({
    displayName: z.string().min(1).max(100).optional(),
    type: z.enum(GLOBAL_TABLE_COLUMN_TYPES).optional(),
    defaultValue: z.string().optional(),
    required: z.boolean().optional(),
    searchable: z.boolean().optional(),
    orderable: z.boolean().optional(),
    position: z.number().int().min(0).optional(),
    options: z.string().optional(),
    format: z.string().optional(),
    expression: z.string().max(2000).optional(),
    relationTableId: z.number().nullable().optional(),
    relationConfig: z.string().optional(),
  })
  .strict()
  .refine(
    (data) => {
      const relationalTypes = ['select-table-relation', 'select-table-relation-multiple']
      const isRelational = data.type ? relationalTypes.includes(data.type) : data.relationTableId !== undefined
      if (isRelational && !data.relationTableId) {
        return false
      }
      if (!isRelational && data.relationTableId) {
        return false
      }
      return true
    },
    { message: 'relationTableId must match column type (relational types require it, non-relational cannot have it)' }
  )

export type UpdateGlobalTableColumnInput = z.infer<typeof UpdateGlobalTableColumnSchema>

export const ReorderGlobalTableColumnsSchema = z.object({
  orderedIds: z.array(z.number()).nonempty('At least one column must be provided'),
})

export type ReorderGlobalTableColumnsInput = z.infer<typeof ReorderGlobalTableColumnsSchema>