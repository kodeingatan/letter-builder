import { describe, it, expect } from 'vitest'
import {
  PreviewDocumentSchema,
  PdfDocumentSchema,
  assertTreeLimits,
  MAX_DOC_DEPTH,
} from '../../../../server/dto/documents.dto'
import type { DocNode } from '../../../../shared/types/document'

const validTree: DocNode = {
  type: 'document',
  children: [{ type: 'text', props: { content: 'Hello {{name}}' } }],
}

function deepTree(depth: number): DocNode {
  let node: DocNode = { type: 'text', props: { content: 'leaf' } }
  for (let i = 0; i < depth; i++) node = { type: 'section', children: [node] }
  return node
}

describe('documents.dto — valid trees (BR-001, AC-005)', () => {
  it('accepts a valid preview payload', () => {
    const parsed = PreviewDocumentSchema.safeParse({ schema_json: validTree, data: { name: 'A' } })
    expect(parsed.success).toBe(true)
  })

  it('defaults data to {} and accepts optional page (A4/portrait)', () => {
    const parsed = PdfDocumentSchema.safeParse({
      schema_json: validTree,
      page: { size: 'A4', orientation: 'portrait' },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data.data).toEqual({})
  })

  it('accepts F4/Letter sizes', () => {
    for (const size of ['F4', 'Letter'] as const) {
      const parsed = PdfDocumentSchema.safeParse({ schema_json: validTree, data: {}, page: { size, orientation: 'landscape' } })
      expect(parsed.success).toBe(true)
    }
  })
})

describe('documents.dto — invalid trees → 400 shape (ERR-01, AC-005)', () => {
  it('rejects unknown node types', () => {
    const parsed = PreviewDocumentSchema.safeParse({ schema_json: { type: 'teleport' }, data: {} })
    expect(parsed.success).toBe(false)
  })

  it('rejects missing type', () => {
    const parsed = PreviewDocumentSchema.safeParse({ schema_json: { props: {} }, data: {} })
    expect(parsed.success).toBe(false)
  })

  it('rejects invalid page options', () => {
    const parsed = PdfDocumentSchema.safeParse({
      schema_json: validTree, data: {}, page: { size: 'A0', orientation: 'portrait' },
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects data beyond 2 MB', () => {
    const parsed = PreviewDocumentSchema.safeParse({ schema_json: validTree, data: { blob: 'x'.repeat(2 * 1024 * 1024 + 1) } })
    expect(parsed.success).toBe(false)
  })
})

describe('documents.dto — assertTreeLimits depth/count (BR-001)', () => {
  it(`allows depth exactly ${MAX_DOC_DEPTH}`, () => {
    expect(() => assertTreeLimits(deepTree(MAX_DOC_DEPTH))).not.toThrow()
  })

  it('throws beyond max depth (depth 11)', () => {
    expect(() => assertTreeLimits(deepTree(MAX_DOC_DEPTH + 1))).toThrow(/depth/)
  })

  it('throws beyond 200 nodes', () => {
    const kids: DocNode[] = Array.from({ length: 201 }, () => ({ type: 'text' }))
    expect(() => assertTreeLimits({ type: 'document', children: kids })).toThrow(/nodes/)
  })
})
