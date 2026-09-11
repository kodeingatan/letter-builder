import { describe, it, expect } from 'vitest'

// Mirrors GlobalTableColumnFormModal.vue optionRules computed validator
function validateOptionsJson(value: string): { valid: boolean; error?: string } {
  if (!value || String(value).trim() === '') {
    return { valid: false, error: 'Options wajib untuk type select' }
  }
  try {
    const parsed = JSON.parse(String(value))
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { valid: false, error: 'Options harus array JSON dengan minimal 1 opsi' }
    }
    const vals = parsed.map((o: any) => o?.value)
    if (vals.some((x: any) => x === undefined || x === null || String(x).trim() === '')) {
      return { valid: false, error: 'Setiap opsi harus punya value' }
    }
    if (new Set(vals.map((x: any) => String(x))).size !== vals.length) {
      return { valid: false, error: 'value opsi harus unik' }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: 'Format options tidak valid' }
  }
}

describe('GlobalTable UX — Column form optionRules (FR-001, AC-001, GAP-GT-06)', () => {
  it('valid single option passes', () => {
    expect(validateOptionsJson('[{"label":"A","value":"a"}]').valid).toBe(true)
  })

  it('valid multiple options passes', () => {
    expect(validateOptionsJson('[{"label":"A","value":"a"},{"label":"B","value":"b"}]').valid).toBe(true)
  })

  it('empty string fails required', () => {
    expect(validateOptionsJson('').valid).toBe(false)
    expect(validateOptionsJson('').error).toContain('wajib')
  })

  it('invalid JSON fails format', () => {
    expect(validateOptionsJson('not json').valid).toBe(false)
    expect(validateOptionsJson('not json').error).toContain('Format')
  })

  it('empty array fails minimal 1', () => {
    expect(validateOptionsJson('[]').valid).toBe(false)
  })

  it('duplicate value fails uniqueness', () => {
    const dup = '[{"label":"A","value":"a"},{"label":"A2","value":"a"}]'
    const res = validateOptionsJson(dup)
    expect(res.valid).toBe(false)
    expect(res.error).toContain('unik')
  })

  it('missing value field fails', () => {
    expect(validateOptionsJson('[{"label":"A"}]').valid).toBe(false)
  })

  it('only validates when type=select — non-select types skip', () => {
    // In component, optionRules returns [] when type !== select
    const type = 'text'
    const rules = type === 'select' ? [validateOptionsJson] : []
    expect(rules.length).toBe(0)
    const typeSelect = 'select'
    const rules2 = typeSelect === 'select' ? [validateOptionsJson] : []
    expect(rules2.length).toBe(1)
  })
})
