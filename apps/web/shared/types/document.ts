/**
 * Document Engine canonical types (Task 05).
 *
 * Generic JSON Tree model: Document Template → Layout → Component →
 * Data Source → Repeater → Condition. No per-letter controller/service.
 */

export type DocNodeType =
  | 'document'
  | 'header'
  | 'content'
  | 'section'
  | 'footer'
  | 'text'
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'table'
  | 'signature'
  | 'date'
  | 'qrcode'
  | 'divider'
  | 'pagebreak'
  | 'repeater'
  | 'condition'
  | 'component-ref'

export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'in'
  | 'empty'

export interface DocNode {
  type: DocNodeType
  props?: Record<string, unknown>
  children?: DocNode[]
  /** Only for `condition` nodes: rendered when the condition is false. */
  elseChildren?: DocNode[]
}

export interface RenderScope {
  [varName: string]: unknown
}

export interface RenderContext {
  data: Record<string, unknown>
  scope: RenderScope
  depth: number
}

export interface RenderResult {
  html: string
  warnings: string[]
}

export type PdfPageSize = 'A4' | 'F4' | 'Letter'
export type PdfOrientation = 'portrait' | 'landscape'

export interface PdfOptions {
  size: PdfPageSize
  orientation: PdfOrientation
}

export interface PreviewRequest {
  schema_json: DocNode
  data: Record<string, unknown>
}

export interface PdfRequest extends PreviewRequest {
  page?: PdfOptions
}

export interface PreviewResponse {
  html: string
  warnings: string[]
}

export interface PdfResponse {
  url: string
}
