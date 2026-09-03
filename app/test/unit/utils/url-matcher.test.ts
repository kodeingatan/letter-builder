import { describe, it, expect } from 'vitest'
import { matchUrlPattern } from '../../../app/utils/url-matcher'

describe('matchUrlPattern', () => {
  it('matches wildcard pattern', () => {
    expect(matchUrlPattern('/*', '/any/path')).toBe(true)
  })

  it('matches exact paths', () => {
    expect(matchUrlPattern('/api/users', '/api/users')).toBe(true)
  })

  it('does not match different paths', () => {
    expect(matchUrlPattern('/api/users', '/api/roles')).toBe(false)
  })

  it('strips trailing slashes', () => {
    expect(matchUrlPattern('/api/users/', '/api/users')).toBe(true)
  })

  it('matches prefix wildcard', () => {
    expect(matchUrlPattern('/api/users/*', '/api/users/123')).toBe(true)
    expect(matchUrlPattern('/api/users/*', '/api/users')).toBe(true)
  })

  it('does not match prefix wildcard for different prefix', () => {
    expect(matchUrlPattern('/api/users/*', '/api/roles/1')).toBe(false)
  })

  it('ignores query strings', () => {
    expect(matchUrlPattern('/api/users', '/api/users?page=1')).toBe(true)
  })
})
