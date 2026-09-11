import { describe, it, expect } from 'vitest'
import {
  render,
  RenderTimeoutError,
} from '../../../server/utils/rendering/pipeline'
import { htmlToPdf } from '../../../server/utils/rendering/pdf'
import { PRINT_CSS } from '../../../server/utils/rendering/print-css'
import type { BindingLike, ComponentSnapshotLike } from '../../../server/utils/rendering/types'

function pegawaiContext() {
  return {
    data: {
      pegawai: [
        { nama: 'Andi', nip: '19800101', jabatan: 'Staf' },
        { nama: 'Budi', nip: '19800202', jabatan: 'Kasubag' },
        { nama: 'Citra', nip: '19800303', jabatan: 'Kabag' },
      ],
    },
  }
}

function collectionSnapshot(): ComponentSnapshotLike[] {
  return [
    {
      componentId: 7,
      componentName: 'Identitas Pegawai',
      content: '<p>{{nama}} — {{nip}} ({{jabatan}})</p>',
      looping: false,
      requirements: [
        { name: 'nama', type: 'text' },
        { name: 'nip', type: 'text' },
        { name: 'jabatan', type: 'text' },
      ],
    },
  ]
}

function itemBindings(): BindingLike[] {
  return [
    { placementId: 'c1', requirementName: 'nama', componentId: 7, source: 'global_table', sourceRef: 'item.nama' },
    { placementId: 'c1', requirementName: 'nip', componentId: 7, source: 'global_table', sourceRef: 'item.nip' },
    { placementId: 'c1', requirementName: 'jabatan', componentId: 7, source: 'global_table', sourceRef: 'item.jabatan' },
  ]
}

describe('render — AC-001 collection via loop + item.* bindings (REQ-002)', () => {
  it('renders 3 numbered blocks with correct NIP/jabatan each', () => {
    const tree = [
      {
        id: 'loop1',
        kind: 'loop',
        attrs: { source: { tableName: 'pegawai', mode: 'all' } },
        children: [{ id: 'c1', kind: 'component', attrs: { componentId: 7 } }],
      },
    ]
    const result = render(tree, pegawaiContext(), {
      componentSnapshots: collectionSnapshot(),
      bindings: itemBindings(),
    })
    expect(result.warnings).toEqual([])
    for (const row of ['Andi', '19800101', 'Staf', 'Budi', '19800202', 'Kasubag', 'Citra', '19800303', 'Kabag']) {
      expect(result.html).toContain(row)
    }
    expect((result.html.match(/19800/g) ?? []).length).toBe(3)
  })
})

describe('render — AC-002 false condition excludes cleanly', () => {
  it('omits the subtree with no warnings', () => {
    const tree = [
      { id: 't1', kind: 'text', attrs: { html: '<p>Always</p>' } },
      {
        id: 'cond1',
        kind: 'condition',
        attrs: { expression: '{{data.show}} == true' },
        children: [{ id: 't2', kind: 'text', attrs: { html: '<p>Secret</p>' } }],
      },
    ]
    const result = render(tree, { data: { show: false } }, {})
    expect(result.html).toContain('Always')
    expect(result.html).not.toContain('Secret')
    expect(result.warnings).toEqual([])
  })

  it('includes the subtree when the condition is true', () => {
    const tree = [
      {
        id: 'cond1',
        kind: 'condition',
        attrs: { expression: '{{data.show}} == true' },
        children: [{ id: 't2', kind: 'text', attrs: { html: '<p>Secret</p>' } }],
      },
    ]
    const result = render(tree, { data: { show: true } }, {})
    expect(result.html).toContain('Secret')
  })
})

describe('render — AC-003 missing data warns but succeeds', () => {
  it('emits empty string + MISSING_DATA for unbound slots', () => {
    const tree = [{ id: 'c1', kind: 'component', attrs: { componentId: 7 } }]
    const result = render(tree, { data: {} }, { componentSnapshots: collectionSnapshot(), bindings: [] })
    expect(result.html).toContain('lbs-doc')
    const codes = result.warnings.map((w) => w.code)
    expect(codes).toContain('MISSING_DATA')
    expect(result.warnings[0].nodeId).toBe('c1')
  })

  it('emits MISSING_DATA for missing data-token refs', () => {
    const tree = [{ id: 'tok1', kind: 'data-token', attrs: { expression: '{{data.pegawai.nama}}' } }]
    const result = render(tree, { data: {} }, {})
    expect(result.warnings.some((w) => w.code === 'MISSING_DATA')).toBe(true)
  })
})

