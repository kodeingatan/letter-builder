import { describe, it, expect } from 'vitest'
import {
  CreateTemplateSchema,
  UpdateTemplateSchema,
  TemplateQuerySchema,
} from '../../../server/dto/templates.dto'
import {
  parseContentTree,
  validateContentTree,
  isMeaningfulNode,
  isNonEmptyContent,
  countMeaningfulNodes,
} from '../../../server/utils/template-helpers'

describe('CreateTemplateSchema', () => {
  it('accepts a draft with name only (AC-001: draft v0)', () => {
    const parsed = CreateTemplateSchema.safeParse({ name: 'Surat Keputusan' })
    expect(parsed.success).toBe(true)
  })

  it('accepts name + description + valid skeleton', () => {
    const parsed = CreateTemplateSchema.safeParse({
      name: 'Surat Keputusan',
      description: 'Official decree blueprint',
      content: JSON.stringify({ nodes: [{ type: 'heading', text: 'SK' }] }),
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects empty or overlong names (BR-001)', () => {
    expect(CreateTemplateSchema.safeParse({ name: '' }).success).toBe(false)
    expect(CreateTemplateSchema.safeParse({ name: 'x'.repeat(101) }).success).toBe(false)
  })

  it('rejects malformed content that is not { nodes: [...] }', () => {
    expect(CreateTemplateSchema.safeParse({ name: 'X', content: 'not json' }).success).toBe(false)
    expect(CreateTemplateSchema.safeParse({ name: 'X', content: '{"foo": 1}' }).success).toBe(false)
    expect(CreateTemplateSchema.safeParse({ name: 'X', content: '{"nodes": {}}' }).success).toBe(false)
  })

  it('accepts blank content as an empty draft', () => {
    expect(CreateTemplateSchema.safeParse({ name: 'X', content: null }).success).toBe(true)
    expect(CreateTemplateSchema.safeParse({ name: 'X', content: '' }).success).toBe(true)
    expect(CreateTemplateSchema.safeParse({ name: 'X', content: '   ' }).success).toBe(true)
  })
})

describe('UpdateTemplateSchema', () => {
  it('accepts partial metadata updates', () => {
    expect(UpdateTemplateSchema.safeParse({ name: 'Renamed' }).success).toBe(true)
    expect(UpdateTemplateSchema.safeParse({ description: 'notes' }).success).toBe(true)
  })

  it('rejects malformed content on update', () => {
    expect(UpdateTemplateSchema.safeParse({ content: '<p>html</p>' }).success).toBe(false)
  })
})

describe('TemplateQuerySchema', () => {
  it('applies pagination defaults', () => {
    const parsed = TemplateQuerySchema.safeParse({})
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.page).toBe(1)
      expect(parsed.data.limit).toBe(20)
    }
  })
})

describe('parseContentTree', () => {
  it('parses a valid skeleton', () => {
    expect(parseContentTree('{"nodes": [{"text": "hi"}]}')).toEqual({ nodes: [{ text: 'hi' }] })
  })

  it('returns null for blank / invalid / wrong-shape content', () => {
    expect(parseContentTree(null)).toBeNull()
    expect(parseContentTree('')).toBeNull()
    expect(parseContentTree('   ')).toBeNull()
    expect(parseContentTree('nope')).toBeNull()
    expect(parseContentTree('{"nodes": "x"}')).toBeNull()
  })
})

describe('validateContentTree', () => {
  it('reports node counts for valid skeletons', () => {
    expect(validateContentTree('{"nodes": []}')).toEqual({ valid: true, nodeCount: 0 })
    expect(validateContentTree('{"nodes": [{}, {}]}')).toEqual({ valid: true, nodeCount: 2 })
  })

  it('rejects invalid JSON with a clear error', () => {
    const result = validateContentTree('{broken')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('valid JSON')
  })
})

describe('isMeaningfulNode (BR-002)', () => {
  it('counts text nodes and component placements', () => {
    expect(isMeaningfulNode({ type: 'heading', text: 'SK' })).toBe(true)
    expect(isMeaningfulNode({ type: 'component', componentId: 3 })).toBe(true)
    expect(isMeaningfulNode('hello')).toBe(true)
  })

  it('ignores empty objects / blank strings', () => {
    expect(isMeaningfulNode({})).toBe(false)
    expect(isMeaningfulNode({ text: '   ' })).toBe(false)
    expect(isMeaningfulNode('')).toBe(false)
    expect(isMeaningfulNode(null)).toBe(false)
  })
})

describe('isNonEmptyContent (BR-002 / AC-005)', () => {
  it('blocks empty drafts from publishing', () => {
    expect(isNonEmptyContent(null)).toBe(false)
    expect(isNonEmptyContent('')).toBe(false)
    expect(isNonEmptyContent('{"nodes": []}')).toBe(false)
    expect(isNonEmptyContent('{"nodes": [{}]}')).toBe(false)
    expect(isNonEmptyContent('not json')).toBe(false)
  })

  it('allows drafts with ≥1 text node or component placement (AC-002)', () => {
    expect(isNonEmptyContent('{"nodes": [{"text": "hi"}]}')).toBe(true)
    expect(isNonEmptyContent('{"nodes": [{}, {"componentId": 1}]}')).toBe(true)
  })
})

describe('countMeaningfulNodes', () => {
  it('counts only meaningful nodes', () => {
    expect(countMeaningfulNodes('{"nodes": [{}, {"text": "a"}, {"text": ""}]}')).toBe(1)
    expect(countMeaningfulNodes(null)).toBe(0)
  })
})
