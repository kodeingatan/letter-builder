import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('GlobalTable UX — RelationSelector states (AC-003, GAP-12, ALT-02)', () => {
  const p = join(process.cwd(), 'app/components/features/global-tables/RelationSelector.vue')
  const c = readFileSync(p, 'utf8')

  it('hasMore = options.length < total and pagination floor(len/limit)+1', () => {
    expect(c).toContain('options.value.length < total.value')
    expect(c).toContain('Math.floor(options.value.length / limit) + 1')
    expect(c).not.toContain('offset.value + options.value.length < total.value')
  })

  it('shows NEmpty for empty and NAlert error with retry keep selected', () => {
    expect(c).toContain('NEmpty')
    expect(c).toContain('Tidak ada data. Buat dulu di tabel target.')
    expect(c).toContain('NAlert')
    expect(c).toContain('Gagal memuat opsi')
    expect(c).toContain('Coba lagi')
    expect(c).toContain('Pilihan lama dipertahankan')
  })

  it('has index >= length-5 scroll pagination and aria-live hasMore hint', () => {
    expect(c).toContain('params.index >= options.value.length - 5')
    expect(c).toContain('aria-live="polite"')
    expect(c).toContain('Menampilkan')
  })

  it('renders NSelect remote filterable with renderTag NTag', () => {
    expect(c).toContain('NSelect')
    expect(c).toContain('remote')
    expect(c).toContain('renderTag')
    expect(c).toContain('NTag')
  })
})
