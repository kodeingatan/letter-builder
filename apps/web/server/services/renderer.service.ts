import sanitizeHtml from 'sanitize-html'
import { ExpressionService } from './expression.service'
import type {
  ConditionOperator,
  DocNode,
  RenderResult,
} from '../../shared/types/document'

/**
 * Document renderer (Task 05) — pure function, never mutates the input tree.
 *
 * - Recursive render + nested repeater (`source`/`item`, e.g. `employees` → `item.trips`)
 * - Condition (`field`/`operator`/`value`) + `elseChildren`
 * - `component-ref` (`componentId`, `propsOverride`) resolved 1 level + cycle detection
 * - HTML escaping for every binding; richtext sanitized via `sanitize-html`
 * - Image URL allowlist: `https://`, `/api/storage/`, `data:image/` (DR-003)
 * - Caps: static tree ≤ 200 nodes enforced at validation (BR-001, DTO);
 *   runtime expansion guard 10000 nodes + 500 items per repeater level + warning (EC-02)
 * - Always returns a full `<div class="doc-page">…</div>` string (INV-001)
 */

export const MAX_RENDER_NODES = 10000
export const MAX_REPEATER_ITEMS = 500
export const MAX_RENDER_DEPTH = 10

export interface RendererOptions {
  /** Component registry for `component-ref` (owned by Task 07; inline map here). */
  components?: Record<string, DocNode>
}

interface RenderState {
  warnings: string[]
  nodeCount: number
  /** componentId stack for cycle detection (DR-002). */
  resolving: string[]
}

const RICH_TEXT_ALLOWED = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'span', 'div'],
  allowedAttributes: {},
} as const

export const RendererService = {
  render(tree: DocNode, data: Record<string, unknown> = {}, options: RendererOptions = {}): RenderResult {
    const state: RenderState = { warnings: [], nodeCount: 0, resolving: [] }
    const body = renderNode(tree, data, {}, 0, state, options)
    return { html: `<div class="doc-page">${body}</div>`, warnings: state.warnings }
  },
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [...RICH_TEXT_ALLOWED.allowedTags],
    allowedAttributes: {},
  })
}

function isAllowedImageUrl(url: string): boolean {
  return url.startsWith('https://') || url.startsWith('/api/storage/') || url.startsWith('data:image/')
}

function renderChildren(
  children: DocNode[] | undefined,
  data: Record<string, unknown>,
  scope: Record<string, unknown>,
  depth: number,
  state: RenderState,
  options: RendererOptions,
): string {
  if (!children || children.length === 0) return ''
  return children.map((child) => renderNode(child, data, scope, depth, state, options)).join('')
}

