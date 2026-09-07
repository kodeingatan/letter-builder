import { describe, it, expect } from 'vitest'
import {
  MENU_ICON_ALLOWLIST,
  MenuUpdateSchema,
  isMenuIconAllowed,
} from '../../../server/dto/navigation.dto'

describe('MENU_ICON_ALLOWLIST', () => {
  it('contains the v1 icon set', () => {
    expect([...MENU_ICON_ALLOWLIST]).toEqual(['Table', 'Document', 'Folder', 'Star', 'Book', 'File'])
  })
})

describe('isMenuIconAllowed', () => {
  it('accepts allowlisted keys only', () => {
    expect(isMenuIconAllowed('Table')).toBe(true)
    expect(isMenuIconAllowed('Rocket')).toBe(false)
    expect(isMenuIconAllowed(null)).toBe(false)
  })
})

describe('MenuUpdateSchema', () => {
  it('accepts order + icon pairs', () => {
    const parsed = MenuUpdateSchema.safeParse({ menuOrder: 2, menuIcon: 'Star' })
    expect(parsed.success).toBe(true)
  })

  it('accepts nulls to clear back to the alphabetical default', () => {
    const parsed = MenuUpdateSchema.safeParse({ menuOrder: null, menuIcon: null })
    expect(parsed.success).toBe(true)
  })

  it('accepts empty payloads (no-op reorder)', () => {
    expect(MenuUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('rejects negative orders and unknown icons', () => {
    expect(MenuUpdateSchema.safeParse({ menuOrder: -1 }).success).toBe(false)
    expect(MenuUpdateSchema.safeParse({ menuOrder: 1.5 }).success).toBe(false)
    expect(MenuUpdateSchema.safeParse({ menuIcon: 'Rocket' }).success).toBe(false)
  })
})
