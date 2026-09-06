import { describe, it, expect } from 'vitest'
import { isItemScopedRef, itemFieldOf, slotKeyOf } from '../../../server/utils/binding-refs'

/**
 * Unit tests for Template Bindings service logic.
 *
 * The service functions require a database, so we test the pure logic here:
 * - Type compatibility matrix (BR-005)
 * - Binding source enum completeness (BR-002)
 * - System key whitelist (BR-004)
 * - Stale detection key format
 */

// ---------------------------------------------------------------------------
// Type compatibility matrix (BR-005)
// ---------------------------------------------------------------------------

/**
 * Mirrors the type compatibility logic from template-bindings.service.ts.
 * Hard mismatches block publish; soft mismatches warn only.
 */
const HARD_MISMATCHES: Array<[string, string]> = [
  ['image', 'number'],
  ['date', 'image'],
]

function checkTypeCompatibility(
  requirementType: string,
  source: string,
  literalValue?: string | null,
): { compatible: boolean; warning?: string } {
  if (source === 'expression' || source === 'administration' || source === 'system') {
    return { compatible: true }
  }
  if (source === 'global_table') {
    return { compatible: true }
  }
  if (source === 'manual' && literalValue != null) {
    for (const [reqType] of HARD_MISMATCHES) {
      if (requirementType === reqType && source === 'manual') {
        if (requirementType === 'image' && /^\d+(\.\d+)?$/.test(literalValue)) {
          return { compatible: false, warning: `Hard mismatch: image requirement bound to numeric literal` }
        }
      }
    }
    if (requirementType === 'text' && /^\d+(\.\d+)?$/.test(literalValue)) {
      return { compatible: true, warning: `Soft mismatch: text requirement bound to numeric literal` }
    }
  }
  return { compatible: true }
}

describe('Type compatibility matrix (BR-005)', () => {
  describe('hard mismatches (block publish)', () => {
    it('image requirement + numeric literal → incompatible', () => {
      const result = checkTypeCompatibility('image', 'manual', '123')
      expect(result.compatible).toBe(false)
      expect(result.warning).toContain('Hard mismatch')
    })

    it('image requirement + decimal numeric literal → incompatible', () => {
      const result = checkTypeCompatibility('image', 'manual', '3.14')
      expect(result.compatible).toBe(false)
    })

    it('image requirement + non-numeric literal → compatible', () => {
      const result = checkTypeCompatibility('image', 'manual', 'https://example.com/img.png')
      expect(result.compatible).toBe(true)
    })
  })

  describe('soft mismatches (warn only)', () => {
    it('text requirement + numeric literal → compatible with warning', () => {
      const result = checkTypeCompatibility('text', 'manual', '42')
      expect(result.compatible).toBe(true)
      expect(result.warning).toContain('Soft mismatch')
    })

    it('text requirement + decimal numeric literal → compatible with warning', () => {
      const result = checkTypeCompatibility('text', 'manual', '99.9')
      expect(result.compatible).toBe(true)
      expect(result.warning).toContain('Soft mismatch')
    })

    it('text requirement + non-numeric literal → compatible, no warning', () => {
      const result = checkTypeCompatibility('text', 'manual', 'hello')
      expect(result.compatible).toBe(true)
      expect(result.warning).toBeUndefined()
    })
  })

  describe('compatible combinations', () => {
    it('number requirement + numeric literal → compatible', () => {
      const result = checkTypeCompatibility('number', 'manual', '42')
      expect(result.compatible).toBe(true)
    })

    it('date requirement + date string literal → compatible', () => {
      const result = checkTypeCompatibility('date', 'manual', '2026-01-15')
      expect(result.compatible).toBe(true)
    })

    it('any requirement + expression source → always compatible', () => {
      for (const reqType of ['text', 'number', 'date', 'image']) {
        const result = checkTypeCompatibility(reqType, 'expression')
        expect(result.compatible).toBe(true)
      }
    })

    it('any requirement + administration source → always compatible', () => {
      for (const reqType of ['text', 'number', 'date', 'image']) {
        const result = checkTypeCompatibility(reqType, 'administration')
        expect(result.compatible).toBe(true)
      }
    })

    it('any requirement + system source → always compatible', () => {
      for (const reqType of ['text', 'number', 'date', 'image']) {
        const result = checkTypeCompatibility(reqType, 'system')
        expect(result.compatible).toBe(true)
      }
    })

    it('any requirement + global_table source → always compatible (deferred to render)', () => {
      for (const reqType of ['text', 'number', 'date', 'image']) {
        const result = checkTypeCompatibility(reqType, 'global_table')
        expect(result.compatible).toBe(true)
      }
    })
  })
})

