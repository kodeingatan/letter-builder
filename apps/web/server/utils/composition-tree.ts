/**
 * Pure composition-tree utilities for the Template Composition Editor (Task 15).
 * Kept DB-free so they are unit-testable in the `unit` vitest project.
 *
 * Node shape (extends the Task 14 `{ nodes: [...] }` skeleton — JSON
 * schemaless, no migration):
 * `{ id, kind, attrs?, children? }` where kind is one of
 * `text | image | table | component | data-token | loop | condition | page-break`.
 * Legacy Task 14 nodes (no `kind`) are treated as static passthrough content.
 */

import { validate as validateExpression, parse as parseExpression } from './expressions'

// Canonical composition-tree contracts live in `shared/types/template.ts`
// (Task 24 single source of truth — this module imports them for local use
// but does NOT re-export, so Nuxt auto-import registers each name once).
import { COMPOSITION_KINDS } from '../../shared/types/template'
import type { CompositionKind, CompositionNode, TreeIssue, UnboundSlot } from '../../shared/types/template'

export interface TreeStats {
  nodeCount: number
  placementCount: number
  loopCount: number
  conditionCount: number
  tokenCount: number
}

export interface TreeValidation {
  valid: boolean
  errors: TreeIssue[]
  warnings: TreeIssue[]
  unbound: UnboundSlot[]
  stats: TreeStats
}

/** Wrapper (loop/condition) nesting ceiling (BR-005). */
export const MAX_WRAPPER_DEPTH = 3

export const LOOP_FILTER_OPERATORS = ['==', '!=', '>', '<', '>=', '<=', 'contains'] as const

/** A node is a composition node when it carries a known `kind`. */
export function isCompositionNode(value: unknown): value is CompositionNode {
  if (!value || typeof value !== 'object') return false
  const kind = (value as Record<string, unknown>).kind
  return typeof kind === 'string' && (COMPOSITION_KINDS as readonly string[]).includes(kind)
}

/** Strip `{{` / `}}` delimiters so Task 09 validates the inner expression. */
export function unwrapTokenExpression(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
    return trimmed.slice(2, -2).trim()
  }
  return trimmed
}

/**
 * Heuristic "boolean-coercible" check (BR-003): the Task 09 AST root is a
 * comparison, a logical-not, a boolean literal, or an IF(). Anything else
 * (arithmetic, concat, bare refs) is truthy-coercible at render time but
 * flagged so the editor can warn the Designer.
 */
export function isBooleanShapedExpression(expression: string): boolean {
  try {
    const ast = parseExpression(expression) as any
    if (!ast || typeof ast.type !== 'string') return false
    if (ast.type === 'Boolean' || ast.type === 'If') return true
    if (ast.type === 'UnaryOp' && ast.operator === '!') return true
    if (ast.type === 'BinaryOp') {
      return ['==', '!=', '<', '>', '<=', '>='].includes(ast.operator)
    }
    return false
  } catch {
    return false
  }
}

const DANGEROUS_BLOCK_TAGS = ['script', 'iframe', 'style', 'object', 'embed', 'link', 'meta', 'base', 'form']

/**
 * Allowlist-lite HTML sanitizer (Security & Permission, AC-005).
 * Strips dangerous block tags (with their content), HTML comments,
 * `on*` event-handler attributes, and `javascript:` URLs. Everything else
 * passes through untouched.
 */
export function sanitizeHtmlFragment(html: string): string {
  if (!html) return html
  let out = html
  for (const tag of DANGEROUS_BLOCK_TAGS) {
    out = out.replace(new RegExp(`<${tag}[\\s>][\\s\\S]*?<\\/${tag}\\s*>`, 'gi'), '')
    out = out.replace(new RegExp(`<${tag}(\\s[^>]*)?\\/?>`, 'gi'), '')
  }
  out = out.replace(/<!--[\s\S]*?-->/g, '')
  out = out.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  out = out.replace(/\s+(href|src|xlink:href)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi, (_m, attr, _q, d, s, u) => {
    const value = (d ?? s ?? u ?? '').trim().toLowerCase()
    if (value.startsWith('javascript:') || value.startsWith('data:text/html')) return ''
    return _m
  })
  return out
}

