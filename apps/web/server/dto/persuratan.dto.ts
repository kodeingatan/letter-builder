import { z } from 'zod'
import { DocNodeSchema } from './documents.dto'

export const MAX_JSON_BYTES = 1024 * 1024 // 1MB cap for tiptap_json/schema_json (Open Question: cukup)

const jsonText = (label: string) =>
  z.string().min(1, `${label} required`).max(MAX_JSON_BYTES, `${label} exceeds 1MB`).refine((text) => {
    try {
      JSON.parse(text)
      return true
    } catch {
      return false
    }
  }, `${label} must be valid JSON`)

/** Shallow Tiptap validation: doc root + binding-node attrs (deep rules in converter). */
export const TiptapDocSchema = z.object({
  type: z.literal('doc'),
  content: z.array(z.record(z.string(), z.unknown())).default([]),
})

export const BindingViewSchema = z.enum(['text', 'image', 'component'])

export const CreateDocComponentSchema = z.object({
  name: z.string().min(1).max(120),
  is_looping: z.boolean().optional(),
  tiptap_json: z.union([TiptapDocSchema, z.record(z.string(), z.unknown())]),
})

export const UpdateDocComponentSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  is_looping: z.boolean().optional(),
  tiptap_json: z.union([TiptapDocSchema, z.record(z.string(), z.unknown())]).optional(),
})

const codeRule = z.string().regex(/^[a-z0-9-_]{2,60}$/, 'Code must match [a-z0-9-_]{2,60}')

export const CreateDocTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  code: codeRule,
  description: z.string().max(2000).optional(),
  schema_json: DocNodeSchema,
})

export const UpdateDocTemplateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  schema_json: DocNodeSchema.optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
})

export const MappingEntrySchema = z.object({
  kind: z.enum(['field', 'value', 'master-cell', 'master-list', 'system']),
  ref: z.string().min(1).max(500),
})

export const AdminStepInputSchema = z.object({
  template_id: z.number().int().positive(),
  step_order: z.number().int().min(0).max(100),
  mapping: z.record(z.string(), MappingEntrySchema).default({}),
})

const slugRule = z.string().regex(/^[a-z][a-z0-9-]{1,60}$/, 'Slug must match [a-z][a-z0-9-]{1,60}')

export const CreateAdministrationSchema = z.object({
  name: z.string().min(1).max(120),
  slug: slugRule.optional(),
  description: z.string().max(2000).optional(),
  steps: z.array(AdminStepInputSchema).max(20).optional(),
})

export const UpdateAdministrationSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  steps: z.array(AdminStepInputSchema).max(20).optional(),
})

export const RunWizardSchema = z.object({
  data: z.record(z.string(), z.unknown()).default({}),
  extra_steps: z.array(AdminStepInputSchema.omit({ step_order: true })).max(20).default([]),
  document_number: z.string().max(120).optional(),
  as_draft: z.boolean().optional(),
})

export const PreviewPdfSchema = z.object({
  data: z.record(z.string(), z.unknown()).default({}),
  page: z.object({
    size: z.enum(['A4', 'F4', 'Letter']),
    orientation: z.enum(['portrait', 'landscape']),
  }).optional(),
})

export const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  sortBy: z.string().max(32).default('id'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type CreateDocComponentInput = z.infer<typeof CreateDocComponentSchema>
export type UpdateDocComponentInput = z.infer<typeof UpdateDocComponentSchema>
export type CreateDocTemplateInput = z.infer<typeof CreateDocTemplateSchema>
export type UpdateDocTemplateInput = z.infer<typeof UpdateDocTemplateSchema>
export type CreateAdministrationInput = z.infer<typeof CreateAdministrationSchema>
export type UpdateAdministrationInput = z.infer<typeof UpdateAdministrationSchema>
export type RunWizardInput = z.infer<typeof RunWizardSchema>
export type PreviewPdfInput = z.infer<typeof PreviewPdfSchema>
export type PersuratanQueryInput = z.infer<typeof QuerySchema>

export { jsonText }
