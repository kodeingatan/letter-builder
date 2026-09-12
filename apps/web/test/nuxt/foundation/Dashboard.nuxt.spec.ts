import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Dashboard — RBAC-Only after Task 01 (FR-005 / AC-005)', () => {
  it('dashboard file is RBAC-only via ID locale and PageShell (no navigationStore)', () => {
    const appDir = join(process.cwd(), 'app')
    const content = readFileSync(join(appDir, 'pages/dashboard/index.vue'), 'utf8')
    expect(content).not.toContain('navigationStore')
    expect(content).toContain('Selamat Datang Kembali')
    expect(content).toContain('Halo,')
    expect(content).toContain('Berikut ringkasan akun Anda')
    expect(content).toContain('PageShell')
    expect(content).toContain('NGrid')
    expect(content).toContain('Akses Cepat — RBAC')
  })

  it('dashboard shows RBAC shortcuts (User/Role/Permission/Guard + Activity/System/Settings)', () => {
    const appDir = join(process.cwd(), 'app')
    const content = readFileSync(join(appDir, 'pages/dashboard/index.vue'), 'utf8')
    expect(content).toContain('User')
    expect(content).toContain('Role')
    expect(content).toContain('Permission')
    expect(content).toContain('Guard')
    expect(content).toContain('Activity Logs')
    expect(content).toContain('System Logs')
    expect(content).toContain('Settings')
    // Ensure dynamic shortcuts removed
    expect(content).not.toContain('Komponen')
    expect(content).not.toContain('Persuratan')
  })

  it('dashboard responsive NGrid 3 cols', () => {
    const appDir = join(process.cwd(), 'app')
    const content = readFileSync(join(appDir, 'pages/dashboard/index.vue'), 'utf8')
    expect(content).toContain(':cols="3"')
    expect(content).toContain('responsive="screen"')
  })
})