describe('render — AC-004 determinism', () => {
  it('produces byte-identical HTML for identical input', () => {
    const tree = [
      { id: 't1', kind: 'text', attrs: { html: '<p>Surat {{data.no}}</p>' } },
      {
        id: 'loop1',
        kind: 'loop',
        attrs: { source: { tableName: 'pegawai', mode: 'all' } },
        children: [{ id: 'c1', kind: 'component', attrs: { componentId: 7 } }],
      },
    ]
    const context = { ...pegawaiContext(), data: { ...pegawaiContext().data, no: '001/ST/2026' } }
    const opts = { componentSnapshots: collectionSnapshot(), bindings: itemBindings() }
    const first = render(tree, context, opts)
    const second = render(tree, context, opts)
    expect(second.html).toBe(first.html)
    expect(htmlToPdf(first.html).equals(htmlToPdf(second.html))).toBe(true)
  })
})

describe('render — AC-005 loop cap (BR-003)', () => {
  it('renders 500 items + truncation marker + LOOP_TRUNCATED', () => {
    const items = Array.from({ length: 600 }, (_, i) => ({ nama: `Pegawai ${i + 1}` }))
    const tree = [
      {
        id: 'loop1',
        kind: 'loop',
        attrs: { source: { tableName: 'pegawai', mode: 'all' } },
        children: [{ id: 't1', kind: 'text', attrs: { html: '<p>{{item.nama}}</p>' } }],
      },
    ]
    const result = render(tree, { data: { pegawai: items } }, {})
    expect((result.html.match(/Pegawai /g) ?? []).length).toBe(500)
    expect(result.html).not.toContain('Pegawai 501')
    expect(result.html).toContain('loop-truncation')
    expect(result.warnings.some((w) => w.code === 'LOOP_TRUNCATED')).toBe(true)
  })
})

describe('render — AC-006 sanitizer', () => {
  it('strips <script> from richtext content', () => {
    const tree = [
      { id: 't1', kind: 'text', attrs: { html: '<p>Hello</p><script>alert(1)</script>' } },
    ]
    const result = render(tree, {}, {})
    expect(result.html).toContain('<p>Hello</p>')
    expect(result.html).not.toContain('<script>')
    expect(result.html).not.toContain('alert(1)')
  })

  it('strips event handlers and javascript: urls', () => {
    const tree = [
      { id: 't1', kind: 'text', attrs: { html: '<p onclick="evil()">x</p><a href="javascript:evil()">y</a>' } },
    ]
    const result = render(tree, {}, {})
    expect(result.html).not.toContain('onclick')
    expect(result.html).not.toContain('javascript:')
  })
})

describe('render — node-kind dispatch exhaustiveness', () => {
  it('warns UNKNOWN_NODE + skips instead of throwing', () => {
    const tree = [
      { id: 'w1', kind: 'watermark', attrs: {} },
      { id: 't1', kind: 'text', attrs: { html: '<p>Kept</p>' } },
    ]
    const result = render(tree as any, {}, {})
    expect(result.html).toContain('Kept')
    expect(result.warnings.some((w) => w.code === 'UNKNOWN_NODE' && w.nodeId === 'w1')).toBe(true)
  })

  it('supports richtext + expression aliases', () => {
    const tree = [
      { id: 'r1', kind: 'richtext', attrs: { html: '<p>Rich {{data.x}}</p>' } },
      { id: 'e1', kind: 'expression', attrs: { expression: '{{data.x}}' } },
    ]
    const result = render(tree as any, { data: { x: 'V' } }, {})
    expect(result.html).toContain('Rich V')
    expect(result.html).toContain('V')
  })
})

describe('render — condition errors never crash (REQ-003)', () => {
  it('excludes the subtree + collects EXPR_ERROR on div-by-zero', () => {
    const tree = [
      {
        id: 'cond1',
        kind: 'condition',
        attrs: { expression: '{{data.a}} / {{data.b}} > 1' },
        children: [{ id: 't1', kind: 'text', attrs: { html: '<p>Shown</p>' } }],
      },
    ]
    const result = render(tree, { data: { a: 1, b: 0 } }, {})
    expect(result.html).not.toContain('Shown')
    expect(result.warnings.some((w) => w.code === 'EXPR_ERROR')).toBe(true)
  })
})

