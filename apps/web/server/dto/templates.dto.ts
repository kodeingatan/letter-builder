import { z } from 'zod'

const contentShapeError = 'Content must be a JSON document tree { nodes: [...] }'

/**
 * Local skeleton check (self-contained — no server imports — so the DTO
 * stays runnable in the `unit` vitest project; mirrors
 * `server/utils/template-helpers.ts` `validateContentTree`).
 */
function isValidSkeleton(content: string): boolean {
  try {
    const parsed: unknown = JSON.parse(content)
    return !!parsed && typeof parsed === 'object' && Array.isArray((parsed as { nodes?: unknown }).nodes)
  } catch {
    return false
  }
}

/** Draft content: optional; when provided and non-blank it must parse as `{ nodes: [...] }`. */
const draftContentField = z
  .string()
  .optional()
  .nullable()
  .refine(
    (value) => {
      if (value === undefined || value === null || !value.trim()) return true
      return isValidSkeleton(value)
    },
    { message: contentShapeError },
  )

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  content: draftContentField,
})

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  content: draftContentField,
})

export const TemplateQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  searchField: z.string().optional(),
  sortBy: z.string().default('id'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>
export type TemplateQueryInput = z.infer<typeof TemplateQuerySchema>