function renderNode(
  node: DocNode,
  data: Record<string, unknown>,
  scope: Record<string, unknown>,
  depth: number,
  state: RenderState,
  options: RendererOptions,
): string {
  state.nodeCount += 1
  if (state.nodeCount > MAX_RENDER_NODES) {
    state.warnings.push(`Node cap exceeded: tree truncated at ${MAX_RENDER_NODES} nodes (BR-001)`)
    return '<!-- node cap exceeded -->'
  }
  if (depth > MAX_RENDER_DEPTH) {
    state.warnings.push(`Max depth ${MAX_RENDER_DEPTH} exceeded (BR-001)`)
    return '<!-- max depth exceeded -->'
  }

  const props = node.props ?? {}
  const interp = (value: unknown): unknown => ExpressionService.interpolate(value, data, scope)

  switch (node.type) {
    case 'document':
    case 'content':
      return `<div class="doc-${node.type}">${renderChildren(node.children, data, scope, depth + 1, state, options)}</div>`
    case 'header':
      return `<header class="doc-header">${renderChildren(node.children, data, scope, depth + 1, state, options)}</header>`
    case 'footer':
      return `<footer class="doc-footer">${renderChildren(node.children, data, scope, depth + 1, state, options)}</footer>`
    case 'section': {
      const title = props.title !== undefined ? `<h2 class="doc-section-title">${escapeHtml(interp(props.title))}</h2>` : ''
      return `<section class="doc-section">${title}${renderChildren(node.children, data, scope, depth + 1, state, options)}</section>`
    }
    case 'text':
    case 'paragraph':
      return `<p class="doc-${node.type}">${escapeHtml(interp(props.content ?? ''))}</p>`
    case 'heading': {
      const level = [1, 2, 3, 4].includes(Number(props.level)) ? Number(props.level) : 2
      return `<h${level} class="doc-heading">${escapeHtml(interp(props.content ?? ''))}</h${level}>`
    }
    case 'image': {
      const src = String(interp(props.src ?? '') ?? '')
      if (!isAllowedImageUrl(src)) {
        state.warnings.push(`Blocked image URL "${src.slice(0, 80)}" (DR-003)`)
        return '<!-- blocked image url -->'
      }
      const alt = escapeHtml(interp(props.alt ?? ''))
      return `<img class="doc-image" src="${escapeHtml(src)}" alt="${alt}" />`
    }
    case 'table':
      return renderTable(node, data, scope, depth, state, options)
    case 'signature': {
      const name = escapeHtml(interp(props.name ?? ''))
      const title = escapeHtml(interp(props.title ?? ''))
      const city = escapeHtml(interp(props.city ?? ''))
      return `<div class="doc-signature"><p>${city}</p><div class="doc-signature-space"></div><p><strong>${name}</strong></p><p>${title}</p></div>`
    }
    case 'date': {
      const raw = interp(props.value ?? '{{current_date}}')
      return `<span class="doc-date">${escapeHtml(raw)}</span>`
    }
    case 'qrcode': {
      // Placeholder until Task 07 picks the QR library (Out of Scope).
      const payload = escapeHtml(interp(props.payload ?? props.content ?? ''))
      return `<div class="doc-qrcode" data-qr="${payload}"></div>`
    }
    case 'divider':
      return '<hr class="doc-divider" />'
    case 'pagebreak':
      return '<div class="doc-pagebreak"></div>'
    case 'repeater':
      return renderRepeater(node, data, scope, depth, state, options)
    case 'condition':
      return renderCondition(node, data, scope, depth, state, options)
    case 'component-ref':
      return renderComponentRef(node, data, scope, depth, state, options)
    default:
      state.warnings.push(`Unknown node type "${(node as DocNode).type}" skipped`)
      return `<!-- unknown node type ${(node as DocNode).type} -->`
  }
}

function renderRepeater(
  node: DocNode,
  data: Record<string, unknown>,
  scope: Record<string, unknown>,
  depth: number,
  state: RenderState,
  options: RendererOptions,
): string {
  const props = node.props ?? {}
  const source = String(props.source ?? '')
  const itemVar = String(props.item ?? 'item')
  const header = 'header' in props && props.header !== undefined
    ? `<div class="doc-repeater-header">${sanitizeRichText(String(ExpressionService.interpolate(props.header, data, scope) ?? ''))}</div>`
    : ''
  const items = ExpressionService.resolvePath(source, data, scope)
  if (!Array.isArray(items)) {
    // BR-003: non-array source renders empty + comment, never throws.
    return `${header}<!-- empty repeater: "${escapeHtml(source)}" is not an array -->`
  }
  if (items.length === 0) return `${header}<!-- empty repeater -->`
  const capped = items.length > MAX_REPEATER_ITEMS
  const slice = capped ? items.slice(0, MAX_REPEATER_ITEMS) : items
  if (capped) state.warnings.push(`Repeater "${source}" truncated to ${MAX_REPEATER_ITEMS} items (EC-02)`)
  const indexVar = typeof props.index === 'string' && props.index !== '' ? props.index : `${itemVar}_index`
  const out = slice.map((item, index) => {
    // DR-001: shadowing limited to the subtree via a fresh scope object.
    const childScope = { ...scope, [itemVar]: item, [indexVar]: index }
    return renderChildren(node.children, data, childScope, depth + 1, state, options)
  })
  return `${header}<div class="doc-repeater" data-source="${escapeHtml(source)}">${out.join('')}</div>`
}

