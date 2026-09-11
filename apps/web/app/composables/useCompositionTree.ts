/**
 * Pure client-side tree operations for the Composition Editor .
 * Framework-free so they are unit-testable in the `unit` vitest project;
 * Vue components call these and hold the resulting arrays in refs.
 */

import type { CompositionKind, CompositionNode } from '../../shared/types/template'
import { validate as validateExpression, parse as parseExpression } from '../../server/utils/expressions'

export const LOOP_FILTER_OPERATORS = ['==', '!=', '>', '<', '>=', '<=', 'contains'] as const

/** Strip `{{` / `}}` delimiters so Task 09 validates the inner expression. */
export function unwrapTokenExpression(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
    return trimmed.slice(2, -2).trim()
  }
  return trimmed
}

/** Validate a token/condition expression client-side (Task 09 subset). */
export function validateTreeExpression(raw: string): { valid: boolean; error?: string } {
  const result = validateExpression(unwrapTokenExpression(raw))
  return result.valid ? { valid: true } : { valid: false, error: result.error }
}

/** Heuristic "boolean-coercible" check (BR-003) — mirrors the server rule. */
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

export function newNodeId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch { /* fallback below */ }
  return `n-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffffff).toString(36)}`
}

export function createNode(
  kind: CompositionKind,
  attrs: Record<string, any> = {},
  children?: CompositionNode[],
): CompositionNode {
  const node: CompositionNode = { id: newNodeId(), kind, attrs }
  if (kind === 'loop' || kind === 'condition') node.children = children ?? []
  return node
}

export function defaultAttrsFor(kind: CompositionKind): Record<string, any> {
  switch (kind) {
    case 'text': return { html: '<p>New paragraph — click to edit</p>' }
    case 'image': return { src: '', alt: '' }
    case 'table': return { caption: '', headers: ['Column 1', 'Column 2'], rows: [['', '']] }
    case 'component': return { componentId: 0, bindings: {} }
    case 'data-token': return { expression: '{{data.field}}' }
    case 'loop': return { source: { tableName: '', mode: 'all', rowIds: [], filter: [] } }
    case 'condition': return { expression: 'data.status == "aktif"' }
    case 'page-break': return {}
  }
}

/** Parse draft content into a node array; null when not a `{ nodes }` tree. */
export function parseTree(content: string | null | undefined): CompositionNode[] | null {
  if (!content || !content.trim()) return []
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { nodes?: unknown }).nodes)) {
      return (parsed as { nodes: CompositionNode[] }).nodes
    }
    return null
  } catch {
    return null
  }
}

export function serializeTree(nodes: CompositionNode[]): string {
  return JSON.stringify({ nodes }, null, 2)
}

