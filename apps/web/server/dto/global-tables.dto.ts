import { z } from 'zod'

export const GLOBAL_TABLE_NAME_PATTERN = /^[a-z][a-z0-9_]*$/

export const RESERVED_GLOBAL_TABLE_NAMES = [
  'users',
  'roles',
  'permissions',
  'guards',
  'settings',
  'activity_logs',
  'migrations',
]

export function isReservedGlobalTableName(name: string): boolean {
  return RESERVED_GLOBAL_TABLE_NAMES.includes(name.toLowerCase())
}

export const GlobalTableQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  searchField: z.string().optional(),
  sortBy: z.string().default('id'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
})

export const CreateGlobalTableSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(
      GLOBAL_TABLE_NAME_PATTERN,
      'name must be snake_case, start with a letter, and contain only lowercase letters, numbers, and underscores',
    ),
  displayName: z.string().min(1).max(100),
})

export const UpdateGlobalTableSchema = z
  .object({
    displayName: z.string().min(1).max(100),
    name: z.never().optional(),
  })
  .strict()

export type GlobalTableQueryInput = z.infer<typeof GlobalTableQuerySchema>
export type CreateGlobalTableInput = z.infer<typeof CreateGlobalTableSchema>
export type UpdateGlobalTableInput = z.infer<typeof UpdateGlobalTableSchema>
