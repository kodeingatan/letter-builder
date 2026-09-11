import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('GlobalTable UX — Import modal + Drawer (AC-005/002, GAP-13..15)', () => {
  it('ImportModal has quote-aware parser and responsive width, no stub', () => {
    const p = join(process.cwd(), 'app/components/features/table-data/TableDataImportModal.vue')
    const c = readFileSync(p, 'utf8')
    expect(c).toContain('inQuotes')
    expect(c).toContain('text[i + 1] === \'"\'')
    expect(c).toContain('min(640px, 90vw)')
    expect(c).toContain('preset="card"')
    expect(c).not.toContain('custom-request')
    expect(c).not.toContain('line.split')
    expect(c).toContain('max-height="240"')
  })

  it('Drawer has NPopconfirm delete and NAlert retry plus NIcon footer', () => {
    const p = join(process.cwd(), 'app/components/features/table-data/TableRowDetailDrawer.vue')
    const c = readFileSync(p, 'utf8')
    expect(c).toContain('NPopconfirm')
    expect(c).toContain('positive-text="Hapus"')
    expect(c).toContain('negative-text="Batal"')
    expect(c).toContain('NAlert')
    expect(c).toContain('Gagal memuat baris')
    expect(c).toContain('Coba lagi')
    expect(c).toContain('error.value')
    expect(c).toContain('NIcon')
    expect(c).toContain('TrashCan')
    expect(c).toContain('Edit')
  })

  it('Import preview capped 6 and shows quoted hint', () => {
    const p = join(process.cwd(), 'app/components/features/table-data/TableDataImportModal.vue')
    const c = readFileSync(p, 'utf8')
    expect(c).toContain('slice(0, 6)')
    expect(c).toContain('quote-aware')
    expect(c).toContain('5 baris')
  })
})
