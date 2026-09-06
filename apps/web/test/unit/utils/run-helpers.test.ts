import { describe, it, expect } from 'vitest'
import {
  buildStepSkeletons,
  parseResolvedPins,
  parseStepDataMap,
  resolvePins,
  stepStatus,
  validateAllSteps,
  validateStepFieldValues,
} from '../../../server/utils/run-helpers'

const steps = [
  {
    id: 1,
    name: 'Data perjalanan',
    order: 1,
    templateId: 7,
    templateVersion: 'latest',
    fields: [
      { name: 'tujuan', label: 'Tujuan', type: 'text', required: true },
      { name: 'biaya', label: 'Biaya', type: 'number', required: false },
    ],
  },
  {
    id: 2,
    name: 'Persetujuan',
    order: 2,
    templateId: 9,
    templateVersion: '2',
    fields: [{ name: 'tanggal', label: 'Tanggal', type: 'date', required: true }],
  },
  {
    id: 3,
    name: 'Catatan',
    order: 3,
    templateId: null,
    templateVersion: null,
    fields: [{ name: 'golongan', label: 'Golongan', type: 'select', required: false, options: ['III/a', 'III/b'] }],
  },
]

describe('parseResolvedPins', () => {
  it('parses frozen pins', () => {
    const pins = parseResolvedPins(JSON.stringify([{ stepId: 1, templateId: 7, version: '3' }]))
    expect(pins).toEqual([{ stepId: 1, templateId: 7, version: '3' }])
  })

  it('yields [] for corrupt payloads', () => {
    expect(parseResolvedPins('not-json')).toEqual([])
    expect(parseResolvedPins(null)).toEqual([])
    expect(parseResolvedPins(JSON.stringify({ nope: true }))).toEqual([])
  })
})

describe('parseStepDataMap', () => {
  it('parses the step data map', () => {
    const map = parseStepDataMap(JSON.stringify({ 1: { fields: { a: 1 }, rowSelections: {}, manualInputs: {} } }))
    expect(map['1'].fields).toEqual({ a: 1 })
  })

  it('yields {} for corrupt payloads', () => {
    expect(parseStepDataMap('{{{')).toEqual({})
    expect(parseStepDataMap(null)).toEqual({})
    expect(parseStepDataMap(JSON.stringify([1, 2]))).toEqual({})
  })
})

describe('buildStepSkeletons', () => {
  it('creates an empty slot per step', () => {
    const map = buildStepSkeletons(steps)
    expect(Object.keys(map).sort()).toEqual(['1', '2', '3'])
    expect(map['1']).toEqual({ fields: {}, rowSelections: {}, manualInputs: {} })
  })

  it('seeds manual slots as empty manualInputs keys', () => {
    const map = buildStepSkeletons(steps, { 1: ['nodeA.title', 'nodeA.body'] })
    expect(map['1'].manualInputs).toEqual({ 'nodeA.title': null, 'nodeA.body': null })
    expect(map['2'].manualInputs).toEqual({})
  })
})

describe('resolvePins', () => {
  it('freezes latest against live versions', () => {
    expect(resolvePins(steps, { 7: 3, 9: 2 })).toEqual([
      { stepId: 1, templateId: 7, version: '3' },
      { stepId: 2, templateId: 9, version: '2' },
    ])
  })

  it('keeps latest intent when the template is unknown', () => {
    expect(resolvePins(steps, {})).toEqual([
      { stepId: 1, templateId: 7, version: 'latest' },
      { stepId: 2, templateId: 9, version: '2' },
    ])
  })

  it('skips steps without a template', () => {
    expect(resolvePins([steps[2]], {})).toEqual([])
  })
})

describe('validateStepFieldValues', () => {
  it('passes valid values', () => {
    expect(validateStepFieldValues(steps[0], { tujuan: 'Jakarta', biaya: 1500000 })).toEqual([])
  })

  it('flags missing required fields (AC-002)', () => {
    const issues = validateStepFieldValues(steps[0], { biaya: 10 })
    expect(issues.length).toBe(1)
    expect(issues[0]).toMatch(/Tujuan.*required/)
  })

  it('flags non-numeric values', () => {
    expect(validateStepFieldValues(steps[0], { tujuan: 'x', biaya: 'banyak' }).length).toBe(1)
  })

  it('accepts numeric strings for number fields', () => {
    expect(validateStepFieldValues(steps[0], { tujuan: 'x', biaya: '1500' })).toEqual([])
  })

  it('flags invalid dates and off-option selects', () => {
    expect(validateStepFieldValues(steps[1], { tanggal: 'kemarin' }).length).toBe(1)
    expect(validateStepFieldValues(steps[2], { golongan: 'IV/a' }).length).toBe(1)
    expect(validateStepFieldValues(steps[2], { golongan: 'III/a' })).toEqual([])
  })
})

describe('validateAllSteps', () => {
  it('returns per-step problems for completion', () => {
    const problems = validateAllSteps(steps, {
      1: { fields: { tujuan: 'Jakarta' }, rowSelections: {}, manualInputs: {} },
      2: { fields: {}, rowSelections: {}, manualInputs: {} },
      3: { fields: {}, rowSelections: {}, manualInputs: {} },
    })
    expect(problems.map((p) => p.stepId)).toEqual([2])
  })

  it('is empty when everything validates', () => {
    const problems = validateAllSteps(steps, {
      1: { fields: { tujuan: 'Jakarta' }, rowSelections: {}, manualInputs: {} },
      2: { fields: { tanggal: '2026-09-01' }, rowSelections: {}, manualInputs: {} },
      3: { fields: {}, rowSelections: {}, manualInputs: {} },
    })
    expect(problems).toEqual([])
  })
})

describe('stepStatus', () => {
  it('is pending when untouched, done when valid, invalid when broken', () => {
    expect(stepStatus(steps[0], undefined)).toBe('pending')
    expect(stepStatus(steps[0], { fields: {}, rowSelections: {}, manualInputs: {} })).toBe('pending')
    expect(
      stepStatus(steps[0], { fields: { tujuan: 'Jakarta' }, rowSelections: {}, manualInputs: {} }),
    ).toBe('done')
    expect(
      stepStatus(steps[0], { fields: { biaya: 'x' }, rowSelections: {}, manualInputs: {} }),
    ).toBe('invalid')
  })
})
