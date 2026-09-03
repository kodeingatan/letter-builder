import { describe, it, expect } from 'vitest'
import { renderIcon } from '../../../app/utils/icons'

describe('renderIcon', () => {
  it('returns a render function', () => {
    const mockIcon = { name: 'MockIcon' }
    const rendered = renderIcon(mockIcon as any)
    expect(typeof rendered).toBe('function')
  })
})
