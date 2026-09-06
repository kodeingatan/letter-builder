import { describe, it, expect } from 'vitest'
import { PreviewRenderSchema } from '../../../server/dto/render.dto'

describe('PreviewRenderSchema (REQ-005 + Validation)', () => {
  it('accepts templateId + context', () => {
    const parsed = PreviewRenderSchema.safeParse({ templateId: 3, context: { data: { x: 1 } } })
    expect(parsed.success).toBe(true)
  })

  it('accepts an inline tree', () => {
    const parsed = PreviewRenderSchema.safeParse({
      tree: { nodes: [{ id: 't1', kind: 'text', attrs: { html: '<p>Hi</p>' } }] },
      context: {},
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects payloads with neither templateId nor tree', () => {
    const parsed = PreviewRenderSchema.safeParse({ context: {} })
    expect(parsed.success).toBe(false)
  })

  it('rejects contexts over the 1MB cap', () => {
    const parsed = PreviewRenderSchema.safeParse({
      tree: { nodes: [] },
      context: { blob: 'x'.repeat(1024 * 1024 + 1) },
    })
    expect(parsed.success).toBe(false)
  })
})
