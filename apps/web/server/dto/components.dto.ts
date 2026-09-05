import { z } from 'zod'

export const COMPONENT_REQUIREMENT_NAME_PATTERN = /^[a-z][a-z0-9_]*$/

export const COMPONENT_REQUIREMENT_TYPES = ['text', 'date', 'image', 'number', 'richtext'] as const

export type ComponentRequirementType = (typeof COMPONENT_REQUIREMENT_TYPES)[number]

export const ComponentRequirementSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(
      COMPONENT_REQUIREMENT_NAME_PATTERN,
      'requirement name must be snake_case, start with a letter, and contain only lowercase letters, numbers, and underscores',
    ),
  type: z.enum(COMPONENT_REQUIREMENT_TYPES),
})

export type ComponentRequirementInput = z.infer<typeof ComponentRequirementSchema>

export const CreateComponentSchema = z.object({
  name: z.string().min(1).max(100),
  content: z.string().optional().nullable(),
  looping: z.boolean().default(false),
  requirements: z.array(ComponentRequirementSchema).default([]),
})

export const UpdateComponentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  content: z.string().optional().nullable(),
  looping: z.boolean().optional(),
  requirements: z.array(ComponentRequirementSchema).optional(),
})

export const ComponentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  searchField: z.string().optional(),
  sortBy: z.string().default('id'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
})

export const PreviewComponentSchema = z.object({
  samples: z.record(z.string(), z.union([z.string(), z.number()])).optional().default({}),
  items: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).optional(),
})

export type CreateComponentInput = z.infer<typeof CreateComponentSchema>
export type UpdateComponentInput = z.infer<typeof UpdateComponentSchema>
export type ComponentQueryInput = z.infer<typeof ComponentQuerySchema>
export type PreviewComponentInput = z.infer<typeof PreviewComponentSchema>
