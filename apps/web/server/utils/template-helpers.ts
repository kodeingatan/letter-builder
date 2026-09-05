/**
 * Pure helpers for Template Management (Task 14).
 * Kept DB-free so they are unit-testable in the `unit` vitest project.
 *
 * Content skeleton shape (schema-light v1, Assumptions):
 * `{ nodes: [...] }` where each node is a text node or a component
 * placement. Task 15 extends node kinds without migration (JSON schemaless).
 */

export interface ContentNodeLike {
  text?: unknown
  type?: unknown
  componentId?: unknown
  html?: unknown
  [key: string]: unknown
}

export interface ContentTree {
  nodes: ContentNodeLike[] | unknown[]
}

/** Parse a draft/version content string into a `{ nodes }` tree. Returns null when unparseable. */
export function parseContentTree(content: string | null | undefined): ContentTree | null {
  if (content === null || content === undefined) return null
  const trimmed = content.trim()
  if (!trimmed) return null
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as ContentTree).nodes)) {
      return parsed as ContentTree
    }
    return null
  } catch {
    return null
  }
}

/** Validate the skeleton shape. Used by Zod refinement + publish guard (BR-002). */
export function validateContentTree(content: string | null | undefined): { valid: boolean; error?: string; nodeCount: number } {
  if (content === null || content === undefined || !content.trim()) {
    return { valid: false, error: 'Content must be a JSON document tree { nodes: [...] }', nodeCount: 0 }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    return { valid: false, error: 'Content must be valid JSON', nodeCount: 0 }
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as ContentTree).nodes)) {
    return { valid: false, error: 'Content must be a JSON document tree { nodes: [...] }', nodeCount: 0 }
  }
  return { valid: true, nodeCount: (parsed as ContentTree).nodes.length }
}

/**
 * A node counts as content when it carries any payload: non-empty text,
 * a node type, a component placement, html, or any other non-empty value.
 * Plain `{}` / empty strings do not count (BR-002: publish requires
 * ≥1 text node or component placement).
 */
export function isMeaningfulNode(node: unknown): boolean {
  if (node === null || node === undefined) return false
  if (typeof node === 'string') return node.trim().length > 0
  if (typeof node !== 'object') return true
  const record = node as Record<string, unknown>
  const keys = Object.keys(record)
  if (keys.length === 0) return false
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string') {
      if (value.trim().length > 0) return true
    } else if (value !== null && value !== undefined) {
      if (typeof value === 'number' && value === 0 && keys.length === 1) continue
      return true
    }
  }
  return false
}

/** Publish guard (BR-002 / AC-005): draft must contain ≥1 meaningful node. */
export function isNonEmptyContent(content: string | null | undefined): boolean {
  const tree = parseContentTree(content)
  if (!tree) return false
  return tree.nodes.some((node) => isMeaningfulNode(node))
}

/** Canonical empty skeleton for new drafts / the editor placeholder. */
export function emptySkeleton(): string {
  return JSON.stringify({ nodes: [] }, null, 2)
}

/** Count meaningful nodes — surfaced in list/detail usage summaries. */
export function countMeaningfulNodes(content: string | null | undefined): number {
  const tree = parseContentTree(content)
  if (!tree) return 0
  return tree.nodes.filter((node) => isMeaningfulNode(node)).length
}
