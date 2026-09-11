import { describe, it, expect } from 'vitest'

type NavEntry = { label: string; tableName?: string; administrationId?: number }
type Projection = { data: NavEntry[]; persuratan: NavEntry[] }

function filterShortcuts(projection: Projection | null, isAdmin: boolean) {
  if (!projection) return { data: [] as NavEntry[], persuratan: [] as NavEntry[], isEmpty: true }
  const data = projection.data ?? []
  const persuratan = projection.persuratan ?? []
  const isEmpty = data.length === 0 && persuratan.length === 0 && !isAdmin
  return { data, persuratan, isEmpty }
}

describe('dashboard shortcuts filter — FR-005 / AC-005 / EC-01', () => {
  it('Designer sees all shortcuts (admin sees Dokumen group even when data/persuratan empty)', () => {
    const proj: Projection = {
      data: [{ label: 'Pegawai', tableName: 'pegawai' }, { label: 'Unit', tableName: 'unit' }],
      persuratan: [{ label: 'SK', administrationId: 1 }, { label: 'ST', administrationId: 2 }],
    }
    const { data, persuratan, isEmpty } = filterShortcuts(proj, true)
    expect(data).toHaveLength(2)
    expect(persuratan).toHaveLength(2)
    expect(isEmpty).toBe(false)
  })

  it('Operator sees limited shortcuts per permission', () => {
    const proj: Projection = {
      data: [{ label: 'Pegawai', tableName: 'pegawai' }],
      persuratan: [{ label: 'SK', administrationId: 1 }],
    }
    const { data, persuratan } = filterShortcuts(proj, false)
    expect(data).toHaveLength(1)
    expect(persuratan).toHaveLength(1)
  })

  it('Empty (no modules) → EC-01 empty state with guidance (non-admin)', () => {
    const proj: Projection = { data: [], persuratan: [] }
    const { isEmpty } = filterShortcuts(proj, false)
    expect(isEmpty).toBe(true)
  })

  it('Admin with empty data/persuratan is NOT empty (Dokumen statis shortcuts exist)', () => {
    const proj: Projection = { data: [], persuratan: [] }
    const { isEmpty } = filterShortcuts(proj, true)
    expect(isEmpty).toBe(false)
  })

  it('null projection → isEmpty true', () => {
    const { isEmpty } = filterShortcuts(null, false)
    expect(isEmpty).toBe(true)
  })
})