/** True when at least one node carries a composition `kind` . */
export function isCompositionTreeContent(nodes: unknown[]): boolean {
  const visit = (list: unknown[]): boolean => {
    for (const node of list) {
      if (node && typeof node === 'object' && typeof (node as { kind?: unknown }).kind === 'string') return true
      const children = (node as { children?: unknown }).children
      if (Array.isArray(children) && visit(children)) return true
    }
    return false
  }
  return visit(nodes)
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * One-way upgrade of legacy skeleton nodes (`{ type, text, html,
 * componentId }`) into composition nodes so old drafts restore on the
 * canvas 1:1 (REQ-005).
 */
export function legacyToComposition(legacy: unknown[]): CompositionNode[] {
  return legacy.map((raw) => {
    if (raw && typeof raw === 'object' && typeof (raw as { kind?: unknown }).kind === 'string') {
      const node = raw as CompositionNode
      return { ...node, id: typeof node.id === 'string' && node.id ? node.id : newNodeId() }
    }
    const record = (raw ?? {}) as Record<string, unknown>
    if (typeof record.componentId === 'number') {
      return createNode('component', { componentId: record.componentId, bindings: {} })
    }
    const text = typeof record.text === 'string' ? record.text : typeof record.html === 'string' ? record.html : ''
    return createNode('text', { html: text.includes('<') ? text : `<p>${escapeHtml(text)}</p>` })
  })
}

// --- Immutable top-level list ops -------------------------------------------

export function insertNodeAt(nodes: CompositionNode[], index: number, node: CompositionNode): CompositionNode[] {
  const next = [...nodes]
  next.splice(Math.max(0, Math.min(index, next.length)), 0, node)
  return next
}

export function moveNode(nodes: CompositionNode[], index: number, dir: -1 | 1): CompositionNode[] {
  const target = index + dir
  if (index < 0 || index >= nodes.length || target < 0 || target >= nodes.length) return nodes
  const next = [...nodes]
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  return next
}

export function removeNodeAt(nodes: CompositionNode[], index: number): CompositionNode[] {
  return nodes.filter((_, i) => i !== index)
}

/** Wrap a top-level node in a fresh loop/condition container. */
export function wrapIn(nodes: CompositionNode[], index: number, kind: 'loop' | 'condition'): CompositionNode[] {
  if (index < 0 || index >= nodes.length) return nodes
  const wrapper = createNode(kind, defaultAttrsFor(kind), [nodes[index]])
  const next = [...nodes]
  next.splice(index, 1, wrapper)
  return next
}

/** Replace a top-level loop/condition with its own children (unwrap). */
export function unwrapAt(nodes: CompositionNode[], index: number): CompositionNode[] {
  const target = nodes[index]
  if (!target || (target.kind !== 'loop' && target.kind !== 'condition')) return nodes
  const next = [...nodes]
  next.splice(index, 1, ...(target.children ?? []))
  return next
}

// --- Deep ops (immutable) ----------------------------------------------------

export interface FoundNode {
  node: CompositionNode
  ancestors: CompositionNode[]
}

export function findNode(nodes: CompositionNode[], id: string, ancestors: CompositionNode[] = []): FoundNode | null {
  for (const node of nodes) {
    if (node.id === id) return { node, ancestors }
    if (Array.isArray(node.children)) {
      const found = findNode(node.children, id, [...ancestors, node])
      if (found) return found
    }
  }
  return null
}

function mapDeep(nodes: CompositionNode[], fn: (node: CompositionNode) => CompositionNode): CompositionNode[] {
  return nodes.map((node) => {
    const mapped = fn(node)
    if (Array.isArray(mapped.children)) {
      return { ...mapped, children: mapDeep(mapped.children, fn) }
    }
    return mapped
  })
}

/** Patch `attrs` of the node with `id` (deep, immutable). */
export function updateNodeAttrs(
  nodes: CompositionNode[],
  id: string,
  patch: Record<string, any>,
): CompositionNode[] {
  return mapDeep(nodes, (node) => (node.id === id ? { ...node, attrs: { ...(node.attrs ?? {}), ...patch } } : node))
}

/** Remove the node with `id` wherever it sits (deep, immutable). */
export function removeNodeById(nodes: CompositionNode[], id: string): CompositionNode[] {
  const out: CompositionNode[] = []
  for (const node of nodes) {
    if (node.id === id) continue
    out.push(Array.isArray(node.children) ? { ...node, children: removeNodeById(node.children, id) } : node)
  }
  return out
}

/** Append a child into a loop/condition container (deep, immutable). */
export function appendChildNode(nodes: CompositionNode[], containerId: string, child: CompositionNode): CompositionNode[] {
  return mapDeep(nodes, (node) => {
    if (node.id !== containerId || (node.kind !== 'loop' && node.kind !== 'condition')) return node
    return { ...node, children: [...(node.children ?? []), child] }
  })
}

// --- Sanitization (client mirror of the server allowlist-lite rules) --------

const DANGEROUS_BLOCK_TAGS = ['script', 'iframe', 'style', 'object', 'embed', 'link', 'meta', 'base', 'form']

export function sanitizePastedHtml(html: string): string {
  if (!html) return html
  let out = html
  for (const tag of DANGEROUS_BLOCK_TAGS) {
    out = out.replace(new RegExp(`<${tag}[\\s>][\\s\\S]*?<\\/${tag}\\s*>`, 'gi'), '')
    out = out.replace(new RegExp(`<${tag}(\\s[^>]*)?\\/?>`, 'gi'), '')
  }
  out = out.replace(/<!--[\s\S]*?-->/g, '')
  out = out.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  out = out.replace(/\s+(href|src|xlink:href)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi, (m, _attr, _q, d, s, u) => {
    const value = (d ?? s ?? u ?? '').trim().toLowerCase()
    if (value.startsWith('javascript:') || value.startsWith('data:text/html')) return ''
    return m
  })
  return out
}

// --- Structural preview ------------------------------------------------------

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

/** One-line summary of a node for the structural preview (REQ-005/AC-002). */
export function summarizeCompositionNode(node: CompositionNode, componentNames: Record<number, string> = {}): string {
  const attrs = node.attrs ?? {}
  switch (node.kind) {
    case 'text': {
      const raw = typeof attrs.html === 'string' ? stripTags(attrs.html) : typeof attrs.text === 'string' ? attrs.text : ''
      return raw ? `Text: ${raw.slice(0, 80)}` : 'Text (empty)'
    }
    case 'image': return `Image: ${attrs.src || '(no source)'}`
    case 'table': {
      const cols = Array.isArray(attrs.headers) ? attrs.headers.length : 0
      const rows = Array.isArray(attrs.rows) ? attrs.rows.length : 0
      return `Table: ${cols} col × ${rows} row`
    }
    case 'component': {
      const name = componentNames[attrs.componentId] ?? `#${attrs.componentId ?? '?'}`
      const bindings = attrs.bindings && typeof attrs.bindings === 'object' ? Object.keys(attrs.bindings).length : 0
      return `Component: ${name}${attrs.componentVersion ? ` v${attrs.componentVersion}` : ''} (${bindings} bound)`
    }
    case 'data-token': return `Token: ${attrs.expression || '(empty)'}`
    case 'loop': {
      const s = attrs.source ?? {}
      const base = `Loop: ${s.tableName || '(no table)'} · ${s.mode || 'all'}`
      const extra = s.mode === 'selected' && Array.isArray(s.rowIds) ? ` · ${s.rowIds.length} row(s)` : ''
      return `${base}${extra} · ${(node.children ?? []).length} child(ren)`
    }
    case 'condition': return `Condition: ${attrs.expression || '(empty)'} · ${(node.children ?? []).length} child(ren)`
    case 'page-break': return '— Page break —'
  }
}

/** Indented structural preview lines for the whole tree. */
export function structuralPreviewLines(
  nodes: CompositionNode[],
  componentNames: Record<number, string> = {},
  depth = 0,
): string[] {
  const lines: string[] = []
  for (const node of nodes) {
    lines.push(`${'  '.repeat(depth)}• ${summarizeCompositionNode(node, componentNames)}`)
    if (Array.isArray(node.children)) {
      lines.push(...structuralPreviewLines(node.children, componentNames, depth + 1))
    }
  }
  return lines
}
