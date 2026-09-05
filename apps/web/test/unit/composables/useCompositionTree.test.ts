import { describe, it, expect } from 'vitest'
import {
  newNodeId,
  createNode,
  defaultAttrsFor,
  parseTree,
  serializeTree,
  isCompositionTreeContent,
  legacyToComposition,
  insertNodeAt,
  moveNode,
  removeNodeAt,
  wrapIn,
  unwrapAt,
  findNode,
  updateNodeAttrs,
  removeNodeById,
  appendChildNode,
  sanitizePastedHtml,
  summarizeCompositionNode,
  structuralPreviewLines,
} from '../../../app/composables/useCompositionTree'
import type { CompositionNode } from '../../../shared/types/template'

describe('newNodeId', () => {
  it('generates unique non-empty keys', () => {
    const ids = new Set([newNodeId(), newNodeId(), newNodeId()])
    expect(ids.size).toBe(3)
  })
})

describe('createNode + defaultAttrsFor', () => {
  it('creates loop/condition containers with children arrays', () => {
    const loop = createNode('loop', defaultAttrsFor('loop'))
    expect(loop.children).toEqual([])
    expect(loop.attrs.source.mode).toBe('all')
    const text = createNode('text', defaultAttrsFor('text'))
    expect(text.children).toBeUndefined()
  })
})

describe('parseTree + serializeTree round-trip (REQ-005)', () => {
  it('restores the canvas 1:1', () => {
    const nodes: CompositionNode[] = [
      createNode('text', { html: '<p>SK</p>' }),
      {
        ...createNode('loop', { source: { tableName: 'pegawai', mode: 'selected', rowIds: [1, 2, 3] } }),
        children: [createNode('component', { componentId: 5, componentVersion: 2, bindings: {} })],
      },
    ]
    const serialized = serializeTree(nodes)
    const restored = parseTree(serialized)
    expect(restored).toEqual(nodes)
  })

  it('returns [] for blank content and null for garbage', () => {
    expect(parseTree(null)).toEqual([])
    expect(parseTree('  ')).toEqual([])
    expect(parseTree('nope')).toBeNull()
    expect(parseTree('{"foo": 1}')).toBeNull()
  })
})

describe('isCompositionTreeContent', () => {
  it('distinguishes Task 15 trees from Task 14 skeletons', () => {
    expect(isCompositionTreeContent([{ type: 'heading', text: 'x' }])).toBe(false)
    expect(isCompositionTreeContent([createNode('text', {})])).toBe(true)
  })
})

describe('legacyToComposition', () => {
  it('upgrades Task 14 skeletons without data loss', () => {
    const out = legacyToComposition([
      { type: 'heading', text: 'Surat Keputusan' },
      { componentId: 7 },
      { id: 'keep', kind: 'text', attrs: { html: '<p>x</p>' } },
    ])
    expect(out).toHaveLength(3)
    expect(out[0]).toMatchObject({ kind: 'text' })
    expect(out[0].attrs?.html).toContain('Surat Keputusan')
    expect(out[1]).toMatchObject({ kind: 'component', attrs: { componentId: 7 } })
    expect(out[2].id).toBe('keep')
  })
})

describe('list ops', () => {
  const three = () => [createNode('text'), createNode('image'), createNode('table')]

  it('inserts, moves, and removes without mutating the input', () => {
    const base = three()
    const inserted = insertNodeAt(base, 1, createNode('page-break'))
    expect(inserted).toHaveLength(4)
    expect(inserted[1].kind).toBe('page-break')
    expect(base).toHaveLength(3)

    const moved = moveNode(inserted, 1, 1)
    expect(moved[2].kind).toBe('page-break')
    expect(moveNode(base, 0, -1)).toBe(base)

    expect(removeNodeAt(base, 0)).toHaveLength(2)
  })

  it('wraps a node and unwraps it back (AC-002 shape)', () => {
    const base = three()
    const wrapped = wrapIn(base, 0, 'loop')
    expect(wrapped[0].kind).toBe('loop')
    expect(wrapped[0].children).toHaveLength(1)
    const unwrapped = unwrapAt(wrapped, 0)
    expect(unwrapped).toHaveLength(3)
    expect(unwrapped[0].kind).toBe('text')
    expect(unwrapAt(base, 0)).toBe(base)
  })
})

describe('deep ops', () => {
  function tree(): CompositionNode[] {
    return [
      createNode('text', { html: '<p>a</p>' }),
      { ...createNode('loop', { source: { tableName: 'pegawai', mode: 'all' } }), children: [createNode('text', { html: '<p>b</p>' })] },
    ]
  }

  it('finds nested nodes with ancestors', () => {
    const nodes = tree()
    const innerId = nodes[1].children![0].id
    const found = findNode(nodes, innerId)
    expect(found?.node.id).toBe(innerId)
    expect(found?.ancestors).toHaveLength(1)
    expect(findNode(nodes, 'missing')).toBeNull()
  })

  it('patches attrs and removes by id at any depth', () => {
    const nodes = tree()
    const innerId = nodes[1].children![0].id
    const patched = updateNodeAttrs(nodes, innerId, { html: '<p>c</p>' })
    expect(findNode(patched, innerId)?.node.attrs?.html).toBe('<p>c</p>')
    expect(findNode(nodes, innerId)?.node.attrs?.html).toBe('<p>b</p>')

    const removed = removeNodeById(nodes, innerId)
    expect(removed[1].children).toHaveLength(0)
    expect(nodes[1].children).toHaveLength(1)
  })

  it('appends children into loop/condition containers only', () => {
    const nodes = tree()
    const loopId = nodes[1].id
    const next = appendChildNode(nodes, loopId, createNode('page-break'))
    expect(next[1].children).toHaveLength(2)
    expect(appendChildNode(nodes, nodes[0].id, createNode('page-break'))).toEqual(nodes)
  })
})

describe('sanitizePastedHtml (AC-005)', () => {
  it('strips scripts and event handlers on paste', () => {
    expect(sanitizePastedHtml('<p>ok</p><script>evil()</script>')).toBe('<p>ok</p>')
    expect(sanitizePastedHtml('<b onmouseover="x()">t</b>')).toBe('<b>t</b>')
  })
})

describe('structural preview (AC-002)', () => {
  it('summarizes loops with selected-row counts', () => {
    const nodes: CompositionNode[] = [
      {
        ...createNode('loop', { source: { tableName: 'pegawai', mode: 'selected', rowIds: [1, 2, 3] } }),
        children: [createNode('component', { componentId: 5, bindings: { nama: 'x' } })],
      },
    ]
    const lines = structuralPreviewLines(nodes, { 5: 'Daftar Pegawai' })
    expect(lines[0]).toContain('pegawai')
    expect(lines[0]).toContain('3 row(s)')
    expect(lines[1]).toContain('Daftar Pegawai')
  })
})
