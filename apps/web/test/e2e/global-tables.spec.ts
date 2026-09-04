import { test, expect } from '@playwright/test'

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.waitForSelector('input', { timeout: 15000 })
  await page.locator('input').first().fill('admin@admin.com')
  await page.locator('input').nth(1).fill('P455w0rd!!!')
  const btn = page.getByRole('button', { name: /masuk/i })
  await btn.waitFor({ state: 'visible', timeout: 10000 })
  await btn.click({ force: true, timeout: 10000 })
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
}

test.describe('Global Tables', () => {
  test('global tables page is accessible', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/data/global-tables')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/dashboard/data/global-tables')
    await expect(page.getByRole('button', { name: /add global table/i })).toBeVisible()
  })

  test('create → list → delete flow', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/data/global-tables')
    await page.waitForLoadState('networkidle')

    const tableName = `e2e_table_${Date.now()}`

    await page.getByRole('button', { name: /add global table/i }).click()
    await page.getByPlaceholder('e.g. pegawai', { exact: true }).fill(tableName)
    await page.getByPlaceholder('e.g. Pegawai', { exact: true }).fill('E2E Table')
    await page.getByRole('button', { name: /^create$/i }).click()

    await expect(page.getByText(tableName).first()).toBeVisible({ timeout: 15000 })
  })
})