/** `image.src` must be http(s), relative, or a safe data:image URL. */
export function isSafeImageSrc(src: string): boolean {
  const value = (src || '').trim().toLowerCase()
  if (!value) return false
  if (value.startsWith('javascript:') || value.startsWith('data:text/html')) return false
  return true
}

/** Deep-copy a tree while sanitizing every HTML-carrying field. */
export function sanitizeTree(nodes: CompositionNode[]): CompositionNode[] {
  return nodes.map((node) => {
    const attrs = { ...(node.attrs ?? {}) }
    if (typeof attrs.html === 'string') attrs.html = sanitizeHtmlFragment(attrs.html)
    if (typeof attrs.text === 'string') attrs.text = sanitizeHtmlFragment(attrs.text)
    if (Array.isArray(attrs.headers)) {
      attrs.headers = attrs.headers.map((h: unknown) => (typeof h === 'string' ? sanitizeHtmlFragment(h) : h))
    }
    if (Array.isArray(attrs.rows)) {
      attrs.rows = attrs.rows.map((row: unknown) =>
        Array.isArray(row) ? row.map((c) => (typeof c === 'string' ? sanitizeHtmlFragment(c) : c)) : row,
      )
    }
    return {
      ...node,
      attrs,
      children: Array.isArray(node.children) ? sanitizeTree(node.children) : node.children,
    }
  })
}

export interface PlacementRef {
  nodeId: string
  path: string
  componentId: number
  componentVersion?: number
  bindings: Record<string, unknown>
}

/** Collect every component placement in a (sub)tree. */
export function collectPlacements(nodes: CompositionNode[], basePath = 'nodes'): PlacementRef[] {
  const out: PlacementRef[] = []
  nodes.forEach((node, index) => {
    const path = `${basePath}[${index}]`
    if (!isCompositionNode(node)) return
    if (node.kind === 'component') {
      const attrs = node.attrs ?? {}
      out.push({
        nodeId: node.id,
        path,
        componentId: attrs.componentId,
        componentVersion: attrs.componentVersion,
        bindings: (attrs.bindings && typeof attrs.bindings === 'object' ? attrs.bindings : {}) as Record<string, unknown>,
      })
    }
    if (Array.isArray(node.children)) {
      out.push(...collectPlacements(node.children, `${path}.children`))
    }
  })
  return out
}

/** A binding counts as bound when the slot key exists with a non-empty value. */
export function isSlotBound(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.value === 'string') return record.value.trim().length > 0
    return record.value !== null && record.value !== undefined
  }
  return true
}

function validateLoopSource(attrs: Record<string, any>, path: string, errors: TreeIssue[]): void {
  const source = attrs.source
  if (!source || typeof source !== 'object') {
    errors.push({ path: `${path}.attrs.source`, message: 'Loop requires a source config { tableName, mode }' })
    return
  }
  if (!source.tableName || typeof source.tableName !== 'string' || !source.tableName.trim()) {
    errors.push({ path: `${path}.attrs.source.tableName`, message: 'Loop source tableName is required' })
  }
  if (!['all', 'selected', 'filtered'].includes(source.mode)) {
    errors.push({
      path: `${path}.attrs.source.mode`,
      message: 'Loop source mode must be one of all|selected|filtered',
    })
  }
  // BR-002: `selected` mode requires ≥1 rowId (existence checked server-side).
  if (source.mode === 'selected' && (!Array.isArray(source.rowIds) || source.rowIds.length === 0)) {
    errors.push({ path: `${path}.attrs.source.rowIds`, message: 'Loop mode "selected" requires at least one rowId' })
  }
  if (source.filter !== undefined) {
    if (!Array.isArray(source.filter)) {
      errors.push({ path: `${path}.attrs.source.filter`, message: 'Loop filter must be an array of { field, operator, value }' })
    } else {
      source.filter.forEach((rule: unknown, i: number) => {
        const r = (rule ?? {}) as Record<string, unknown>
        if (!r.field || typeof r.field !== 'string' || !(r.field as string).trim()) {
          errors.push({ path: `${path}.attrs.source.filter[${i}].field`, message: 'Filter rule field is required' })
        }
        if (!LOOP_FILTER_OPERATORS.includes(r.operator as (typeof LOOP_FILTER_OPERATORS)[number])) {
          errors.push({
            path: `${path}.attrs.source.filter[${i}].operator`,
            message: `Filter operator must be one of ${LOOP_FILTER_OPERATORS.join('|')}`,
          })
        }
      })
    }
  }
}

