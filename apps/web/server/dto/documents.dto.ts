import { z } from 'zod'
import type { ConditionOperator, DocNodeType } from '../../shared/types/document'

export const DOC_NODE_TYPES: DocNodeType[] = [
  'document', 'header', 'content', 'section', 'footer',
  'text', 'heading', 'paragraph', 'image', 'table',
  'signature', 'date', 'qrcode', 'divider', 'pagebreak',
  'repeater', 'condition', 'component-ref',
]

export const CONDITION_OPERATORS: ConditionOperator[] = [
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'in', 'empty',
]

export const MAX_DOC_DEPTH = 10
export const MAX_DOC_NODES = 200
/** POST body data cap: 2 MB of JSON (Cross-Cutting). */
export const MAX_DATA_JSON_BYTES = 2 * 1024 * 1024

const PropsSchema = z.record(z.string(), z.unknown())

export const DocNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    type: z.enum(DOC_NODE_TYPES as [DocNodeType, ...DocNodeType[]]),
    props: PropsSchema.optional(),
    children: z.array(DocNodeSchema).optional(),
    elseChildren: z.array(DocNodeSchema).optional(),
  }),
)

const DataSchema = z.record(z.string(), z.unknown()).superRefine((data, ctx) => {
  const bytes = Buffer.byteLength(JSON.stringify(data), 'utf8')
  if (bytes > MAX_DATA_JSON_BYTES) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `data exceeds 2 MB limit (${bytes} bytes)` })
  }
})

export const PageOptionsSchema = z.object({
  size: z.enum(['A4', 'F4', 'Letter']),
  orientation: z.enum(['portrait', 'landscape']),
})

export const PreviewDocumentSchema = z.object({
  schema_json: DocNodeSchema,
  data: DataSchema.default({}),
})

export const PdfDocumentSchema = PreviewDocumentSchema.extend({
  page: PageOptionsSchema.optional(),
})

export type PreviewDocumentInput = z.infer<typeof PreviewDocumentSchema>
export type PdfDocumentInput = z.infer<typeof PdfDocumentSchema>

/** Manual depth/node-count check (BR-001): recursion-safe, no mutation. */
export function assertTreeLimits(tree: unknown): void {
  const { depth, count } = measureTree(tree, 0)
  if (depth > MAX_DOC_DEPTH) {
    throw new Error(`Document tree depth ${depth} exceeds limit ${MAX_DOC_DEPTH}`)
  }
  if (count > MAX_DOC_NODES) {
    throw new Error(`Document tree has ${count} nodes, exceeds limit ${MAX_DOC_NODES}`)
  }
}

function measureTree(node: unknown, depth: number): { depth: number; count: number } {
  if (node === null || typeof node !== 'object') return { depth, count: 0 }
  const record = node as { children?: unknown; elseChildren?: unknown }
  let maxDepth = depth
  let count = 1
  for (const key of ['children', 'elseChildren'] as const) {
    const kids = record[key]
    if (Array.isArray(kids)) {
      for (const kid of kids) {
        const sub = measureTree(kid, depth + 1)
        if (sub.depth > maxDepth) maxDepth = sub.depth
        count += sub.count
      }
    }
  }
  return { depth: maxDepth, count }
}
