import { describe, it, expect } from 'vitest'
import { previewOperation, formatIDR, parseIDRInput, formatDateDisplay } from '../../../../app/utils/master-operation'

describe('master-operation client utils — parity with server (FR-006, AC-004)', () => {
  it('previewOperation computes identically to server', () => {
    expect(previewOperation('"Total: "++gaji+bonus', { gaji: 2000000, bonus: 500000 })).toEqual({
      value: 'Total: 2500000', error: null,
    })
  })

  it('previewOperation surfaces div-by-zero message (ERR-03)', () => {
    const out = previewOperation('gaji / 0', { gaji: 5 })
    expect(out.value).toBe('')
    expect(out.error).toContain('nol')
  })

  it('previewOperation surfaces syntax errors', () => {
    const out = previewOperation('gaji;', { gaji: 5 })
    expect(out.error).not.toBeNull()
  })

  it('formatIDR / parseIDRInput round-trip (FR-004)', () => {
    expect(formatIDR(2000000)).toBe('Rp 2.000.000')
    expect(parseIDRInput('Rp 2.000.000')).toBe(2000000)
    expect(parseIDRInput('')).toBeNull()
    expect(formatIDR(null)).toBe('')
  })

  it('formatDateDisplay honors m-d-Y family (FR-004)', () => {
    expect(formatDateDisplay('2024-05-17', 'date')).toBe('Mei-17-2024')
    expect(formatDateDisplay('2024-05-17T10:30:00', 'datetime')).toContain('2024')
    expect(formatDateDisplay('10:30:00', 'time')).toBe('10:30:00')
    expect(formatDateDisplay('', 'date')).toBe('')
    expect(formatDateDisplay('not-a-date', 'date')).toBe('not-a-date')
  })
})
