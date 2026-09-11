/**
 * Client-side helpers for Template Management .
 * Mirrors `server/utils/template-helpers.ts` for instant editor validation.
 * Composition canvas for template editing
 * as JSON (`{ nodes: [...] }`) with a read-only stub preview.
 */

export interface ParsedTree {
  nodes: unknown[]
}

export function parseContentTree(content: string | null | undefined): ParsedTree | null {
  if (content === null || content === undefined) return null
  const trimmed = content.trim()
  if (!trimmed) return null
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as ParsedTree).nodes)) {
      return parsed as ParsedTree
    }
    return null
  } catch {
    return null
  }
}

export function validateContentTree(content: string | null | undefined): { valid: boolean; error?: string; nodeCount: number } {
  if (content === null || content === undefined || !content.trim()) {
    return { valid: false, error: 'Content must be a JSON document tree { nodes: [...] }', nodeCount: 0 }
  }
  try {
    const parsed = JSON.parse(content)
    if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as ParsedTree).nodes)) {
      return { valid: false, error: 'Content must be a JSON document tree { nodes: [...] }', nodeCount: 0 }
    }
    return { valid: true, nodeCount: (parsed as ParsedTree).nodes.length }
  } catch {
    return { valid: false, error: 'Content must be valid JSON', nodeCount: 0 }
  }
}

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

export function isNonEmptyContent(content: string | null | undefined): boolean {
  const tree = parseContentTree(content)
  if (!tree) return false
  return tree.nodes.some((node) => isMeaningfulNode(node))
}

export function emptySkeleton(): string {
  return JSON.stringify({ nodes: [] }, null, 2)
}

export function sampleSkeleton(): string {
  return JSON.stringify(
    {
      nodes: [
        { type: 'heading', text: 'Surat Keputusan' },
        { type: 'paragraph', text: 'Dengan ini menetapkan...' },
      ],
    },
    null,
    2,
  )
}

/** Human-readable one-line summary of a node for the read-only stub preview. */
export function summarizeNode(node: unknown): string {
  if (node === null || node === undefined) return '(empty node)'
  if (typeof node === 'string') return node
  if (typeof node !== 'object') return String(node)
  const record = node as Record<string, unknown>
  const type = typeof record.type === 'string' ? `[${record.type}] ` : ''
  for (const key of ['text', 'html', 'content']) {
    if (typeof record[key] === 'string' && (record[key] as string).trim()) {
      return `${type}${(record[key] as string).slice(0, 120)}`
    }
  }
  if (record.componentId !== undefined && record.componentId !== null) {
    return `${type}component #${String(record.componentId)}`
  }
  return `${type}${JSON.stringify(node).slice(0, 120)}`
}
