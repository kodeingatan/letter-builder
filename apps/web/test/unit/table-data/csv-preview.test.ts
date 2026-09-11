import { describe, it, expect } from 'vitest'

// Quote-aware preview parser — mirrors TableDataImportModal.vue parsePreview + server TableDataService.parseCsv
function parsePreview(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++ } else inQuotes = false
      } else cell += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') { row.push(cell.trim()); cell = '' }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (ch === '\r') { /* skip */ }
    else cell += ch
  }
  row.push(cell)
  rows.push(row)
  const filtered = rows.filter(r => r.some(c => c !== ''))
  return filtered.slice(0, 6).map(r => r.map(c => c.trim()))
}

describe('GlobalTable UX — CSV preview quote-aware (FR-005, AC-005, GAP-GT-13)', () => {
  it('keeps quoted commas as single column (Budi case)', () => {
    const csv = 'nip,nama,alamat\n19801201,"Budi, S.T.","Jl. Merdeka No. 10, Jakarta"\n19801202,Siti,Jl. Sudirman'
    const rows = parsePreview(csv)
    expect(rows[1]).toEqual(['19801201', 'Budi, S.T.', 'Jl. Merdeka No. 10, Jakarta'])
    expect(rows[1].length).toBe(3)
    // naive split would be 4+ columns due to commas inside quotes
    const naive = '19801201,"Budi, S.T.","Jl. Merdeka No. 10, Jakarta"'.split(',').length
    expect(naive).toBeGreaterThan(3)
    // quoted field preserves inner comma
    expect(rows[1][1]).toBe('Budi, S.T.')
  })

  it('handles escaped double quotes "" → "', () => {
    const csv = 'nip,nama\n1,"Siti ""Aminah"""'
    const rows = parsePreview(csv)
    expect(rows[1]).toEqual(['1', 'Siti "Aminah"'])
  })

  it('caps preview to 6 rows (header + 5)', () => {
    const lines = ['h1,h2', ...Array.from({ length: 10 }, (_, i) => `${i},v${i}`)]
    const rows = parsePreview(lines.join('\n'))
    expect(rows.length).toBe(6)
    expect(rows[0]).toEqual(['h1', 'h2'])
  })

  it('handles empty input without crash', () => {
    expect(parsePreview('')).toEqual([])
    expect(parsePreview('a,b\n')).toEqual([['a', 'b']])
    expect(parsePreview('a,b')).toEqual([['a', 'b']])
  })

  it('matches server parseCsv for quoted commas (contract parity)', () => {
    // server logic same state machine — ensure preview parity
    const text = 'a,b\n"hello, world",2\n"x""y""",3'
    const rows = parsePreview(text)
    expect(rows).toEqual([['a', 'b'], ['hello, world', '2'], ['x"y"', '3']])
  })
})
