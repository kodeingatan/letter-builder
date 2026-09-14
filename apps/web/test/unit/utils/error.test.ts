import { describe, it, expect } from 'vitest'
import { getErrorMessage, isConflictError, getConflictReferences, getConflictData, extractErrorData } from '../../../app/utils/error'

describe('getErrorMessage', () => {
  it('extracts message from Error object', () => {
    expect(getErrorMessage(new Error('test error'), 'fallback')).toBe('test error')
  })

  it('returns fallback for null error', () => {
    expect(getErrorMessage(null, 'fallback')).toBe('fallback')
  })

  it('returns fallback for undefined error', () => {
    expect(getErrorMessage(undefined, 'fallback')).toBe('fallback')
  })

  it('extracts message from response.data.message', () => {
    const error = { response: { data: { message: 'server error' } } }
    expect(getErrorMessage(error, 'fallback')).toBe('server error')
  })

  it('joins array messages', () => {
    const error = { response: { data: { message: ['error 1', 'error 2'] } } }
    expect(getErrorMessage(error, 'fallback')).toBe('error 1. error 2')
  })

  it('uses error.message as secondary fallback', () => {
    const error = { message: 'custom message' }
    expect(getErrorMessage(error, 'fallback')).toBe('custom message')
  })

  it('returns default fallback when no args', () => {
    expect(getErrorMessage(null)).toBe('An error occurred')
  })
})

describe('isConflictError (UT-06, 409 extractor)', () => {
  it('detects 409 via response.status', () => {
    expect(isConflictError({ response: { status: 409 } })).toBe(true)
  })
  it('detects 409 via statusCode', () => {
    expect(isConflictError({ statusCode: 409 })).toBe(true)
  })
  it('detects 409 via response.data.statusCode', () => {
    expect(isConflictError({ response: { data: { statusCode: 409 } } })).toBe(true)
  })
  it('returns false for 400', () => {
    expect(isConflictError({ response: { status: 409 } })).toBe(true)
    expect(isConflictError({ response: { status: 400 } })).toBe(false)
    expect(isConflictError({ message: 'ok' })).toBe(false)
  })
})

describe('getConflictReferences (UT-06)', () => {
  it('extracts via response.data.data.references', () => {
    const e = { response: { data: { data: { references: ['template:SK'] } } } }
    expect(getConflictReferences(e)).toEqual(['template:SK'])
  })
  it('extracts via response.data.references', () => {
    const e = { response: { data: { references: ['a', 'b'] } } }
    expect(getConflictReferences(e)).toEqual(['a', 'b'])
  })
  it('extracts via e.data.data.references ($fetch)', () => {
    const e = { data: { data: { references: ['x'] } } }
    expect(getConflictReferences(e)).toEqual(['x'])
  })
  it('extracts via e.data.references ($fetch direct)', () => {
    const e = { data: { references: ['y'] } }
    expect(getConflictReferences(e)).toEqual(['y'])
  })
  it('returns null when no references', () => {
    expect(getConflictReferences({ response: { data: { data: { steps: 2 } } } })).toBeNull()
    expect(getConflictReferences(null)).toBeNull()
  })
})

describe('getConflictData (UT-06)', () => {
  it('extracts steps/administrations', () => {
    const e = { response: { data: { data: { steps: 2, administrations: [5] } } } }
    expect(getConflictData(e)).toEqual({ steps: 2, administrations: [5] })
  })
  it('extracts references', () => {
    const e = { response: { data: { data: { references: ['a'] } } } }
    expect(getConflictData(e)).toEqual({ references: ['a'] })
  })
  it('returns null for non-object', () => {
    expect(getConflictData(null)).toBeNull()
  })
})

describe('extractErrorData (UT-06)', () => {
  it('extracts generic data via response.data.data', () => {
    const e = { response: { data: { data: { foo: 1 } } } }
    expect(extractErrorData(e)).toEqual({ foo: 1 })
  })
  it('falls back to response.data', () => {
    const e = { response: { data: { foo: 2 } } }
    expect(extractErrorData(e)).toEqual({ foo: 2 })
  })
  it('handles $fetch data shape', () => {
    const e = { data: { foo: 3 } }
    expect(extractErrorData(e)).toEqual({ foo: 3 })
  })
})
