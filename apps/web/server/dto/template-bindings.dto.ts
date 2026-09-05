import { z } from 'zod'

export const BINDING_SOURCES = ['administration', 'global_table', 'manual', 'expression', 'system'] as const
export type BindingSource = (typeof BINDING_SOURCES)[number]

export const SYSTEM_KEYS = ['current_date', 'user.name', 'user.username'] as const

// --- Base binding fields (common across all sources) ---

const baseBindingFields = {
  templateId: z.number().int().positive(),
  placementId: z.string().min(1).max(64),
  componentId: z.number().int().positive(),
  requirementName: z.string().min(1).max(64).regex(
    /^[a-z][a-z0-9_]*$/,
    'requirement name must be snake_case, start with a letter, and contain only lowercase letters, numbers, and underscores',
  ),
}

// --- Source-specific schemas ---

const administrationBinding = z.object({
  ...baseBindingFields,
  source: z.literal('administration'),
  sourceRef: z.string().min(1, 'administration source requires a sourceRef').max(255),
  literalValue: z.null().optional(),
  expression: z.null().optional(),
})

const globalTableBinding = z.object({
  ...baseBindingFields,
  source: z.literal('global_table'),
  sourceRef: z.string().min(1, 'global_table source requires a sourceRef (table.column)').max(255),
  literalValue: z.null().optional(),
  expression: z.null().optional(),
})

const manualBinding = z.object({
  ...baseBindingFields,
  source: z.literal('manual'),
  sourceRef: z.null().optional(),
  literalValue: z.string().min(1, 'manual source requires a literalValue'),
  expression: z.null().optional(),
})

const expressionBinding = z.object({
  ...baseBindingFields,
  source: z.literal('expression'),
  sourceRef: z.null().optional(),
  literalValue: z.null().optional(),
  expression: z.string().min(1, 'expression source requires an expression'),
})

const systemBinding = z.object({
  ...baseBindingFields,
  source: z.literal('system'),
  sourceRef: z.enum(SYSTEM_KEYS as unknown as [string, ...string[]], {
    message: `system source sourceRef must be one of: ${SYSTEM_KEYS.join(', ')}`,
  }),
  literalValue: z.null().optional(),
  expression: z.null().optional(),
})

/**
 * Discriminated union on `source` (BR-002): each source type requires its
 * specific ref fields (sourceRef, literalValue, or expression).
 */
export const BindingUpsertSchema = z.discriminatedUnion('source', [
  administrationBinding,
  globalTableBinding,
  manualBinding,
  expressionBinding,
  systemBinding,
])

export type BindingUpsertInput = z.infer<typeof BindingUpsertSchema>

export const BulkBindingsSchema = z.object({
  bindings: z.array(BindingUpsertSchema).min(1, 'At least one binding is required'),
})

export type BulkBindingsInput = z.infer<typeof BulkBindingsSchema>

// --- Preview ---

export const PreviewBindingsSchema = z.object({
  sampleContext: z.record(z.string(), z.unknown()).default({}),
})

export type PreviewBindingsInput = z.infer<typeof PreviewBindingsSchema>
