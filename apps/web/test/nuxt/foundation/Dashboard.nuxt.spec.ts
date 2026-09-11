import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Dashboard — FR-005 / AC-005 / EC-01 shortcuts dinamis (file-level)', () => {
  it('dashboard file is dynamic via navigationStore and ID locale', () => {
    const appDir = join(process.cwd(), 'app')
    const content = readFileSync(join(appDir, 'pages/dashboard/index.vue'), 'utf8')
    expect(content).toContain('navigationStore')
    expect(content).toContain('Selamat Datang Kembali')
    expect(content).toContain('Halo,')
    expect(content).toContain('Berikut ringkasan akun Anda')
    expect(content).toContain('PageShell')
    expect(content).toContain('Belum ada akses')
    expect(content).toContain('NGrid')
  })

  it('dashboard shows distinct Dokumen shortcuts (Komponen/Templat/Administrasi)', () => {
    const appDir = join(process.cwd(), 'app')
    const content = readFileSync(join(appDir, 'pages/dashboard/index.vue'), 'utf8')
    expect(content).toContain('Komponen')
    expect(content).toContain('Templat')
    expect(content).toContain('Administrasi')
    expect(content).toContain('Proses Saya')
    expect(content).toContain('Dokumen')
  })

  it('dashboard responsive NGrid 3 cols', () => {
    const appDir = join(process.cwd(), 'app')
    const content = readFileSync(join(appDir, 'pages/dashboard/index.vue'), 'utf8')
    expect(content).toContain(':cols="3"')
    expect(content).toContain('responsive="screen"')
  })
})
