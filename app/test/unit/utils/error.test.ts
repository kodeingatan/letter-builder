import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '../../../app/utils/error'

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
