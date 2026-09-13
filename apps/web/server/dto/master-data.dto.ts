import { z } from 'zod'

export const MASTER_COLUMN_TYPES = [
  'text',
  'richtext',
  'date',
  'datetime',
  'time',
  'image',
  'select',
  'select_multiple',
  'relation_single',
  'relation_multiple',
  'number',
  'hidden_operation_text',
  'readonly_operation_text',
] as const

export type MasterColumnType = (typeof MASTER_COLUMN_TYPES)[number]

export const OPERATION_COLUMN_TYPES: MasterColumnType[] = ['hidden_operation_text', 'readonly_operation_text']

const baseColumn = {
  name: z.string().regex(/^[a-z][a-z0-9_]{1,60}$/, 'Column name must match [a-z][a-z0-9_]{1,60}'),
  display_name: z.string().min(1).max(120),
  default_value: z.string().max(2000).optional(),
  is_required: z.boolean().optional(),
  is_orderable: z.boolean().optional(),
  is_searchable: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(1000).optional(),
}

const noConfig = z.object({}).strict().optional()

export const MasterColumnSchema = z.discriminatedUnion('type', [
  z.object({ ...baseColumn, type: z.literal('text'), config: noConfig }),
  z.object({ ...baseColumn, type: z.literal('richtext'), config: noConfig }),
  z.object({
    ...baseColumn, type: z.literal('date'),
    config: z.object({ format: z.string().max(32).optional() }).strict().optional(),
  }),
  z.object({
    ...baseColumn, type: z.literal('datetime'),
    config: z.object({ format: z.string().max(32).optional() }).strict().optional(),
  }),
  z.object({
    ...baseColumn, type: z.literal('time'),
    config: z.object({ format: z.string().max(32).optional() }).strict().optional(),
  }),
  z.object({ ...baseColumn, type: z.literal('image'), config: noConfig }),
  z.object({
    ...baseColumn, type: z.literal('select'),
    config: z.object({ options: z.array(z.string().min(1).max(200)).min(1).max(200) }).strict(),
  }),
  z.object({
    ...baseColumn, type: z.literal('select_multiple'),
    config: z.object({ options: z.array(z.string().min(1).max(200)).min(1).max(200) }).strict(),
  }),
  z.object({
    ...baseColumn, type: z.literal('relation_single'),
    config: z.object({
      target_slug: z.string().regex(/^[a-z][a-z0-9_]{1,60}$/),
      display_column: z.string().regex(/^[a-z][a-z0-9_]{1,60}$/).optional(),
    }).strict(),
  }),
  z.object({
    ...baseColumn, type: z.literal('relation_multiple'),
    config: z.object({
      target_slug: z.string().regex(/^[a-z][a-z0-9_]{1,60}$/),
      display_column: z.string().regex(/^[a-z][a-z0-9_]{1,60}$/).optional(),
    }).strict(),
  }),
  z.object({
    ...baseColumn, type: z.literal('number'),
    config: z.object({ currency: z.boolean().optional() }).strict().optional(),
  }),
  z.object({
    ...baseColumn, type: z.literal('hidden_operation_text'),
    config: z.object({ expression: z.string().min(1).max(2000) }).strict(),
  }),
  z.object({
    ...baseColumn, type: z.literal('readonly_operation_text'),
    config: z.object({ expression: z.string().min(1).max(2000) }).strict(),
  }),
])

export type MasterColumnInput = z.infer<typeof MasterColumnSchema>

const tableBase = {
  name: z.string().regex(/^[a-z][a-z0-9_]{1,60}$/, 'Name must match [a-z][a-z0-9_]{1,60}'),
  display_name: z.string().min(1).max(120),
  slug: z.string().regex(/^[a-z][a-z0-9_]{1,60}$/, 'Slug must match [a-z][a-z0-9_]{1,60}').optional(),
  description: z.string().max(2000).optional(),
}

export const CreateMasterTableSchema = z.object({
  ...tableBase,
  columns: z.array(MasterColumnSchema).min(1).max(100),
})

export const UpdateMasterTableSchema = z.object({
  display_name: tableBase.display_name.optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  columns: z.array(MasterColumnSchema).min(1).max(100).optional(),
})

export const QueryMasterTableSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  sortBy: z.string().max(32).default('id'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
})

export const QueryMasterRowSchema = QueryMasterTableSchema.extend({
  searchField: z.string().max(64).optional(),
})

export type CreateMasterTableInput = z.infer<typeof CreateMasterTableSchema>
export type UpdateMasterTableInput = z.infer<typeof UpdateMasterTableSchema>
export type QueryMasterTableInput = z.infer<typeof QueryMasterTableSchema>
export type QueryMasterRowInput = z.infer<typeof QueryMasterRowSchema>