/**
 * Shape-level validation (no DB): node shapes, nesting ceiling, Task 09
 * syntax for condition/data-token expressions, loop config basics.
 * Legacy nodes (no `kind`) pass through untouched.
 */
export function validateNodeShapes(nodes: unknown): { errors: TreeIssue[]; warnings: TreeIssue[]; stats: TreeStats } {
  const errors: TreeIssue[] = []
  const warnings: TreeIssue[] = []
  const stats: TreeStats = { nodeCount: 0, placementCount: 0, loopCount: 0, conditionCount: 0, tokenCount: 0 }
  const seenIds = new Set<string>()

  if (!Array.isArray(nodes)) {
    return { errors: [{ path: 'nodes', message: 'Content must be a JSON document tree { nodes: [...] }' }], warnings, stats }
  }

  function walk(list: unknown, basePath: string, wrapperDepth: number): void {
    if (!Array.isArray(list)) return
    list.forEach((raw, index) => {
      const path = `${basePath}[${index}]`
      if (!raw || typeof raw !== 'object') {
        errors.push({ path, message: 'Node must be an object' })
        return
      }
      const record = raw as Record<string, unknown>
      // Legacy Task 14 nodes (no `kind`) are static passthrough content.
      if (record.kind === undefined) return
      stats.nodeCount += 1

      if (typeof record.id !== 'string' || !record.id.trim()) {
        errors.push({ path: `${path}.id`, message: 'Node id is required (client-generated key)' })
      } else if (seenIds.has(record.id)) {
        errors.push({ path: `${path}.id`, message: `Duplicate node id "${record.id}"` })
      } else {
        seenIds.add(record.id)
      }

      if (typeof record.kind !== 'string' || !(COMPOSITION_KINDS as readonly string[]).includes(record.kind)) {
        errors.push({ path: `${path}.kind`, message: `Node kind must be one of ${COMPOSITION_KINDS.join('|')}` })
        return
      }
      const kind = record.kind as CompositionKind
      const attrs = (record.attrs ?? {}) as Record<string, any>
      if (record.attrs !== undefined && (typeof record.attrs !== 'object' || record.attrs === null)) {
        errors.push({ path: `${path}.attrs`, message: 'Node attrs must be an object' })
      }

      const hasChildren = Array.isArray(record.children)
      if ((kind === 'loop' || kind === 'condition') && !hasChildren) {
        errors.push({ path: `${path}.children`, message: `${kind} block requires a children array` })
      }
      if (kind !== 'loop' && kind !== 'condition' && hasChildren) {
        errors.push({ path: `${path}.children`, message: `Node kind "${kind}" must not have children` })
      }

      const childWrapperDepth = kind === 'loop' || kind === 'condition' ? wrapperDepth + 1 : wrapperDepth
      if ((kind === 'loop' || kind === 'condition') && childWrapperDepth > MAX_WRAPPER_DEPTH) {
        errors.push({ path, message: `Max nesting depth exceeded (loop⊂condition≤${MAX_WRAPPER_DEPTH})` })
      }

      switch (kind) {
        case 'text':
          if (attrs.html === undefined && attrs.text === undefined) {
            warnings.push({ path: `${path}.attrs`, message: 'Empty text node carries no content' })
          }
          break
        case 'image':
          if (!attrs.src || typeof attrs.src !== 'string') {
            errors.push({ path: `${path}.attrs.src`, message: 'Image node requires a src' })
          } else if (!isSafeImageSrc(attrs.src)) {
            errors.push({ path: `${path}.attrs.src`, message: 'Image src uses a blocked URL scheme' })
          }
          break
        case 'table':
          if (attrs.headers !== undefined && !Array.isArray(attrs.headers)) {
            errors.push({ path: `${path}.attrs.headers`, message: 'Table headers must be an array of strings' })
          }
          if (attrs.rows !== undefined && !Array.isArray(attrs.rows)) {
            errors.push({ path: `${path}.attrs.rows`, message: 'Table rows must be an array of string arrays' })
          }
          break
        case 'component':
          stats.placementCount += 1
          if (typeof attrs.componentId !== 'number' || isNaN(attrs.componentId)) {
            errors.push({ path: `${path}.attrs.componentId`, message: 'Component placement requires a numeric componentId' })
          }
          if (attrs.componentVersion !== undefined && (typeof attrs.componentVersion !== 'number' || isNaN(attrs.componentVersion))) {
            errors.push({ path: `${path}.attrs.componentVersion`, message: 'Pinned componentVersion must be numeric' })
          }
          if (attrs.bindings !== undefined && (typeof attrs.bindings !== 'object' || attrs.bindings === null)) {
            errors.push({ path: `${path}.attrs.bindings`, message: 'Placement bindings must be an object' })
          }
          break
        case 'data-token': {
          stats.tokenCount += 1
          if (!attrs.expression || typeof attrs.expression !== 'string' || !attrs.expression.trim()) {
            errors.push({ path: `${path}.attrs.expression`, message: 'data-token requires an expression' })
            break
          }
          // BR-004: raw `{{...}}` validated by Task 09.
          const result = validateExpression(unwrapTokenExpression(attrs.expression))
          if (!result.valid) {
            errors.push({ path: `${path}.attrs.expression`, message: `Invalid data token: ${result.error}` })
          }
          break
        }
        case 'loop':
          stats.loopCount += 1
          validateLoopSource(attrs, path, errors)
          break
        case 'condition': {
          stats.conditionCount += 1
          if (!attrs.expression || typeof attrs.expression !== 'string' || !attrs.expression.trim()) {
            errors.push({ path: `${path}.attrs.expression`, message: 'Condition requires an expression' })
            break
          }
          // BR-003: must validate via Task 09; otherwise save is blocked.
          const result = validateExpression(unwrapTokenExpression(attrs.expression))
          if (!result.valid) {
            errors.push({ path: `${path}.attrs.expression`, message: `Invalid condition: ${result.error}` })
          } else if (!isBooleanShapedExpression(unwrapTokenExpression(attrs.expression))) {
            warnings.push({
              path: `${path}.attrs.expression`,
              message: 'Condition is not comparison-shaped; it will be truthiness-coerced at render time',
            })
          }
          break
        }
        case 'page-break':
          // Layout-only (BR-005): no data, nothing to validate.
          break
      }

      if (hasChildren) walk(record.children, `${path}.children`, childWrapperDepth)
    })
  }

  walk(nodes, 'nodes', 0)
  return { errors, warnings, stats }
}

/** Parse draft content (string or object) into a `{ nodes }` tree. */
export function parseTreeInput(content: unknown): { nodes: unknown; error?: string } {
  let parsed: unknown = content
  if (typeof content === 'string') {
    if (!content.trim()) return { nodes: [], error: 'Content is empty' }
    try {
      parsed = JSON.parse(content)
    } catch {
      return { nodes: null, error: 'Content must be valid JSON' }
    }
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { nodes?: unknown }).nodes)) {
    return { nodes: null, error: 'Content must be a JSON document tree { nodes: [...] }' }
  }
  return { nodes: (parsed as { nodes: unknown[] }).nodes }
}

/** True when the tree contains at least one composition node (Task 15 shape). */
export function hasCompositionNodes(nodes: unknown[]): boolean {
  const visit = (list: unknown[]): boolean => {
    for (const node of list) {
      if (isCompositionNode(node)) return true
      if (node && typeof node === 'object' && Array.isArray((node as { children?: unknown }).children)) {
        if (visit((node as { children: unknown[] }).children)) return true
      }
    }
    return false
  }
  return visit(nodes)
}