function renderCondition(
  node: DocNode,
  data: Record<string, unknown>,
  scope: Record<string, unknown>,
  depth: number,
  state: RenderState,
  options: RendererOptions,
): string {
  const props = node.props ?? {}
  const ok = ExpressionService.evalCondition(
    props.field,
    (props.operator as ConditionOperator) ?? 'eq',
    props.value,
    data,
    scope,
  )
  const branch = ok ? node.children : node.elseChildren
  return renderChildren(branch, data, scope, depth + 1, state, options)
}

function renderComponentRef(
  node: DocNode,
  data: Record<string, unknown>,
  scope: Record<string, unknown>,
  depth: number,
  state: RenderState,
  options: RendererOptions,
): string {
  const props = node.props ?? {}
  const componentId = String(props.componentId ?? '')
  if (!componentId) {
    state.warnings.push('component-ref without componentId skipped')
    return '<!-- component-ref without componentId -->'
  }
  if (state.resolving.includes(componentId)) {
    // DR-002: cycle rejected, never infinitely recursed.
    state.warnings.push(`Cyclic component-ref "${componentId}" rejected (DR-002)`)
    return `<!-- cyclic component-ref ${escapeHtml(componentId)} -->`
  }
  const component = options.components?.[componentId]
  if (!component) {
    state.warnings.push(`Unknown component "${componentId}" skipped`)
    return `<!-- unknown component ${escapeHtml(componentId)} -->`
  }
  if (state.resolving.length >= 1) {
    // DR-002: max 1 level of component-ref nesting.
    state.warnings.push(`Nested component-ref "${componentId}" beyond 1 level rejected (DR-002)`)
    return `<!-- nested component-ref ${escapeHtml(componentId)} rejected -->`
  }
  const override = (props.propsOverride ?? {}) as Record<string, unknown>
  const mergedData = { ...data }
  for (const [key, value] of Object.entries(override)) {
    mergedData[key] = ExpressionService.interpolate(value, data, scope)
  }
  state.resolving.push(componentId)
  const html = renderNode(component, mergedData, scope, depth + 1, state, options)
  state.resolving.pop()
  return html
}

function renderTable(
  node: DocNode,
  data: Record<string, unknown>,
  scope: Record<string, unknown>,
  depth: number,
  state: RenderState,
  options: RendererOptions,
): string {
  const props = node.props ?? {}
  const columns = Array.isArray(props.columns) ? (props.columns as Array<Record<string, unknown>>) : []
  const rows = ExpressionService.resolvePath(String(props.rows ?? ''), data, scope)
  const head = columns.length > 0
    ? `<thead><tr>${columns.map((col) => `<th>${escapeHtml(ExpressionService.interpolate(col.header ?? col.key ?? '', data, scope))}</th>`).join('')}</tr></thead>`
    : ''
  let body = ''
  if (Array.isArray(rows)) {
    const slice = rows.length > MAX_REPEATER_ITEMS ? rows.slice(0, MAX_REPEATER_ITEMS) : rows
    if (rows.length > MAX_REPEATER_ITEMS) state.warnings.push(`Table rows truncated to ${MAX_REPEATER_ITEMS} (EC-02)`)
    body = `<tbody>${slice.map((row) => {
      const cells = columns.length > 0
        ? columns.map((col) => {
          const key = String(col.key ?? '')
          const value = key !== '' ? ExpressionService.resolvePath(key.startsWith('row.') ? key.slice(4) : key, row as Record<string, unknown>, {}) : ''
          return `<td>${escapeHtml(value ?? '')}</td>`
        }).join('')
        : `<td>${escapeHtml(typeof row === 'object' ? JSON.stringify(row) : row)}</td>`
      return `<tr>${cells}</tr>`
    }).join('')}</tbody>`
  } else if (node.children && node.children.length > 0) {
    body = `<tbody><tr><td colspan="${columns.length || 1}">${renderChildren(node.children, data, scope, depth + 1, state, options)}</td></tr></tbody>`
  }
  return `<table class="doc-table">${head}${body}</table>`
}
