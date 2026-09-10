/**
 * Generic resolve pipeline (Task 20).
 *
 * Stage order (REQ-001, exact wiki order):
 *   Data → Component → Binding → Loop → Condition → HTML DOM
 *
 * Pure + deterministic: renders ONLY the passed-in context/snapshots
 * (BR-001 — no live-table access), never calls `new Date()`, emits no
 * random ids. Missing data → empty string + warning (BR-002, never
 * throws); unknown node kinds → warning + skip (never throws); condition
 * errors → exclude + warning (REQ-003, never crashes the render).
 *
 * Node handlers: text, richtext, image, table, component
 * (single + collection), data-token, expression, loop, condition,
 * page-break (plus legacy passthrough for pre-Task-15 nodes).
 */

import { evaluate } from '../expressions'
import { isItemScopedRef, itemFieldOf, slotKeyOf } from '../binding-refs'
import { isCompositionNode, unwrapTokenExpression } from '../composition-tree'
// Canonical composition + warning types (Task 24 single source of truth).
import { COMPOSITION_KINDS, type CompositionNode } from '../../../shared/types/template'
import type { RenderWarning } from '../../../shared/types/render'
import { buildEvalContext, getPath, isPresent } from './context'
import { isAllowedImageSrc, missingImageBox, sanitizeOutputHtml } from './sanitizer'
import { wrapDocument } from './print-css'
import {
  DEFAULT_MAX_LOOP_ITEMS,
  type BindingLike,
  type ComponentSnapshotLike,
  type RenderContext,
  type RenderOptions,
  type RenderResult,
  type RenderTimings,
} from './types'

export class RenderTimeoutError extends Error {
  readonly code = 'TIMEOUT'
  constructor(message = 'Render timed out') {
    super(message)
  }
}

const INLINE_TOKEN_PATTERN = /\{\{([\s\S]+?)\}\}/g

/**
 * Task-scope kind aliases: `richtext` ≡ `text` (HTML-carrying copy) and
 * `expression` ≡ `data-token` (Task 09 evaluation). The Task 15
 * `COMPOSITION_KINDS` registry is the canonical set; aliases are resolved
 * here so the dispatch below stays exhaustive.
 */
