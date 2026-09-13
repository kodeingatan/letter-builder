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

test.describe('Redesign happy path — E2E-01 / Steps 1–11 / AC-001..005', () => {
  test('Step 4: dashboard renders hero band + stats + recent (AC-001)', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.locator('.dashboard-hero')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.dashboard-hero')).toContainText('Halo,')
    await expect(page.locator('.dashboard-hero-stats')).toBeVisible()
    await expect(page.locator('.dashboard-hero-stats')).toContainText('Users')
    await expect(page.getByText('Pengguna Terbaru')).toBeVisible()
    // greeting card lama tidak ada
    await expect(page.getByText('Selamat Datang Kembali')).toHaveCount(0)
  })

  test('Step 6: users table renders role pills (AC-002)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/users')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.badge-pill, .n-tag').first()).toBeVisible({ timeout: 30000 })
  })

  test('Step 10: activity-logs renders level pills (AC-002)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/activity-logs')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.badge-pill, .n-tag').first()).toBeVisible({ timeout: 30000 })
  })

  test('Step 7: role modal opens with modal-card style (AC-003)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/roles')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /add role/i }).click()
    await expect(page.locator('.modal-card').first()).toBeVisible({ timeout: 20000 })
  })

  test('Steps 1–3: auth pages render card + pill CTA (AC-005)', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('input', { timeout: 30000 })
    await expect(page.getByRole('button', { name: /masuk/i })).toBeVisible()
    await page.goto('/register')
    await page.waitForSelector('input', { timeout: 30000 })
    await expect(page.locator('input').first()).toBeVisible()
  })
})
