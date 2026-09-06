/**
 * Shared rendering-engine contracts (Task 20).
 *
 * DB-free so unit tests can import the pipeline directly without pulling
 * the TypeORM chain. Warning codes match the task Data Model contract.
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

export type RenderContext = Record<string, any>

export interface ComponentSnapshotLike {
  nodeId?: string
  componentId: number
  componentName?: string
  content: string | null
  looping?: boolean
  requirements?: Array<{ name: string; type: string }>
}

export interface BindingLike {
  placementId: string
  requirementName: string
  componentId?: number
  source: 'administration' | 'global_table' | 'manual' | 'expression' | 'system' | string
  sourceRef?: string | null
  literalValue?: string | null
  expression?: string | null
}

export interface RenderOptions {
  /** Frozen component snapshots (issuance) or live requirements (preview). */
  componentSnapshots?: ComponentSnapshotLike[]
  /** Frozen/persisted bindings resolved against the context. */
  bindings?: BindingLike[]
  /** BR-003: per-render collection cap. */
  maxLoopItems?: number
  /** BR-004: pipeline deadline in ms (service passes 10_000 / 30_000). */
  timeoutMs?: number
}

export interface RenderTimings {
  data: number
  component: number
  binding: number
  loop: number
  condition: number
  html: number
  total: number
}

export interface RenderResult {
  html: string
  warnings: RenderWarning[]
  timings: RenderTimings
}

export const DEFAULT_MAX_LOOP_ITEMS = 500
