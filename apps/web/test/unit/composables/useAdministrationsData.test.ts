import { describe, it, expect } from 'vitest'
import {
  emptyStep,
  moveStep,
  stepHasDataPath,
  validateClientSteps,
  validateClientStepFields,
} from '../../../app/composables/useAdministrationsData'

describe('validateClientStepFields', () => {
  it('mirrors server rules: snake_case, uniqueness, select options', () => {
    expect(validateClientStepFields([{ name: 'nip', label: 'NIP', type: 'text', required: true }])).toEqual([])
    expect(validateClientStepFields([{ name: 'Bad Name', label: 'X', type: 'text', required: false }]).length).toBe(1)
    expect(
      validateClientStepFields([
        { name: 'a', label: 'A', type: 'text', required: false },
        { name: 'a', label: 'B', type: 'text', required: false },
      ]).length,
    ).toBe(1)
    expect(
      validateClientStepFields([{ name: 'g', label: 'G', type: 'select', required: false, options: [] }]).length,
    ).toBe(1)
  })
})

describe('validateClientSteps', () => {
  it('blocks publish on empty workflows and empty steps', () => {
    expect(validateClientSteps([]).length).toBe(1)
    expect(validateClientSteps([emptyStep()]).length).toBeGreaterThan(0)
  })

  it('accepts mixed template + field steps', () => {
    expect(
      validateClientSteps([
        { name: 'Data', fields: [{ name: 'nip', label: 'NIP', type: 'text', required: true }] },
        { name: 'Doc', templateId: 1, templateVersion: 'latest', fields: [] },
      ]),
    ).toEqual([])
  })

  it('stepHasDataPath matches publish gating', () => {
    expect(stepHasDataPath(emptyStep())).toBe(false)
    expect(stepHasDataPath({ ...emptyStep(), templateId: 2, templateVersion: '1' })).toBe(true)
  })
})

describe('moveStep', () => {
  it('reorders by index and ignores out-of-range moves', () => {
    expect(moveStep(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
    expect(moveStep(['a', 'b'], 0, 5)).toEqual(['a', 'b'])
  })
})
