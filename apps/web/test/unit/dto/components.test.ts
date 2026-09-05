import { describe, it, expect } from 'vitest'
import {
  CreateComponentSchema,
  UpdateComponentSchema,
  ComponentQuerySchema,
  PreviewComponentSchema,
} from '../../../server/dto/components.dto'
import {
  extractPlaceholders,
  validatePlaceholders,
  renderContent,
  renderPreview,
  sampleValueForType,
} from '../../../server/utils/component-helpers'

describe('CreateComponentSchema', () => {
  it('accepts a valid component with nested requirements', () => {
    const parsed = CreateComponentSchema.safeParse({
      name: 'Identitas Pegawai',
      content: '<p>{{nama}} — {{nip}} ({{jabatan}})</p>',
      looping: false,
      requirements: [
        { name: 'nama', type: 'text' },
        { name: 'nip', type: 'text' },
        { name: 'jabatan', type: 'text' },
      ],
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects empty or overlong names (BR-001)', () => {
    expect(CreateComponentSchema.safeParse({ name: '' }).success).toBe(false)
    expect(CreateComponentSchema.safeParse({ name: 'x'.repeat(101) }).success).toBe(false)
  })

  it('rejects non-snake_case requirement names (BR-002)', () => {
    for (const name of ['Nama', '1nip', 'nama-pegawai', 'nama pegawai', '']) {
      const parsed = CreateComponentSchema.safeParse({ name: 'X', requirements: [{ name, type: 'text' }] })
      expect(parsed.success).toBe(false)
    }
  })

  it('rejects unknown requirement types (BR-002)', () => {
    const parsed = CreateComponentSchema.safeParse({
      name: 'X',
      requirements: [{ name: 'foto', type: 'file' }],
    })
    expect(parsed.success).toBe(false)
  })

  it('defaults looping to false and requirements to []', () => {
    const parsed = CreateComponentSchema.safeParse({ name: 'Kop Surat' })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.looping).toBe(false)
      expect(parsed.data.requirements).toEqual([])
    }
  })
})

describe('UpdateComponentSchema', () => {
  it('accepts partial updates', () => {
    expect(UpdateComponentSchema.safeParse({ content: '<p>hi</p>' }).success).toBe(true)
    expect(UpdateComponentSchema.safeParse({ looping: true }).success).toBe(true)
  })
})

describe('ComponentQuerySchema', () => {
  it('applies pagination defaults', () => {
    const parsed = ComponentQuerySchema.safeParse({})
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.page).toBe(1)
      expect(parsed.data.limit).toBe(20)
    }
  })
})

describe('PreviewComponentSchema', () => {
  it('accepts samples and items overrides', () => {
    const parsed = PreviewComponentSchema.safeParse({
      samples: { nama: 'Budi' },
      items: [{ nama: 'A' }, { nama: 'B' }, { nama: 'C' }],
    })
    expect(parsed.success).toBe(true)
  })
})

describe('extractPlaceholders', () => {
  it('extracts unique names in order, tolerating whitespace', () => {
    expect(extractPlaceholders('<p>{{nama}} — {{ nip }} ({{jabatan}}) {{nama}}</p>')).toEqual([
      'nama',
      'nip',
      'jabatan',
    ])
  })

  it('returns [] for empty content', () => {
    expect(extractPlaceholders(null)).toEqual([])
    expect(extractPlaceholders('no placeholders')).toEqual([])
  })
})

describe('validatePlaceholders (BR-003)', () => {
  const reqs = [{ name: 'nama', type: 'text' }, { name: 'nip', type: 'text' }]

  it('passes when every placeholder is declared (AC-001)', () => {
    expect(validatePlaceholders('<p>{{nama}} {{nip}}</p>', reqs)).toEqual({ unknown: [], unused: [] })
  })

  it('reports unknown placeholders that must block the save (AC-002)', () => {
    expect(validatePlaceholders('<p>{{nama}} {{unknown}}</p>', reqs).unknown).toEqual(['unknown'])
  })

  it('warns (not blocks) on unused declared requirements', () => {
    expect(validatePlaceholders('<p>{{nama}}</p>', reqs).unused).toEqual(['nip'])
  })
})

describe('sampleValueForType (REQ-004)', () => {
  it('generates a sample per type', () => {
    expect(sampleValueForType('text', 'nama')).toContain('nama')
    expect(sampleValueForType('number', 'n')).toBe('123')
    expect(sampleValueForType('date', 'd')).toBe('2026-01-01')
    expect(sampleValueForType('image', 'foto')).toContain('<img')
    expect(sampleValueForType('richtext', 'r')).toContain('<p>')
  })
})

describe('renderPreview', () => {
  const reqs = [
    { name: 'nama', type: 'text' },
    { name: 'nip', type: 'text' },
    { name: 'jabatan', type: 'text' },
  ]
  const content = '<p>{{nama}} — {{nip}} ({{jabatan}})</p>'

  it('renders sample values in single mode (AC-001)', () => {
    const { html } = renderPreview(content, reqs, false)
    expect(html).toContain('Contoh nama')
    expect(html).not.toContain('{{nama}}')
  })

  it('honours explicit sample overrides', () => {
    const { html } = renderPreview(content, reqs, false, { nama: 'Budi' })
    expect(html).toContain('Budi')
  })

  it('renders one block per item in collection mode (AC-005)', () => {
    const { html, blockCount } = renderPreview(content, reqs, true, {}, [
      { nama: 'A', nip: '1', jabatan: 'X' },
      { nama: 'B', nip: '2', jabatan: 'Y' },
      { nama: 'C', nip: '3', jabatan: 'Z' },
    ])
    expect(blockCount).toBe(3)
    expect(html).toContain('>A —')
    expect(html).toContain('>B —')
    expect(html).toContain('>C —')
  })

  it('falls back to a single auto-sampled block when items are empty', () => {
    const { blockCount } = renderPreview(content, reqs, true)
    expect(blockCount).toBe(1)
  })

  it('leaves non-placeholder HTML untouched', () => {
    expect(renderContent('<b>static</b>', [], {})).toBe('<b>static</b>')
  })
})