const KIND_ALIASES: Record<string, 'text' | 'data-token'> = {
  richtext: 'text',
  expression: 'data-token',
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface Scope {
  item?: unknown
  index?: number
  items?: unknown[]
}

interface PipelineState {
  context: RenderContext
  snapshots: Map<number, ComponentSnapshotLike>
  slotValues: Map<string, unknown>
  itemSlotBindings: BindingLike[]
  maxLoopItems: number
  deadline: number
  warnings: RenderWarning[]
  warnedSlots: Set<string>
  timings: { loop: number; condition: number; html: number; component: number }
  checkTimeout: () => void
}

function warn(state: PipelineState, code: RenderWarning['code'], message: string, nodeId?: string | null): void {
  state.warnings.push({ code, nodeId: nodeId ?? null, message })
}

function warnOnce(state: PipelineState, key: string, code: RenderWarning['code'], message: string, nodeId?: string | null): void {
  if (state.warnedSlots.has(key)) return
  state.warnedSlots.add(key)
  warn(state, code, message, nodeId)
}

/** Evaluate one expression against the context → printable string. */
function evaluateToString(
  state: PipelineState,
  rawExpression: string,
  scopeContext: RenderContext,
  nodeId?: string | null,
): string {
  const expression = unwrapTokenExpression(rawExpression)
  if (!expression) {
    warn(state, 'EXPR_ERROR', 'Empty expression renders as empty string', nodeId)
    return ''
  }
  let result: { value: unknown; error?: string }
  try {
    result = evaluate(expression, scopeContext)
  } catch (e: any) {
    warn(state, 'EXPR_ERROR', `Expression failed: ${e?.message ?? 'unknown error'}`, nodeId)
    return ''
  }
  if (result.error) {
    if (result.error.startsWith('UNKNOWN_REF:')) {
      warn(state, 'MISSING_DATA', `Missing data for "${expression}"`, nodeId)
    } else {
      warn(state, 'EXPR_ERROR', `Expression "${expression}" failed: ${result.error}`, nodeId)
    }
    return ''
  }
  if (!isPresent(result.value)) {
    warn(state, 'MISSING_DATA', `Missing data for "${expression}"`, nodeId)
    return ''
  }
  return String(result.value)
}

/** Replace every `{{...}}` token inside a string field. */
function interpolateInline(state: PipelineState, raw: string, scopeContext: RenderContext, nodeId?: string | null): string {
  if (!raw || !raw.includes('{{')) return raw
  return raw.replace(INLINE_TOKEN_PATTERN, (_match, inner: string) => {
    const value = evaluateToString(state, inner, scopeContext, nodeId)
    // Inline tokens inside HTML-carrying fields stay raw here; the final
    // output pass sanitizes the assembled document (AC-006).
    return value
  })
}

/** Resolve one persisted binding against the context (+ optional item scope). */
function resolveBindingValue(
  binding: BindingLike,
  evalContext: RenderContext,
  itemScope: unknown,
  systemDefaults: RenderContext,
): unknown {
  const ref = (binding.sourceRef ?? '').trim()
  // Loop-item refs resolve against the current collection row (REQ-002).
  if (isItemScopedRef(ref)) {
    if (itemScope === undefined || itemScope === null) return undefined
    const field = itemFieldOf(ref)
    if (field === null) return itemScope
    return getPath(itemScope, field)
  }
  switch (binding.source) {
    case 'manual':
      return binding.literalValue ?? undefined
    case 'expression': {
      if (!binding.expression) return undefined
      const result = evaluate(unwrapTokenExpression(binding.expression), { ...evalContext, item: itemScope ?? evalContext.item })
      return result.error ? undefined : result.value
    }
    case 'system': {
      if (ref === 'current_date') return systemDefaults.current_date
      if (ref === 'user.name') return systemDefaults['user.name']
      if (ref === 'user.username') return systemDefaults['user.username']
      return getPath(evalContext.system, ref) ?? getPath(evalContext, ref)
    }
    case 'global_table': {
      // `table.column` → frozen data namespace; bare `table` → whole rows.
      return getPath(evalContext.data, ref)
    }
    case 'administration':
    default: {
      const direct = getPath(evalContext, ref)
      if (direct !== undefined) return direct
      return getPath(evalContext.data, ref)
    }
  }
}

/** Pre-resolve every non-item binding once (Binding stage). */
function resolveTopLevelBindings(
  state: PipelineState,
  bindings: BindingLike[],
  evalContext: RenderContext,
  systemDefaults: RenderContext,
): void {
  for (const binding of bindings) {
    const ref = (binding.sourceRef ?? '').trim()
    if (isItemScopedRef(ref)) {
      state.itemSlotBindings.push(binding)
      continue
    }
    const value = resolveBindingValue(binding, evalContext, null, systemDefaults)
    if (value === undefined || (binding.source === 'expression' && value === null)) {
      // Expression failures surface per-slot at render time; keep silent
      // here so a single bad binding cannot spam the preview. Missing
      // refs warn at render time (BR-002).
      continue
    }
    state.slotValues.set(slotKeyOf(binding.placementId, binding.requirementName), value)
  }
}

/** Slot value for one component requirement (Binding stage, per item). */
function slotValueFor(
  state: PipelineState,
  placementId: string,
  requirementName: string,
  inlineBindings: Record<string, unknown>,
  evalContext: RenderContext,
  itemScope: unknown,
  systemDefaults: RenderContext,
  nodeId?: string | null,
): unknown {
  const key = slotKeyOf(placementId, requirementName)
  if (state.slotValues.has(key)) return state.slotValues.get(key)
  // Item-scoped bindings resolve per collection row (REQ-002).
  for (const binding of state.itemSlotBindings) {
    if (slotKeyOf(binding.placementId, binding.requirementName) !== key) continue
    const value = resolveBindingValue(binding, evalContext, itemScope, systemDefaults)
    if (value !== undefined && value !== null && !(typeof value === 'string' && !value.trim())) return value
  }
  // Inline tree bindings (Task 15 `attrs.bindings`) — string or { value }.
  const inline = inlineBindings[requirementName]
  if (typeof inline === 'string' && inline.trim()) {
    if (inline.includes('{{')) {
      const scopeContext = itemScope !== undefined ? { ...evalContext, item: itemScope } : evalContext
      return interpolateInline(state, inline, scopeContext, nodeId)
    }
    return inline
  }
  if (inline && typeof inline === 'object' && (inline as Record<string, unknown>).value !== undefined) {
    return (inline as Record<string, unknown>).value
  }
  warnOnce(state, `slot:${key}`, 'MISSING_DATA', `Missing value for "${requirementName}" on placement "${placementId}"`, nodeId)
  return ''
}

/** Substitute `{{name}}` placeholders in frozen component content. */
function renderComponentContent(
  state: PipelineState,
  snapshot: ComponentSnapshotLike,
  placementId: string,
  inlineBindings: Record<string, unknown>,
  evalContext: RenderContext,
  itemScope: unknown,
  systemDefaults: RenderContext,
  nodeId?: string | null,
): string {
  const content = snapshot.content ?? ''
  const requirements = snapshot.requirements ?? []
  return content.replace(/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g, (_match, name: string) => {
    const type = requirements.find((r) => r.name === name)?.type ?? 'text'
    const value = slotValueFor(state, placementId, name, inlineBindings, evalContext, itemScope, systemDefaults, nodeId)
    if (value === null || value === undefined || (typeof value === 'string' && !value)) return ''
    if (type === 'richtext') return String(value)
    if (type === 'image') {
      const src = String(value)
      if (!isAllowedImageSrc(src)) {
        warnOnce(state, `img:${placementId}:${name}`, 'IMAGE_MISSING', `Blocked or missing image for "${name}"`, nodeId)
        return missingImageBox(name)
      }
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(name)}" />`
    }
    return escapeHtml(value)
  })
}

