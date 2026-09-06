/**
 * Render-context helpers (Task 20, "Data" stage).
 *
 * Pure path resolution over the frozen snapshot — no live-table access
 * (BR-001). Prototype-pollution segments are never traversed.
 */

import type { RenderContext } from './types'
import { unwrapTokenExpression } from '../composition-tree'

const BLOCKED_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype'])

export function getPath(source: unknown, path: string): unknown {
  if (!path) return undefined
  const segments = path.split('.').map((s) => s.trim()).filter(Boolean)
  let current: any = source
  for (const segment of segments) {
    if (BLOCKED_SEGMENTS.has(segment)) return undefined
    if (current === null || current === undefined) return undefined
    if (typeof current !== 'object') return undefined
    current = current[segment]
  }
  return current
}

/** True when a resolved value counts as "present" for binding purposes. */
export function isPresent(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

/**
 * Normalize a possibly `{{...}}`-wrapped token to the inner expression
 * (reuses the Task 15 unwrapper so the dialect stays unified).
 */
export function unwrapToken(raw: string): string {
  return unwrapTokenExpression(raw)
}

/**
 * Build the frozen evaluation context for a render.
 *
 * `base` is the caller-supplied snapshot material (run fields, table data,
 * system context). The result is a shallow copy with guaranteed `system`
 * and `data` namespaces so Task 09 evaluation never crashes on missing
 * roots. The input object is never mutated.
 */
export function buildEvalContext(base: RenderContext): RenderContext {
  const context: RenderContext = { ...(base ?? {}) }
  if (!context.system || typeof context.system !== 'object' || Array.isArray(context.system)) {
    context.system = {}
  }
  if (!context.data || typeof context.data !== 'object' || Array.isArray(context.data)) {
    context.data = {}
  }
  return context
}
