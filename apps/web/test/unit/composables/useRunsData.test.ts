import { describe, it, expect } from 'vitest'
import {
  clientCompletionBlockers,
  clientStepStatus,
  validateClientStepValues,
} from '../../../app/composables/useRunsData'
import type { RunStep } from '../../../shared/types/run'

const step: RunStep = {
  id: 1,
  administrationId: 1,
  order: 1,
  name: 'Data perjalanan',
  templateId: 7,
  templateVersion: 'latest',
  fields: [
    { name: 'tujuan', label: 'Tujuan', type: 'text', required: true },
    { name: 'biaya', label: 'Biaya', type: 'number', required: false },
  ],
}

describe('validateClientStepValues', () => {
  it('blocks Next on missing required field without data loss semantics', () => {
    const issues = validateClientStepValues(step, {})
    expect(issues.length).toBe(1)
    expect(issues[0]).toMatch(/Tujuan.*required/)
  })

  it('accepts valid values', () => {
    expect(validateClientStepValues(step, { tujuan: 'Jakarta', biaya: 100 })).toEqual([])
  })
})

describe('clientStepStatus', () => {
  it('maps untouched/valid/invalid to pending/done/invalid', () => {
    expect(clientStepStatus(step, undefined)).toBe('pending')
    expect(clientStepStatus(step, { fields: { tujuan: 'x' }, rowSelections: {}, manualInputs: {} })).toBe('done')
    expect(clientStepStatus(step, { fields: {}, rowSelections: {}, manualInputs: {} })).toBe('pending')
  })

  it('treats filled manual inputs as touched', () => {
    expect(
      clientStepStatus(step, { fields: {}, rowSelections: {}, manualInputs: { 'n.title': 'halo' } }),
    ).toBe('invalid')
  })
})

describe('clientCompletionBlockers', () => {
  it('lists every invalid step', () => {
    const blockers = clientCompletionBlockers([step], { 1: { fields: {}, rowSelections: {}, manualInputs: {} } })
    expect(blockers.map((b) => b.stepId)).toEqual([1])
    expect(clientCompletionBlockers([step], { 1: { fields: { tujuan: 'x' }, rowSelections: {}, manualInputs: {} } })).toEqual([])
  })
})
