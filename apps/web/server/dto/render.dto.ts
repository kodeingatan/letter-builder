import { z } from 'zod'

const MAX_CONTEXT_BYTES = 1024 * 1024

const treeNodeSchema = z.object({
  id: z.string().min(1).max(128),
  kind: z.string().min(1).max(32),
  attrs: z.record(z.string(), z.unknown()).optional(),
  children: z.array(z.unknown()).optional(),
}).passthrough()

const treeSchema = z.object({
  nodes: z.array(treeNodeSchema),
}).passthrough()

/**
 * `POST /api/render/preview` payload (Task 20, REQ-005 + Validation).
 * Either a pinned `templateId` (server loads the frozen/published tree +
 * live bindings) or an inline `tree` (editor live validation). Context is
 * capped at 1MB JSON. Node `kind` is intentionally a free string here —
 * unknown kinds warn + skip at render time, never 422 (Validation).
 */
export const PreviewRenderSchema = z.object({
  templateId: z.number().int().positive().optional(),
  tree: z.union([treeSchema, z.string().min(1)]).optional(),
  context: z.record(z.string(), z.unknown()).default({}),
}).refine((value) => value.templateId !== undefined || value.tree !== undefined, {
  message: 'Either templateId or tree is required',
}).refine(
  (value) => {
    try {
      return JSON.stringify(value.context ?? {}).length <= MAX_CONTEXT_BYTES
    } catch {
      return false
    }
  },
  { message: 'Context exceeds the 1MB JSON cap' },
)

export type PreviewRenderInput = z.infer<typeof PreviewRenderSchema>