function applyLoopFilter(rows: Record<string, any>[], filter: Array<{ field: string; operator: string; value?: unknown }>): Record<string, any>[] {
  return rows.filter((row) => {
    return (filter ?? []).every((rule) => {
      const actual = getPath(row, rule.field)
      switch (rule.operator) {
        case '==': return actual == rule.value
        case '!=': return actual != rule.value
        case '>': return typeof actual === 'number' && typeof rule.value === 'number' && actual > rule.value
        case '<': return typeof actual === 'number' && typeof rule.value === 'number' && actual < rule.value
        case '>=': return typeof actual === 'number' && typeof rule.value === 'number' && actual >= rule.value
        case '<=': return typeof actual === 'number' && typeof rule.value === 'number' && actual <= rule.value
        case 'contains': return Array.isArray(actual) ? actual.includes(rule.value) : String(actual ?? '').includes(String(rule.value ?? ''))
        default: return true
      }
    })
  })
}

/** Loop stage: resolve the bound collection (pure — context only). */
function resolveLoopCollection(
  state: PipelineState,
  attrs: Record<string, any>,
  evalContext: RenderContext,
  nodeId?: string | null,
): unknown[] {
  if (Array.isArray(attrs.items)) return attrs.items
  if (Array.isArray(attrs.collection)) return attrs.collection
  const source = attrs.source
  if (typeof source === 'string' && source.trim()) {
    const resolved = getPath(evalContext, source.trim()) ?? getPath(evalContext.data, source.trim())
    if (resolved === undefined) {
      warn(state, 'MISSING_DATA', `Loop source "${source}" has no data`, nodeId)
      return []
    }
    return Array.isArray(resolved) ? resolved : [resolved]
  }
  if (source && typeof source === 'object') {
    const tableName = typeof source.tableName === 'string' ? source.tableName.trim() : ''
    let base: unknown = tableName ? getPath(evalContext.data, tableName) : undefined
    if (base === undefined && tableName) base = getPath(evalContext, tableName)
    if (base === undefined) {
      warn(state, 'MISSING_DATA', `Loop source table "${tableName || '(none)'}" has no data`, nodeId)
      return []
    }
    let rows: Record<string, any>[] = Array.isArray(base) ? (base as Record<string, any>[]) : [base as Record<string, any>]
    if (source.mode === 'selected' && Array.isArray(source.rowIds)) {
      const wanted = new Set(source.rowIds.map(Number))
      rows = rows.filter((r) => wanted.has(Number((r as Record<string, any>)?.id)))
    } else if (source.mode === 'filtered' && Array.isArray(source.filter)) {
      rows = applyLoopFilter(rows, source.filter)
    }
    return rows
  }
  warn(state, 'MISSING_DATA', 'Loop block has no resolvable collection source', nodeId)
  return []
}

