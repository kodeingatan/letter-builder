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

test.describe('Dashboard', () => {
  test('dashboard shows content after login', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible()
  })

  test('sidebar navigation shows menu items', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.locator('text=User Management')).toBeVisible()
  })
})

test.describe('CRUD Pages - Basic Navigation', () => {
  test('users page is accessible', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/users')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/dashboard/users')
    await expect(page.getByRole('button', { name: /add user/i })).toBeVisible()
  })

  test('roles page is accessible', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/roles')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/dashboard/roles')
    await expect(page.getByRole('button', { name: /add role/i })).toBeVisible()
  })

  test('permissions page is accessible', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/permissions')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/dashboard/permissions')
    await expect(page.getByRole('button', { name: /add permission/i })).toBeVisible()
  })

  test('guards page is accessible', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/guards')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/dashboard/guards')
    await expect(page.getByRole('button', { name: /add guard/i })).toBeVisible()
  })

  test('activity logs page is accessible', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/activity-logs')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/dashboard/activity-logs')
    await expect(page.getByText('Activity Logs').first()).toBeVisible()
  })

  test('settings page is accessible', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/dashboard/settings')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/dashboard/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })
})
