import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const appDir = join(process.cwd(), 'app')
const read = (p: string) => readFileSync(join(appDir, p), 'utf8')

describe('Dashboard — Task 04 AC-001 / FR-001 (DashboardHero terintegrasi)', () => {
  const dashboard = read('pages/dashboard/index.vue')

  it('renders DashboardHero with stat + recent (greeting card lama dihapus)', () => {
    expect(dashboard).toContain('DashboardHero')
    expect(dashboard).toContain(':stats="heroStats"')
    expect(dashboard).toContain('Pengguna Terbaru')
    expect(dashboard).not.toContain('Selamat Datang Kembali')
  })

  it('derives stats from existing list endpoints (tanpa API baru, FR-006)', () => {
    expect(dashboard).toContain('/api/users')
    expect(dashboard).toContain('/api/roles')
    expect(dashboard).toContain('/api/permissions')
    expect(dashboard).toContain('/api/guards')
    expect(dashboard).not.toContain('/api/dashboard')
    expect(dashboard).not.toContain('/api/summary')
  })

  it('handles slow/failed stat fetch (EC-01: hero tetap render)', () => {
    expect(dashboard).toContain("'…'")
    expect(dashboard).toContain('statsLoading')
  })

  it('keeps RBAC shortcuts and profile (no regression)', () => {
    expect(dashboard).toContain('Akses Cepat — RBAC')
    expect(dashboard).toContain('Informasi Profil')
    expect(dashboard).toContain('PageShell')
    expect(dashboard).not.toContain('navigationStore')
  })
})