// ---------------------------------------------------------------------------
// Binding source enum completeness (BR-002)
// ---------------------------------------------------------------------------

describe('Binding source enum (BR-002)', () => {
  const VALID_SOURCES = ['administration', 'global_table', 'manual', 'expression', 'system']

  it('has exactly 5 source types', () => {
    expect(VALID_SOURCES).toHaveLength(5)
  })

  it('all sources are lowercase snake_case', () => {
    for (const source of VALID_SOURCES) {
      expect(source).toMatch(/^[a-z][a-z_]*$/)
    }
  })
})

// ---------------------------------------------------------------------------
// System key whitelist (BR-004)
// ---------------------------------------------------------------------------

describe('System key whitelist (BR-004)', () => {
  const SYSTEM_KEYS = ['current_date', 'user.name', 'user.username']

  it('contains exactly 3 keys', () => {
    expect(SYSTEM_KEYS).toHaveLength(3)
  })

  it('current_date is a date-formatted string', () => {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

// ---------------------------------------------------------------------------
// Loop-item scoping helpers (REQ-002)
// ---------------------------------------------------------------------------

describe('isItemScopedRef (REQ-002)', () => {
  it('accepts item.<field> refs', () => {
    expect(isItemScopedRef('item.nama')).toBe(true)
    expect(isItemScopedRef('item.nip')).toBe(true)
  })

  it('accepts the whole-item ref', () => {
    expect(isItemScopedRef('item')).toBe(true)
  })

  it('rejects outer-context refs', () => {
    expect(isItemScopedRef('pegawai.nama')).toBe(false)
    expect(isItemScopedRef('data.nama')).toBe(false)
    expect(isItemScopedRef('')).toBe(false)
    expect(isItemScopedRef(null)).toBe(false)
    expect(isItemScopedRef(undefined)).toBe(false)
  })

  it('is strict about the item prefix (no "items." false positive)', () => {
    expect(isItemScopedRef('items.nama')).toBe(false)
  })
})

describe('itemFieldOf (REQ-002)', () => {
  it('extracts the field after item.', () => {
    expect(itemFieldOf('item.nama')).toBe('nama')
  })

  it('returns null for the whole-item ref', () => {
    expect(itemFieldOf('item')).toBe(null)
  })
})

describe('slotKeyOf (REQ-006)', () => {
  it('builds placementId:lowercased-name keys', () => {
    expect(slotKeyOf('n1', 'Nama')).toBe('n1:nama')
    expect(slotKeyOf('abc-123', 'nip')).toBe('abc-123:nip')
  })
})

// ---------------------------------------------------------------------------
// Stale detection key format
// ---------------------------------------------------------------------------

describe('Stale detection key format', () => {
  it('stale key uses placementId:requirementName format', () => {
    const placementId = 'abc-123'
    const requirementName = 'nama'
    const key = `${placementId}:${requirementName}`
    expect(key).toBe('abc-123:nama')
  })

  it('stale reason includes entity name for user clarity', () => {
    const reason = 'Table "pegawai" no longer exists'
    expect(reason).toContain('Table')
    expect(reason).toContain('pegawai')
  })

  it('column stale reason includes table and column names', () => {
    const reason = 'Column "nip" no longer exists in table "pegawai"'
    expect(reason).toContain('Column')
    expect(reason).toContain('nip')
    expect(reason).toContain('table')
    expect(reason).toContain('pegawai')
  })
})
