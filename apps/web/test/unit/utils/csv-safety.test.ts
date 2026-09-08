import { describe, it, expect } from 'vitest'
import { isFormulaCell, neutralizeFormulaCell } from '../../../server/utils/csv-safety'

describe('csv-safety (Task 22, AC-006)', () => {
  it('detects formula cells (=, +, -, @, with leading whitespace)', () => {
    for (const v of ['=CMD(1)', '+SUM(A1)', '-2+3', '@evil', '  =HYPERLINK(1)']) {
      expect(isFormulaCell(v), String(v)).toBe(true)
    }
    expect(isFormulaCell('Budi')).toBe(false)
    expect(isFormulaCell('0812')).toBe(false)
    expect(isFormulaCell(null)).toBe(false)
    expect(isFormulaCell(42)).toBe(false)
  })

  it("neutralizes with a single-quote prefix, leaves safe values untouched", () => {
    expect(neutralizeFormulaCell('=CMD(1)')).toBe("'=CMD(1)")
    expect(neutralizeFormulaCell('Budi')).toBe('Budi')
    expect(neutralizeFormulaCell(null)).toBe(null)
  })

  it('neutralized cells stay CSV-quote-safe (export contract)', () => {
    // Mirrors TableDataService.escapeCsvCell wiring: neutralize first,
    // then quote when the cell contains , " or newlines.
    const escape = (v: unknown): string => {
      const s = String(neutralizeFormulaCell(v) ?? '')
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    expect(escape('=CMD(1)')).toBe("'=CMD(1)")
    expect(escape('a,b')).toBe('"a,b"')
    expect(escape('=A,1')).toBe("\"'=A,1\"")
  })
})