function renderNodes(state: PipelineState, nodes: unknown, scope: Scope): string {
  state.checkTimeout()
  if (!Array.isArray(nodes)) return ''
  return nodes.map((node) => renderNode(state, node, scope)).join('')
}

function renderNode(state: PipelineState, raw: unknown, scope: Scope): string {
  state.checkTimeout()
  // Unknown string kinds warn + skip (Validation) — never throw. Aliases
  // (`richtext`, `expression`) resolve to their canonical handler first.
  if (raw && typeof raw === 'object' && typeof (raw as Record<string, unknown>).kind === 'string') {
    const kind = (raw as Record<string, unknown>).kind as string
    if (!(COMPOSITION_KINDS as readonly string[]).includes(kind) && !KIND_ALIASES[kind]) {
      warn(state, 'UNKNOWN_NODE', `Unknown node kind "${kind}" skipped`, typeof (raw as Record<string, unknown>).id === 'string' ? ((raw as Record<string, unknown>).id as string) : null)
      return ''
    }
  }
  // Legacy Task 14 nodes (no `kind`): interpolate known string fields.
  const normalized: unknown =
    raw && typeof raw === 'object' && typeof (raw as Record<string, unknown>).kind === 'string' &&
    KIND_ALIASES[(raw as Record<string, unknown>).kind as string]
      ? { ...(raw as Record<string, unknown>), kind: KIND_ALIASES[(raw as Record<string, unknown>).kind as string] }
      : raw
  if (!isCompositionNode(normalized as never)) {
    if (normalized && typeof normalized === 'object') {
      const record = normalized as Record<string, unknown>
      const scopeContext = scope.item !== undefined ? { ...state.context, item: scope.item, index: scope.index } : state.context
      for (const field of ['html', 'text', 'content']) {
        if (typeof record[field] === 'string' && (record[field] as string).includes('{{')) {
          const t0 = Date.now()
          const out = interpolateInline(state, record[field] as string, scopeContext, null)
          state.timings.html += Date.now() - t0
          return out
        }
      }
      if (typeof record.html === 'string') return record.html
      if (typeof record.text === 'string') return escapeHtml(record.text)
      if (typeof record.content === 'string') return record.content
    }
    return ''
  }

  const node = normalized as CompositionNode
  const effectiveKind = node.kind
  const attrs = (node.attrs ?? {}) as Record<string, any>
  const scopeContext: RenderContext =
    scope.item !== undefined ? { ...state.context, item: scope.item, index: scope.index } : state.context

  switch (effectiveKind) {
    case 'text': {
      const t0 = Date.now()
      const rawHtml = typeof attrs.html === 'string' ? attrs.html : typeof attrs.text === 'string' ? escapeHtml(attrs.text) : ''
      const out = interpolateInline(state, rawHtml, scopeContext, node.id)
      state.timings.html += Date.now() - t0
      return out
    }
    case 'image': {
      const t0 = Date.now()
      const rawSrc = typeof attrs.src === 'string' ? interpolateInline(state, attrs.src, scopeContext, node.id) : ''
      const alt = typeof attrs.alt === 'string' ? attrs.alt : node.id
      let out: string
      if (!rawSrc.trim() || !isAllowedImageSrc(rawSrc)) {
        warn(state, 'IMAGE_MISSING', `Image "${node.id}" has no resolvable source`, node.id)
        out = missingImageBox(alt)
      } else {
        const width = typeof attrs.width === 'string' || typeof attrs.width === 'number' ? ` width="${escapeHtml(attrs.width)}"` : ''
        out = `<img src="${escapeHtml(rawSrc)}" alt="${escapeHtml(alt)}"${width} />`
      }
      state.timings.html += Date.now() - t0
      return out
    }
    case 'table': {
      const t0 = Date.now()
      const headers: unknown[] = Array.isArray(attrs.headers) ? attrs.headers : []
      const rows: unknown[] = Array.isArray(attrs.rows) ? attrs.rows : []
      const head = headers.length
        ? `<thead><tr>${headers.map((h) => `<th>${interpolateInline(state, String(h ?? ''), scopeContext, node.id)}</th>`).join('')}</tr></thead>`
        : ''
      const body = `<tbody>${rows.map((row) => `<tr>${(Array.isArray(row) ? row : [row]).map((cell) => `<td>${interpolateInline(state, String(cell ?? ''), scopeContext, node.id)}</td>`).join('')}</tr>`).join('')}</tbody>`
      state.timings.html += Date.now() - t0
      return `<table>${head}${body}</table>`
    }
    case 'data-token': {
      const t0 = Date.now()
      const value = evaluateToString(state, String(attrs.expression ?? ''), scopeContext, node.id)
      state.timings.html += Date.now() - t0
      return escapeHtml(value)
    }
    case 'condition': {
      const t0 = Date.now()
      const expression = unwrapTokenExpression(String(attrs.expression ?? ''))
      let include = false
      try {
        const result = evaluate(expression, scopeContext)
        if (result.error) {
          // REQ-003: evaluation errors exclude the subtree + warn, never crash.
          if (result.error.startsWith('UNKNOWN_REF:')) {
            warn(state, 'MISSING_DATA', `Condition "${node.id}" references missing data — subtree excluded`, node.id)
          } else {
            warn(state, 'EXPR_ERROR', `Condition "${node.id}" failed (${result.error}) — subtree excluded`, node.id)
          }
          include = false
        } else {
          include = !!result.value
        }
      } catch (e: any) {
        warn(state, 'EXPR_ERROR', `Condition "${node.id}" failed (${e?.message ?? 'unknown error'}) — subtree excluded`, node.id)
        include = false
      }
      state.timings.condition += Date.now() - t0
      if (!include) return ''
      return renderNodes(state, node.children ?? [], scope)
    }
    case 'loop': {
      const t0 = Date.now()
      const collection = resolveLoopCollection(state, attrs, scopeContext, node.id)
      state.timings.loop += Date.now() - t0
      if (collection.length > state.maxLoopItems) {
        warn(
          state,
          'LOOP_TRUNCATED',
          `Loop "${node.id}" truncated to ${state.maxLoopItems} of ${collection.length} items (BR-003 cap)`,
          node.id,
        )
      }
      const rows = collection.slice(0, state.maxLoopItems)
      const blocks = rows.map((item, index) => renderNodes(state, node.children ?? [], { item, index, items: rows }))
      const truncated = collection.length > state.maxLoopItems
        ? `<div class="loop-truncation">… ${collection.length - state.maxLoopItems} more item(s) truncated at ${state.maxLoopItems} (loop cap).</div>`
        : ''
      return blocks.join('') + truncated
    }
    case 'component': {
      const t0 = Date.now()
      const componentId = attrs.componentId
      const snapshot = typeof componentId === 'number' ? state.snapshots.get(componentId) : undefined
      if (!snapshot) {
        warn(state, 'MISSING_DATA', `Component #${String(componentId)} snapshot unavailable on placement "${node.id}"`, node.id)
        state.timings.component += Date.now() - t0
        return ''
      }
      const inlineBindings =
        attrs.bindings && typeof attrs.bindings === 'object' ? (attrs.bindings as Record<string, unknown>) : {}
      let out: string
      if (snapshot.looping && scope.item === undefined) {
        // Standalone collection component (REQ-002): one block per item.
        const collection = resolveLoopCollection(
          state,
          { source: attrs.collectionSource ?? attrs.source, items: attrs.items, collection: attrs.collection },
          scopeContext,
          node.id,
        )
        const rows = collection.slice(0, state.maxLoopItems)
        if (collection.length > state.maxLoopItems) {
          warn(state, 'LOOP_TRUNCATED', `Collection component "${node.id}" truncated to ${state.maxLoopItems} of ${collection.length} items`, node.id)
        }
        out = rows
          .map((item, index) => {
            const itemContext = { ...scopeContext, item, index }
            return renderComponentContent(state, snapshot, node.id, inlineBindings, itemContext, item, state.context.system ?? {}, node.id)
          })
          .join('')
        if (collection.length > state.maxLoopItems) {
          out += `<div class="loop-truncation">… ${collection.length - state.maxLoopItems} more item(s) truncated at ${state.maxLoopItems} (loop cap).</div>`
        }
        if (rows.length === 0) {
          warn(state, 'MISSING_DATA', `Collection component "${node.id}" has no items to render`, node.id)
        }
      } else {
        out = renderComponentContent(state, snapshot, node.id, inlineBindings, scopeContext, scope.item, state.context.system ?? {}, node.id)
      }
      state.timings.component += Date.now() - t0
      return out
    }
    case 'page-break': {
      return '<div class="page-break"></div>'
    }
    default: {
      // Engine-level exhaustiveness (Validation): unknown kinds warn + skip.
      warn(state, 'UNKNOWN_NODE', `Unknown node kind "${(node as { kind: string }).kind}" skipped`, (node as CompositionNode).id ?? null)
      return ''
    }
  }
}

