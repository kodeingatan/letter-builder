import { test, expect } from '@playwright/test'

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.waitForSelector('input', { timeout: 30000 })
  await page.locator('input').first().fill('admin@admin.com')
  await page.locator('input').nth(1).fill('P455w0rd!!!')
  const btn = page.getByRole('button', { name: /masuk/i })
  await btn.waitFor({ state: 'visible', timeout: 20000 })
  await btn.click({ force: true, timeout: 20000 })
  await expect(page).toHaveURL('/dashboard', { timeout: 30000 })
}

test.describe('Redesign alternate/error — E2E-02 / ALT-01 / ERR-01·02 / EC-03', () => {
  test('ALT-01: empty search shows EmptyStateCard (no dead-end)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/users')
    await page.waitForLoadState('networkidle')
    const search = page.locator('input[placeholder*="Search"], input[placeholder*="Cari"]').first()
    await search.fill('__tidak-ada-hasil-xyz__')
    await expect(page.locator('.empty-state-card')).toBeVisible({ timeout: 30000 })
  })

  test('ERR-01: login validation inline on empty submit', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('button', { timeout: 30000 })
    await page.getByRole('button', { name: /masuk/i }).click()
    await expect(page.locator('text=Email wajib diisi')).toBeVisible()
  })

  test('ERR-02: invalid credentials show single alert', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('input', { timeout: 30000 })
    await page.locator('input').first().fill('wrong@test.com')
    await page.locator('input').nth(1).fill('wrongpass')
    await page.getByRole('button', { name: /masuk/i }).click()
    await expect(page.locator('.n-alert')).toBeVisible({ timeout: 20000 })
  })

  test('EC-03: role modal usable at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginAsAdmin(page)
    await page.goto('/dashboard/guards')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /add guard/i }).click()
    await expect(page.locator('.modal-card').first()).toBeVisible({ timeout: 20000 })
  })
})