describe('render — images (BR-005)', () => {
  it('renders allowed storage URLs and placeholders for missing ones', () => {
    const tree = [
      { id: 'img1', kind: 'image', attrs: { src: '/api/storage/general/kop.png', alt: 'Kop' } },
      { id: 'img2', kind: 'image', attrs: { src: '', alt: 'Missing' } },
    ]
    const result = render(tree, {}, {})
    expect(result.html).toContain('/api/storage/general/kop.png')
    expect(result.html).toContain('render-image-missing')
    expect(result.warnings.some((w) => w.code === 'IMAGE_MISSING' && w.nodeId === 'img2')).toBe(true)
  })

  it('blocks javascript: image sources', () => {
    const tree = [{ id: 'img1', kind: 'image', attrs: { src: 'javascript:evil()', alt: 'X' } }]
    const result = render(tree, {}, {})
    expect(result.html).not.toContain('javascript:')
    expect(result.warnings.some((w) => w.code === 'IMAGE_MISSING')).toBe(true)
  })
})

describe('render — tables, page breaks, print CSS', () => {
  it('emits thead (Kop-friendly) + page-break + A4 print CSS', () => {
    const tree = [
      {
        id: 'tbl1',
        kind: 'table',
        attrs: { headers: ['NIP', 'Nama'], rows: [['{{data.nip}}', '{{data.nama}}']] },
      },
      { id: 'pb1', kind: 'page-break', attrs: {} },
    ]
    const result = render(tree, { data: { nip: '123', nama: 'Andi' } }, {})
    expect(result.html).toContain('<thead>')
    expect(result.html).toContain('page-break')
    expect(result.html).toContain('@page')
    expect(result.html).toContain('11pt')
    expect(result.html).toContain('123')
    expect(PRINT_CSS).toContain('table-header-group')
  })
})

describe('render — standalone collection components', () => {
  it('iterates one block per item with item.* scope', () => {
    const tree = [{ id: 'cc1', kind: 'component', attrs: { componentId: 9 } }]
    const snapshots: ComponentSnapshotLike[] = [
      {
        componentId: 9,
        content: '<p>{{nama}} ({{nip}})</p>',
        looping: true,
        requirements: [
          { name: 'nama', type: 'text' },
          { name: 'nip', type: 'text' },
        ],
      },
    ]
    const bindings: BindingLike[] = [
      { placementId: 'cc1', requirementName: 'nama', componentId: 9, source: 'global_table', sourceRef: 'item.nama' },
      { placementId: 'cc1', requirementName: 'nip', componentId: 9, source: 'global_table', sourceRef: 'item.nip' },
    ]
    const context = { items: pegawaiContext().data.pegawai, data: {} }
    // Collection source falls back through attrs-free scope: provide via items array.
    const treeWithItems = [
      { id: 'cc1', kind: 'component', attrs: { componentId: 9, items: context.items } },
    ]
    const result = render(treeWithItems, context, { componentSnapshots: snapshots, bindings })
    expect((result.html.match(/19800/g) ?? []).length).toBe(3)
    expect(tree).toHaveLength(1)
  })
})

describe('render — loop × condition × binding stage interplay', () => {
  it('filters collection rows by an item-scoped condition', () => {
    const tree = [
      {
        id: 'loop1',
        kind: 'loop',
        attrs: { source: { tableName: 'pegawai', mode: 'all' } },
        children: [
          {
            id: 'cond1',
            kind: 'condition',
            attrs: { expression: '{{item.jabatan}} == \'Kabag\'' },
            children: [{ id: 't1', kind: 'text', attrs: { html: '<p>{{item.nama}}</p>' } }],
          },
        ],
      },
    ]
    const result = render(tree, pegawaiContext(), {})
    expect(result.html).toContain('Citra')
    expect(result.html).not.toContain('Andi')
    expect(result.html).not.toContain('Budi')
  })
})

describe('render — timeout guard (BR-004)', () => {
  it('throws RenderTimeoutError once the deadline passes', () => {
    expect(() => render([{ id: 't1', kind: 'text', attrs: { html: 'x' } }], {}, { timeoutMs: -1 })).toThrow(
      RenderTimeoutError,
    )
  })
})

describe('render — timings + shell', () => {
  it('returns per-stage timings and a standalone document', () => {
    const result = render([{ id: 't1', kind: 'text', attrs: { html: '<p>Hi</p>' } }], {}, {})
    for (const stage of ['data', 'component', 'binding', 'loop', 'condition', 'html', 'total'] as const) {
      expect(typeof result.timings[stage]).toBe('number')
    }
    expect(result.html).toContain('<!DOCTYPE html>')
    expect(result.html).toContain('lbs-doc')
  })
})
