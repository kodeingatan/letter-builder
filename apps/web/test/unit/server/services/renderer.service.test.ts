import { describe, it, expect } from 'vitest'
import { RendererService, MAX_RENDER_NODES, MAX_REPEATER_ITEMS } from '../../../../server/services/renderer.service'
import type { DocNode } from '../../../../shared/types/document'

const skData = {
  employees: [
    { name: 'Afdal', nip: '199xxx', role: 'Programmer', trips: [{ city: 'Banda Aceh' }, { city: 'Medan' }] },
    { name: 'Budi', nip: '198xxx', role: 'Analis', trips: [{ city: 'Jakarta' }] },
  ],
  letter: { type: 'internal' },
}

const skTree: DocNode = {
  type: 'document',
  children: [
    { type: 'heading', props: { content: 'Surat Keputusan', level: 1 } },
    {
      type: 'repeater',
      props: { source: 'employees', item: 'employee' },
      children: [{ type: 'text', props: { content: '{{employee.name}}/{{employee.nip}}/{{employee.role}}' } }],
    },
  ],
}

describe('renderer.service — repeater SK (FR-003, AC-001)', () => {
  it('renders 2 employees in order', () => {
    const { html, warnings } = RendererService.render(skTree, skData)
    expect(warnings).toEqual([])
    expect(html).toContain('Afdal/199xxx/Programmer')
    expect(html).toContain('Budi/198xxx/Analis')
    expect(html.indexOf('Afdal')).toBeLessThan(html.indexOf('Budi'))
  })

  it('nested repeater renders trips under the right owner (AC-003)', () => {
    const tree: DocNode = {
      type: 'document',
      children: [{
        type: 'repeater',
        props: { source: 'employees', item: 'employee' },
        children: [
          { type: 'text', props: { content: '{{employee.name}}' } },
          {
            type: 'repeater',
            props: { source: 'employee.trips', item: 'trip' },
            children: [{ type: 'text', props: { content: '- {{trip.city}}' } }],
          },
        ],
      }],
    }
    const { html } = RendererService.render(tree, skData)
    expect(html).toContain('- Banda Aceh')
    expect(html).toContain('- Medan')
    // Medan belongs to Afdal's block (before Budi), Jakarta to Budi's
    expect(html.indexOf('Medan')).toBeLessThan(html.indexOf('Budi'))
    expect(html.indexOf('Jakarta')).toBeGreaterThan(html.indexOf('Budi'))
  })

  it('empty / non-array source renders comment, not throw (ALT-01, BR-003)', () => {
    const { html } = RendererService.render(skTree, { employees: [] })
    expect(html).toContain('empty repeater')
    const nonArray = RendererService.render(skTree, { employees: 'nope' })
    expect(nonArray.html).toContain('empty repeater')
  })

  it('caps items per level at 500 + warning (EC-02)', () => {
    const big = Array.from({ length: 600 }, (_, i) => ({ name: `P${i}` }))
    const { html, warnings } = RendererService.render(skTree, { employees: big })
    expect(html).toContain('P499')
    expect(html).not.toContain('P500')
    expect(warnings.some((w) => w.includes('truncated'))).toBe(true)
    expect(MAX_REPEATER_ITEMS).toBe(500)
  })
})

describe('renderer.service — condition (FR-004, AC-002)', () => {
  const tree: DocNode = {
    type: 'document',
    children: [{
      type: 'condition',
      props: { field: '{{letter.type}}', operator: 'eq', value: 'internal' },
      children: [{ type: 'text', props: { content: 'INTERNAL' } }],
      elseChildren: [{ type: 'text', props: { content: 'EKSTERNAL' } }],
    }],
  }

  it('shows branch when true', () => {
    const { html } = RendererService.render(tree, { letter: { type: 'internal' } })
    expect(html).toContain('INTERNAL')
    expect(html).not.toContain('EKSTERNAL')
  })

  it('shows elseChildren when false', () => {
    const { html } = RendererService.render(tree, { letter: { type: 'eksternal' } })
    expect(html).toContain('EKSTERNAL')
    expect(html).not.toContain('INTERNAL')
  })
})

