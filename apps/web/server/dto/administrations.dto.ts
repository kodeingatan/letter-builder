import { z } from 'zod'

/**
 * Step-local field types (Task 17): the Task 08 column type enum minus
 * relations (`select-table-relation`, `select-table-relation-multiple`)
 * and computed (`hidden-computed`, `readonly-computed`). Complex data
 * comes from Global Tables via bindings (Task 16, `administration.*`).
 */
export const STEP_FIELD_TYPES = ['text', 'richtext', 'date', 'select', 'number', 'currency', 'image'] as const

export type StepFieldType = (typeof STEP_FIELD_TYPES)[number]

export function isStepFieldType(type: unknown): type is StepFieldType {
  return typeof type === 'string' && (STEP_FIELD_TYPES as readonly string[]).includes(type)
}

const snakeCaseError = 'Field name must be snake_case (lowercase letters, digits, underscores, starting with a letter)'
const snakeCasePattern = /^[a-z][a-z0-9_]*$/

export const StepFieldSchema = z.object({
  name: z.string().min(1).max(64).regex(snakeCasePattern, snakeCaseError),
  label: z.string().min(1).max(100),
  type: z.string().refine(isStepFieldType, {
    message: `Type must be one of: ${STEP_FIELD_TYPES.join(', ')}`,
  }),
  required: z.boolean().default(false),
  options: z.array(z.string().min(1).max(100)).max(100).optional(),
})

export const StepItemSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1).max(100),
  templateId: z.number().int().positive().nullable().optional(),
  templateVersion: z.string().min(1).max(16).nullable().optional(),
  fields: z.array(StepFieldSchema).max(100).optional().default([]),
})

export const BulkStepsSchema = z.object({
  steps: z.array(StepItemSchema).max(100),
})

export const CreateAdministrationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
})

export const UpdateAdministrationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
})

export const AdministrationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  searchField: z.string().optional(),
  sortBy: z.string().default('id'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type StepFieldInput = z.infer<typeof StepFieldSchema>
export type StepItemInput = z.infer<typeof StepItemSchema>
export type BulkStepsInput = z.infer<typeof BulkStepsSchema>
export type CreateAdministrationInput = z.infer<typeof CreateAdministrationSchema>
export type UpdateAdministrationInput = z.infer<typeof UpdateAdministrationSchema>
export type AdministrationQueryInput = z.infer<typeof AdministrationQuerySchema>
