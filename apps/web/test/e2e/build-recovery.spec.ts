import { test, expect } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

test.describe('Build recovery — Task 02 AC-001 / AC-002 / AC-006 / FR-006', () => {
  test('filesystem: app/stores has exactly 6 files (INV-01)', async () => {
    // This test runs in node context via playwright's test worker (node)
    // Verify filesystem invariant directly
    const { readdirSync } = await import('node:fs')
    const storesDir = join(process.cwd(), 'app/stores')
    const files = readdirSync(storesDir)
    expect(files).toHaveLength(6)
    expect(files.sort()).toEqual(['auth.ts', 'guards.ts', 'permissions.ts', 'roles.ts', 'settings.ts', 'users.ts'].sort())
  })

  test('filesystem: server/utils has no render-guard.ts (INV-01)', async () => {
    const renderGuardPath = join(process.cwd(), 'server/utils/render-guard.ts')
    expect(existsSync(renderGuardPath)).toBe(false)
  })

  test('imports.d.ts has 6 stores only (FR-005 / AC-005)', async () => {
    const importsPath = join(process.cwd(), '.nuxt/imports.d.ts')
    expect(existsSync(importsPath)).toBe(true)
    const content = readFileSync(importsPath, 'utf8')
    expect(content).toContain('useAuthStore')
    expect(content).toContain('useUsersStore')
    expect(content).not.toContain('useAdministrationsStore')
    expect(content).not.toContain('useGlobalTablesStore')
    expect(content).not.toContain('useNavigationStore')
    expect(content).not.toContain('render-guard')
  })

  test('security-limits.ts comment corrected (AC-004)', async () => {
    const secPath = join(process.cwd(), 'server/utils/security-limits.ts')
    const content = readFileSync(secPath, 'utf8')
    expect(content).toContain('removed in Task 01')
    expect(content).not.toContain('live in `server/utils/render-guard.ts`')
    expect(content).not.toContain('TableDataService.importCsv')
  })

  test('dev server has no B6005-like console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = []
    const consoleWarnings: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
      if (msg.type() === 'warning') consoleWarnings.push(msg.text())
    })
    page.on('pageerror', (err) => consoleErrors.push(String(err)))
    await page.goto('/login')
    await page.waitForSelector('input', { timeout: 15000 })
    const b6005 = [...consoleErrors, ...consoleWarnings].filter((t) => t.includes('B6005') || t.includes('Could not resolve app/stores'))
    expect(b6005).toEqual([])
    const renderGuard = [...consoleErrors, ...consoleWarnings].filter((t) => t.includes('render-guard'))
    expect(renderGuard).toEqual([])
  })
})
