import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('GlobalTable UX — Manager DataTable (AC-D01, GAP-01..05, AC-002)', () => {
  const p = join(process.cwd(), 'app/components/features/global-tables/GlobalTableColumnTab.vue')
  const c = readFileSync(p, 'utf8')

  it('uses DataTable kanonis with storageKey and search/sort', () => {
    expect(c).toContain('DataTable')
    expect(c).toContain('datatable-hidden-columns-global-')
    expect(c).toContain('search-placeholder="Cari kolom')
    expect(c).toContain('searchable-fields')
    expect(c).toContain('@refresh')
    expect(c).toContain('@retry')
  })

  it('reorder via ChevronUp/Down h(NIcon) with aria-label and NPopconfirm delete', () => {
    expect(c).toContain('ChevronUp')
    expect(c).toContain('ChevronDown')
    expect(c).toContain('h(NIcon')
    expect(c).toContain('Pindahkan ke atas')
    expect(c).toContain('Pindahkan ke bawah')
    expect(c).toContain('NPopconfirm')
    expect(c).toContain('positiveText: \'Hapus\'')
    expect(c).not.toContain('DragHandle')
  })

  it('distinct icons View vs Edit vs TrashCan and tag warning for currency', () => {
    expect(c).toContain("View")
    expect(c).toContain("Edit")
    expect(c).toContain("TrashCan")
    expect(c).toContain("currency: 'warning'")
    expect(c).not.toContain("purple")
  })

  it('empty NEmpty + CTA and live region aria-live polite', () => {
    expect(c).toContain('Belum ada kolom')
    expect(c).toContain('Buat Kolom Pertama')
    expect(c).toContain('aria-live="polite"')
    expect(c).toContain('Dipindahkan ke posisi')
  })
})