/**
 * Execute the resolve pipeline over a template tree.
 *
 * `nodes` may be the `{ nodes: [...] }` array, a `{ nodes }` document, or
 * a JSON string of either (mirrors `parseTreeInput` leniency).
 */
export function render(
  tree: unknown,
  context: RenderContext,
  options: RenderOptions = {},
): RenderResult {
  const totalStart = Date.now()
  const dataStart = Date.now()
  const evalContext = buildEvalContext(context ?? {})
  const systemDefaults: RenderContext = {
    current_date: new Date().toISOString().split('T')[0],
    ...(evalContext.system ?? {}),
  }
  evalContext.system = systemDefaults
  const dataMs = Date.now() - dataStart

  let nodes: unknown = tree
  if (typeof tree === 'string') {
    try {
      const parsed: unknown = JSON.parse(tree)
      nodes = (parsed as { nodes?: unknown }).nodes ?? parsed
    } catch {
      nodes = []
    }
  } else if (nodes && typeof nodes === 'object' && !Array.isArray(nodes) && Array.isArray((nodes as { nodes?: unknown }).nodes)) {
    nodes = (nodes as { nodes: unknown }).nodes
  }

  const maxLoopItems = options.maxLoopItems ?? DEFAULT_MAX_LOOP_ITEMS
  const timeoutMs = options.timeoutMs ?? 10_000
  const deadline = Date.now() + timeoutMs

  const state: PipelineState = {
    context: evalContext,
    snapshots: new Map((options.componentSnapshots ?? []).map((s) => [s.componentId, s])),
    slotValues: new Map(),
    itemSlotBindings: [],
    maxLoopItems,
    deadline,
    warnings: [],
    warnedSlots: new Set(),
    timings: { loop: 0, condition: 0, html: 0, component: 0 },
    checkTimeout: () => {
      if (Date.now() > deadline) throw new RenderTimeoutError()
    },
  }

  const bindingStart = Date.now()
  resolveTopLevelBindings(state, options.bindings ?? [], evalContext, systemDefaults)
  const bindingMs = Date.now() - bindingStart
  const componentMs = 0 // snapshot map built above (O(n), measured inside render loop)

  const body = renderNodes(state, nodes, {})
  const sanitized = sanitizeOutputHtml(body)
  const html = wrapDocument('Document', sanitized)

  const total = Date.now() - totalStart
  const timings: RenderTimings = {
    data: dataMs,
    component: state.timings.component + componentMs,
    binding: bindingMs,
    loop: state.timings.loop,
    condition: state.timings.condition,
    html: state.timings.html,
    total,
  }
  return { html, warnings: state.warnings, timings }
}
