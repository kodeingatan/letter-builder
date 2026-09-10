import { describe, it, expect } from 'vitest'
// Canonical composition contracts (Task 24 single source of truth).
import { COMPOSITION_KINDS, type CompositionNode } from '../../../shared/types/template'
import {
  isCompositionNode,
  unwrapTokenExpression,
  isBooleanShapedExpression,
  sanitizeHtmlFragment,
  isSafeImageSrc,
  sanitizeTree,
  collectPlacements,
  isSlotBound,
  validateNodeShapes,
  parseTreeInput,
  hasCompositionNodes,
  MAX_WRAPPER_DEPTH,
} from '../../../server/utils/composition-tree'

function node(kind: CompositionNode['kind'], attrs: Record<string, any> = {}, id = `n-${Math.random()}`): CompositionNode {
  return { id, kind, attrs }
}

describe('COMPOSITION_KINDS (REQ-001)', () => {
  it('covers all eight wiki node kinds', () => {
    expect([...COMPOSITION_KINDS].sort()).toEqual(
      ['component', 'condition', 'data-token', 'image', 'loop', 'page-break', 'table', 'text'].sort(),
    )
  })
})

describe('isCompositionNode', () => {
  it('detects kind-carrying nodes and ignores legacy skeletons', () => {
    expect(isCompositionNode({ id: 'a', kind: 'text' })).toBe(true)
    expect(isCompositionNode({ type: 'heading', text: 'SK' })).toBe(false)
    expect(isCompositionNode({ kind: 'nope' })).toBe(false)
    expect(isCompositionNode(null)).toBe(false)
  })
})

describe('unwrapTokenExpression', () => {
  it('strips {{ }} delimiters', () => {
    expect(unwrapTokenExpression('{{data.nama}}')).toBe('data.nama')
    expect(unwrapTokenExpression('  {{ harga * 2 }} ')).toBe('harga * 2')
    expect(unwrapTokenExpression('harga * 2')).toBe('harga * 2')
  })
})

describe('isBooleanShapedExpression (BR-003)', () => {
  it('accepts comparisons, not-operator, booleans, IF()', () => {
    expect(isBooleanShapedExpression('data.total > 100')).toBe(true)
    expect(isBooleanShapedExpression('data.status == "aktif"')).toBe(true)
    expect(isBooleanShapedExpression('!data.archived')).toBe(true)
    expect(isBooleanShapedExpression('true')).toBe(true)
    expect(isBooleanShapedExpression('IF(data.x > 1, true, false)')).toBe(true)
  })

  it('rejects arithmetic/concat/bare refs and garbage', () => {
    expect(isBooleanShapedExpression('harga * 2')).toBe(false)
    expect(isBooleanShapedExpression('data.nama')).toBe(false)
    expect(isBooleanShapedExpression('(((')).toBe(false)
  })
})

describe('sanitizeHtmlFragment (AC-005)', () => {
  it('strips script blocks and keeps safe markup', () => {
    const out = sanitizeHtmlFragment('<p>hi</p><script>alert(1)</script><p>bye</p>')
    expect(out).not.toContain('<script>')
    expect(out).not.toContain('alert(1)')
    expect(out).toContain('<p>hi</p>')
    expect(out).toContain('<p>bye</p>')
  })

  it('strips iframes, event handlers, and javascript: URLs', () => {
    expect(sanitizeHtmlFragment('<iframe src="https://x"></iframe>text')).toBe('text')
    expect(sanitizeHtmlFragment('<p onClick="evil()">x</p>')).toBe('<p>x</p>')
    expect(sanitizeHtmlFragment('<a href="javascript:evil()">x</a>')).toBe('<a>x</a>')
    expect(sanitizeHtmlFragment('<!-- comment -->ok')).toBe('ok')
  })

  it('keeps benign formatting tags and safe links', () => {
    const html = '<b>bold</b> <a href="https://example.com">link</a>'
    expect(sanitizeHtmlFragment(html)).toBe(html)
  })
})

describe('isSafeImageSrc', () => {
  it('blocks scriptable schemes', () => {
    expect(isSafeImageSrc('javascript:alert(1)')).toBe(false)
    expect(isSafeImageSrc('data:text/html,<script>x</script>')).toBe(false)
    expect(isSafeImageSrc('')).toBe(false)
  })

  it('allows http(s), relative, and data:image sources', () => {
    expect(isSafeImageSrc('https://example.com/a.png')).toBe(true)
    expect(isSafeImageSrc('/api/storage/general/a.png')).toBe(true)
    expect(isSafeImageSrc('data:image/png;base64,AAA')).toBe(true)
  })
})

