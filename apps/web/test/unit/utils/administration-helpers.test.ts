import { describe, it, expect } from 'vitest'
import {
  normalizeStepOrder,
  parseStepFields,
  stepHasDataPath,
  validatePublishSteps,
  validateStepFields,
} from '../../../server/utils/administration-helpers'

describe('validateStepFields', () => {
  it('accepts empty field lists', () => {
    expect(validateStepFields([])).toEqual([])
    expect(validateStepFields(null)).toEqual([])
    expect(validateStepFields(undefined)).toEqual([])
  })

  it('accepts valid lite fields', () => {
    expect(
      validateStepFields([
        { name: 'nama_pegawai', label: 'Nama Pegawai', type: 'text', required: true },
        { name: 'golongan', label: 'Golongan', type: 'select', required: false, options: ['III/a', 'III/b'] },
      ]),
    ).toEqual([])
  })

  it('rejects non-snake_case names', () => {
    const issues = validateStepFields([{ name: 'Nama Pegawai', label: 'X', type: 'text' }])
    expect(issues.length).toBe(1)
    expect(issues[0]).toMatch(/snake_case/)
  })

  it('rejects duplicate names (exact match)', () => {
    const issues = validateStepFields([
      { name: 'nip', label: 'NIP', type: 'text' },
      { name: 'nip', label: 'NIP 2', type: 'text' },
    ])
    expect(issues.some((i) => i.includes('Duplicate field name'))).toBe(true)
  })

  it('rejects relation and computed types', () => {
    for (const type of ['select-table-relation', 'select-table-relation-multiple', 'hidden-computed', 'readonly-computed']) {
      const issues = validateStepFields([{ name: 'f', label: 'F', type }])
      expect(issues.some((i) => i.includes('unsupported type'))).toBe(true)
    }
  })

  it('requires options for select fields', () => {
    expect(
      validateStepFields([{ name: 'gol', label: 'Gol', type: 'select', options: [] }]).length,
    ).toBe(1)
    expect(
      validateStepFields([{ name: 'gol', label: 'Gol', type: 'select', options: ['A'] }]),
    ).toEqual([])
  })

  it('requires a label', () => {
    const issues = validateStepFields([{ name: 'nip', label: '  ', type: 'text' }])
    expect(issues.some((i) => i.includes('requires a label'))).toBe(true)
  })
})

describe('stepHasDataPath', () => {
  it('template pins count as a data path', () => {
    expect(stepHasDataPath({ name: 'S', templateId: 3, templateVersion: 'latest' })).toBe(true)
  })

  it('local fields count as a data path', () => {
    expect(stepHasDataPath({ name: 'S', fields: [{ name: 'nip', label: 'NIP', type: 'text' }] })).toBe(true)
  })

  it('neither template nor fields has no data path', () => {
    expect(stepHasDataPath({ name: 'S', fields: [] })).toBe(false)
    expect(stepHasDataPath({ name: 'S' })).toBe(false)
  })
})

describe('validatePublishSteps', () => {
  it('rejects empty workflows', () => {
    const issues = validatePublishSteps([])
    expect(issues.length).toBe(1)
    expect(issues[0].message).toMatch(/at least one step/)
  })

  it('names the step that has neither template nor fields (AC-002)', () => {
    const issues = validatePublishSteps([
      { name: 'Data Pegawai', fields: [{ name: 'nip', label: 'NIP', type: 'text' }] },
      { name: 'Surat Tugas', templateId: 1, templateVersion: 'latest' },
      { name: 'Empty Step', fields: [] },
    ])
    expect(issues.length).toBe(1)
    expect(issues[0].stepName).toBe('Empty Step')
    expect(issues[0].message).toContain('Empty Step')
  })

  it('accepts multi-template workflows (AC-001)', () => {
    const issues = validatePublishSteps([
      { name: 'Surat Tugas', templateId: 1, templateVersion: '1' },
      { name: 'SPD', templateId: 2, templateVersion: 'latest' },
      { name: 'Rincian Biaya', templateId: 3, templateVersion: '2' },
      { name: 'Laporan', templateId: 4, templateVersion: 'latest' },
    ])
    expect(issues).toEqual([])
  })

  it('requires a version for template pins', () => {
    const issues = validatePublishSteps([{ name: 'S', templateId: 1, templateVersion: '' }])
    expect(issues.some((i) => i.message.includes('no version'))).toBe(true)
  })
})

describe('normalizeStepOrder', () => {
  it('assigns dense 1..N order by array position (AC-005)', () => {
    const ordered = normalizeStepOrder([{ name: 'B' }, { name: 'A' }, { name: 'C' }])
    expect(ordered.map((s) => s.order)).toEqual([1, 2, 3])
    expect(ordered.map((s) => s.name)).toEqual(['B', 'A', 'C'])
  })
})

describe('parseStepFields', () => {
  it('parses JSON strings and passes arrays through', () => {
    expect(parseStepFields(JSON.stringify([{ name: 'a' }]))).toEqual([{ name: 'a' }])
    expect(parseStepFields(null)).toEqual([])
    expect(parseStepFields('not-json')).toEqual([])
  })
})
