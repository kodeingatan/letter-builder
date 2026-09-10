/**
 * Shared rendering-engine contracts for the client (Task 20).
 * Canonical home for the warning types (Task 24 single source of truth):
 * `server/utils/rendering/types.ts` re-exports these names instead of
 * redeclaring them, so Nuxt auto-import registers each exactly once.
 */

export type RenderWarningCode =
  | 'MISSING_DATA'
  | 'EXPR_ERROR'
  | 'LOOP_TRUNCATED'
  | 'IMAGE_MISSING'
  | 'TIMEOUT'
  | 'UNKNOWN_NODE'

export interface RenderWarning {
  code: RenderWarningCode
  nodeId: string | null
  message: string
}

export interface RenderPreviewResponse {
  html: string
  warnings: RenderWarning[]
  timings?: {
    data: number
    component: number
    binding: number
    loop: number
    condition: number
    html: number
    total: number
  }
}

export interface RenderPreviewPayload {
  templateId?: number
  tree?: { nodes: unknown[] } | string
  context?: Record<string, unknown>
}
