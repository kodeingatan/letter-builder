import { describe, it, expect } from 'vitest'
import { TiptapConverterService } from '../../../../server/services/tiptap-converter.service'

const kopTiptap = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'KOP' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Kantor ' },
        { type: 'docBinding', attrs: { name: 'kantor', target: 'office.app_name', view: 'text' } },
      ],
    },
  ],
}

describe('tiptap-converter — toDocNode (UT-01, FR-001/004)', () => {
  it('maps heading/paragraph + text binding (AC-001)', () => {
    const tree = TiptapConverterService.toDocNode(kopTiptap)
    expect(tree.type).toBe('document')
    expect(tree.children?.[0]).toMatchObject({ type: 'heading', props: { content: 'KOP', level: 2 } })
    expect(tree.children?.[1]).toMatchObject({ type: 'paragraph', props: { content: 'Kantor {{office.app_name}}' } })
  })

  it('maps binding views: image → image node, component → component-ref', () => {
    const tree = TiptapConverterService.toDocNode({
      type: 'doc',
      content: [
        { type: 'docBinding', attrs: { name: 'logo', target: 'office.logo', view: 'image' } },
        { type: 'docBinding', attrs: { name: 'card', target: '', view: 'component', component: 'EmployeeCard' } },
      ],
    })
    expect(tree.children?.[0]).toMatchObject({ type: 'image', props: { src: '{{office.logo}}' } })
    expect(tree.children?.[1]).toMatchObject({ type: 'component-ref', props: { componentId: 'EmployeeCard' } })
  })

  it('maps repeater + condition containers (AC-003)', () => {
    const tree = TiptapConverterService.toDocNode({
      type: 'doc',
      content: [
        {
          type: 'docRepeater', attrs: { source: 'employees', item: 'item' },
          content: [{ type: 'paragraph', content: [{ type: 'docBinding', attrs: { name: 'n', target: 'item.nama', view: 'text' } }] }],
        },
        {
          type: 'docCondition', attrs: { field: '{{letter.type}}', operator: 'eq', value: 'internal' },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'IN' }] }],
        },
      ],
    })
    expect(tree.children?.[0]).toMatchObject({ type: 'repeater', props: { source: 'employees', item: 'item' } })
    expect(tree.children?.[1]).toMatchObject({ type: 'condition', props: { field: '{{letter.type}}', operator: 'eq' } })
  })

  it('flattens tables to paragraphs and degrades unknown blocks', () => {
    const tree = TiptapConverterService.toDocNode({
      type: 'doc',
      content: [
        {
          type: 'table',
          content: [{ type: 'tableRow', content: [{ type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A1' }] }] }] }],
        },
        { type: 'mystery', content: [{ type: 'text', text: 'xyz' }] },
      ],
    })
    expect(JSON.stringify(tree)).toContain('A1')
    expect(JSON.stringify(tree)).toContain('xyz')
  })

  it('rejects non-doc roots', () => {
    expect(() => TiptapConverterService.toDocNode({ type: 'paragraph' })).toThrow(/root must be/)
  })
})

describe('tiptap-converter — round trip + requirements (UT-01)', () => {
  it('toTiptap restores bindings as docBinding nodes', () => {
    const tree = TiptapConverterService.toDocNode(kopTiptap)
    const back = TiptapConverterService.toTiptap(tree) as { content: Array<{ content?: unknown[] }> }
    expect(JSON.stringify(back)).toContain('docBinding')
    const again = TiptapConverterService.toDocNode(back)
    expect(again).toEqual(tree)
  })

  it('scanRequirements marks repeater scope (FR-005)', () => {
    const reqs = TiptapConverterService.scanRequirements({
      type: 'document',
      children: [
        { type: 'text', props: { content: 'No {{letter.number}}' } },
        {
          type: 'repeater', props: { source: 'employees', item: 'item' },
          children: [{ type: 'text', props: { content: '{{item.nama}}' } }],
        },
        { type: 'text', props: { content: '{{current_date}}' } },
      ],
    })
    expect(reqs).toContainEqual({ path: 'letter.number', scoped: false })
    expect(reqs).toContainEqual({ path: 'item.nama', scoped: true })
    expect(reqs.some((r) => r.path === 'current_date')).toBe(false)
  })

  it('extractBindings lists binding specs (BR-003 helper)', () => {
    const specs = TiptapConverterService.extractBindings(kopTiptap)
    expect(specs).toEqual([{ name: 'kantor', target: 'office.app_name', view: 'text' }])
  })
})

describe('tiptap-converter — resolveMapping (UT-01)', () => {
  const ctx = {
    data: { step1: { nomor: '800/1' } },
    system: { current_date: '2026-09-13' },
    masterCell: async (t: string, c: string, id: number) => `${t}.${c}#${id}`,
    masterList: async (t: string) => [{ t }],
  }

  it('resolves all 5 kinds', async () => {
    const r = TiptapConverterService.resolveMapping
    expect(await r({ kind: 'value', ref: 'X' }, ctx)).toBe('X')
    expect(await r({ kind: 'field', ref: 'step1.nomor' }, ctx)).toBe('800/1')
    expect(await r({ kind: 'system', ref: 'current_date' }, ctx)).toBe('2026-09-13')
    expect(await r({ kind: 'master-cell', ref: 'pegawai.nama#3' }, ctx)).toBe('pegawai.nama#3')
    expect(await r({ kind: 'master-list', ref: 'pegawai' }, ctx)).toEqual([{ t: 'pegawai' }])
  })

  it('rejects malformed refs and unknown kinds', async () => {
    const r = TiptapConverterService.resolveMapping
    await expect(r({ kind: 'master-cell', ref: 'nope' }, ctx)).rejects.toThrow(/master-cell/)
    await expect(r({ kind: 'master-list', ref: 'a-b' }, ctx)).rejects.toThrow(/master-list/)
    await expect(r({ kind: 'bogus', ref: 'x' }, ctx)).rejects.toThrow(/Unknown mapping kind/)
  })
})