describe('renderer.service — XSS & binding safety (FR-006, AC-004)', () => {
  it('escapes injected HTML in bindings (EC-03)', () => {
    const { html } = RendererService.render(
      { type: 'text', props: { content: 'Hi {{name}}' } },
      { name: '<script>alert(1)</script>' },
    )
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>alert')
  })

  it('missing binding renders empty (ALT-02)', () => {
    const { html } = RendererService.render(
      { type: 'text', props: { content: 'Hi {{ghost.name}}!' } },
      {},
    )
    expect(html).toContain('Hi !')
  })

  it('sanitizes richtext repeater headers', () => {
    const tree: DocNode = {
      type: 'repeater',
      props: { source: 'employees', item: 'e', header: '<p>OK</p><script>evil()</script>' },
      children: [{ type: 'text', props: { content: '{{e.name}}' } }],
    }
    const { html } = RendererService.render(tree, { employees: [{ name: 'A' }] })
    expect(html).toContain('<p>OK</p>')
    expect(html).not.toContain('<script>')
  })

  it('blocks non-allowlisted image URLs (DR-003)', () => {
    const { html, warnings } = RendererService.render(
      { type: 'image', props: { src: 'http://evil/x.png' } },
      {},
    )
    expect(html).toContain('blocked image url')
    expect(warnings.length).toBeGreaterThan(0)
    const ok = RendererService.render(
      { type: 'image', props: { src: 'https://example.com/x.png' } },
      {},
    )
    expect(ok.html).toContain('<img')
  })
})

describe('renderer.service — component-ref, caps, purity (FR-005, BR-001, INV)', () => {
  it('resolves component-ref 1 level with propsOverride', () => {
    const { html } = RendererService.render(
      { type: 'component-ref', props: { componentId: 'kop', propsOverride: { city: 'Banda Aceh' } } },
      {},
      { components: { kop: { type: 'text', props: { content: 'KOP {{city}}' } } } },
    )
    expect(html).toContain('KOP Banda Aceh')
  })

  it('rejects cyclic component-ref (DR-002)', () => {
    const loop: DocNode = { type: 'component-ref', props: { componentId: 'a' } }
    const { html, warnings } = RendererService.render(loop, {}, { components: { a: loop } })
    expect(html).toContain('cyclic component-ref')
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('truncates runtime expansion beyond 10000 nodes', () => {
    const kids: DocNode[] = Array.from({ length: MAX_RENDER_NODES + 10 }, (_, i) => ({
      type: 'text', props: { content: `n${i}` },
    }))
    const { html, warnings } = RendererService.render({ type: 'document', children: kids }, {})
    expect(html).toContain('node cap exceeded')
    expect(warnings.some((w) => w.includes('Node cap'))).toBe(true)
  })

  it('never mutates the input tree (INV-002) and always returns doc-page (INV-001)', () => {
    const frozen = JSON.parse(JSON.stringify(skTree)) as DocNode
    const { html } = RendererService.render(skTree, skData)
    expect(html.startsWith('<div class="doc-page">')).toBe(true)
    expect(skTree).toEqual(frozen)
  })

  it('renders qr placeholder + pagebreak + signature blocks', () => {
    const { html } = RendererService.render({
      type: 'document',
      children: [
        { type: 'qrcode', props: { payload: 'ABC' } },
        { type: 'pagebreak' },
        { type: 'signature', props: { name: 'Afdal', title: 'Kadis', city: 'Banda Aceh' } },
      ],
    }, {})
    expect(html).toContain('data-qr="ABC"')
    expect(html).toContain('doc-pagebreak')
    expect(html).toContain('Afdal')
  })
})