describe('validateNodeShapes', () => {
  it('accepts a tree with every node kind (REQ-001)', () => {
    const nodes: CompositionNode[] = [
      node('text', { html: '<p>SK</p>' }, 't1'),
      node('image', { src: 'https://example.com/kop.png', alt: 'Kop' }, 'i1'),
      node('table', { headers: ['Nama'], rows: [['Budi']] }, 'tb1'),
      node('component', { componentId: 3, componentVersion: 1, bindings: {} }, 'c1'),
      node('data-token', { expression: '{{data.nip}}' }, 'tok1'),
      {
        id: 'l1',
        kind: 'loop',
        attrs: { source: { tableName: 'pegawai', mode: 'all' } },
        children: [node('component', { componentId: 3 }, 'c2')],
      },
      {
        id: 'cond1',
        kind: 'condition',
        attrs: { expression: 'data.total > 100' },
        children: [node('text', { text: 'Mahal' }, 't2')],
      },
      node('page-break', {}, 'pb1'),
    ]
    const result = validateNodeShapes(nodes)
    expect(result.errors).toEqual([])
    expect(result.stats).toMatchObject({ placementCount: 2, loopCount: 1, conditionCount: 1, tokenCount: 1 })
  })

  it('passes legacy Task 14 nodes through untouched', () => {
    const result = validateNodeShapes([{ type: 'heading', text: 'SK' }, { text: 'hi' }])
    expect(result.errors).toEqual([])
    expect(result.stats.nodeCount).toBe(0)
  })

  it('rejects unknown kinds, missing ids, and duplicate ids', () => {
    const bad = validateNodeShapes([
      { id: 'a', kind: 'marquee', attrs: {} },
      { kind: 'text', attrs: {} },
      node('text', {}, 'dup'),
      node('text', {}, 'dup'),
    ])
    expect(bad.errors.length).toBeGreaterThanOrEqual(3)
    expect(bad.errors.some((e) => e.message.includes('kind'))).toBe(true)
    expect(bad.errors.some((e) => e.message.includes('Duplicate node id'))).toBe(true)
  })

  it('rejects children on leaf kinds and missing children on wrappers', () => {
    const bad = validateNodeShapes([
      { ...node('text', { text: 'x' }, 't'), children: [] },
      { id: 'l', kind: 'loop', attrs: { source: { tableName: 'pegawai', mode: 'all' } } },
    ])
    expect(bad.errors.some((e) => e.message.includes('must not have children'))).toBe(true)
    expect(bad.errors.some((e) => e.message.includes('requires a children array'))).toBe(true)
  })

  it(`enforces wrapper nesting depth ≤ ${MAX_WRAPPER_DEPTH} (BR-005)`, () => {
    const deep: CompositionNode = { id: 'l1', kind: 'loop', attrs: { source: { tableName: 't', mode: 'all' } }, children: [] }
    let cursor = deep
    for (let i = 2; i <= 4; i++) {
      const child: CompositionNode = {
        id: `l${i}`,
        kind: i % 2 === 0 ? 'condition' : 'loop',
        attrs: i % 2 === 0 ? { expression: 'true' } : { source: { tableName: 't', mode: 'all' } },
        children: [],
      }
      cursor.children = [child]
      cursor = child
    }
    const bad = validateNodeShapes([deep])
    expect(bad.errors.some((e) => e.message.includes('Max nesting depth'))).toBe(true)

    const shallow: CompositionNode = {
      id: 's1',
      kind: 'loop',
      attrs: { source: { tableName: 't', mode: 'all' } },
      children: [
        { id: 's2', kind: 'condition', attrs: { expression: 'true' }, children: [node('text', { text: 'x' }, 's3')] },
      ],
    }
    expect(validateNodeShapes([shallow]).errors).toEqual([])
  })

  it('blocks invalid data-token expressions (BR-004)', () => {
    const bad = validateNodeShapes([node('data-token', { expression: '{{harga *}}' }, 'tok')])
    expect(bad.errors.some((e) => e.message.includes('Invalid data token'))).toBe(true)
    const ok = validateNodeShapes([node('data-token', { expression: '{{data.nip}}' }, 'tok')])
    expect(ok.errors).toEqual([])
  })

  it('blocks invalid condition expressions but only warns on non-boolean shapes (BR-003)', () => {
    const bad = validateNodeShapes([{ id: 'c', kind: 'condition', attrs: { expression: '(((' }, children: [] }])
    expect(bad.errors.some((e) => e.message.includes('Invalid condition'))).toBe(true)

    const warn = validateNodeShapes([{ id: 'c', kind: 'condition', attrs: { expression: 'harga * 2' }, children: [] }])
    expect(warn.errors).toEqual([])
    expect(warn.warnings.some((w) => w.message.includes('truthiness'))).toBe(true)
  })

  it('validates loop source config basics (BR-002 shape level)', () => {
    const bad = validateNodeShapes([
      { id: 'l1', kind: 'loop', attrs: { source: { tableName: '', mode: 'all' } }, children: [] },
      { id: 'l2', kind: 'loop', attrs: { source: { tableName: 'pegawai', mode: 'bogus' } }, children: [] },
      { id: 'l3', kind: 'loop', attrs: { source: { tableName: 'pegawai', mode: 'selected', rowIds: [] } }, children: [] },
      {
        id: 'l4', kind: 'loop',
        attrs: { source: { tableName: 'pegawai', mode: 'filtered', filter: [{ field: '', operator: '==' }] } },
        children: [],
      },
    ])
    expect(bad.errors.length).toBe(4)
  })

  it('rejects placements without a numeric componentId and unsafe image srcs', () => {
    const bad = validateNodeShapes([
      node('component', {}, 'c'),
      node('image', { src: 'javascript:evil()' }, 'i'),
    ])
    expect(bad.errors.length).toBe(2)
  })

  it('rejects a non-array tree', () => {
    const bad = validateNodeShapes({ nodes: [] })
    expect(bad.errors.length).toBe(1)
  })
})

describe('sanitizeTree', () => {
  it('sanitizes nested html including table cells', () => {
    const out = sanitizeTree([
      node('text', { html: '<p>ok</p><script>evil()</script>' }, 't'),
      {
        id: 'l', kind: 'loop',
        attrs: { source: { tableName: 'pegawai', mode: 'all' } },
        children: [node('table', { headers: ['<b>H</b>'], rows: [['<img src=x onerror=evil()>']] }, 'tb')],
      },
    ])
    expect(out[0].attrs.html).toBe('<p>ok</p>')
    expect(out[1].children?.[0].attrs?.rows[0][0]).toBe('<img src=x>')
  })
})

describe('collectPlacements + isSlotBound (REQ-006)', () => {
  it('finds placements at any depth with correct paths', () => {
    const tree: CompositionNode[] = [
      node('component', { componentId: 1, bindings: { nama: 'x' } }, 'c1'),
      {
        id: 'l', kind: 'loop',
        attrs: { source: { tableName: 'pegawai', mode: 'all' } },
        children: [node('component', { componentId: 2, componentVersion: 4 }, 'c2')],
      },
    ]
    const placements = collectPlacements(tree)
    expect(placements).toHaveLength(2)
    expect(placements[0]).toMatchObject({ nodeId: 'c1', path: 'nodes[0]', componentId: 1 })
    expect(placements[1]).toMatchObject({ nodeId: 'c2', path: 'nodes[1].children[0]', componentVersion: 4 })
  })

  it('treats empty values as unbound', () => {
    expect(isSlotBound('Budi')).toBe(true)
    expect(isSlotBound('  ')).toBe(false)
    expect(isSlotBound(null)).toBe(false)
    expect(isSlotBound({ value: 'x' })).toBe(true)
    expect(isSlotBound({ value: '' })).toBe(false)
    expect(isSlotBound(7)).toBe(true)
  })
})

describe('parseTreeInput + hasCompositionNodes', () => {
  it('parses strings and objects, rejects garbage', () => {
    expect(parseTreeInput('{"nodes": []}').nodes).toEqual([])
    expect(parseTreeInput({ nodes: [] }).nodes).toEqual([])
    expect(parseTreeInput('nope').error).toContain('valid JSON')
    expect(parseTreeInput('{"foo": 1}').error).toContain('{ nodes: [...] }')
    expect(parseTreeInput(null).error).toBeTruthy()
  })

  it('detects composition shapes including nested wrappers', () => {
    expect(hasCompositionNodes([{ type: 'heading', text: 'x' }])).toBe(false)
    expect(hasCompositionNodes([node('text', {}, 't')])).toBe(true)
    expect(
      hasCompositionNodes([
        { id: 'l', kind: 'loop', attrs: {}, children: [{ type: 'paragraph', text: 'x' }] } as unknown as CompositionNode,
      ]),
    ).toBe(true)
  })
})
