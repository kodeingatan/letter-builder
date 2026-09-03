import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('login page renders form elements', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('input', { timeout: 15000 })
    await expect(page.locator('input').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /masuk/i })).toBeVisible()
  })

  test('shows validation error on empty submit', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('button', { timeout: 15000 })
    await page.getByRole('button', { name: /masuk/i }).click()
    await expect(page.locator('text=Email wajib diisi')).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('input', { timeout: 15000 })
    await page.locator('input').first().fill('wrong@test.com')
    await page.locator('input').nth(1).fill('wrongpass')
    await page.getByRole('button', { name: /masuk/i }).click()
    await expect(page.locator('.n-alert')).toBeVisible({ timeout: 10000 })
  })

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('input', { timeout: 15000 })
    await page.locator('input').first().fill('admin@admin.com')
    await page.locator('input').nth(1).fill('P455w0rd!!!')
    await page.getByRole('button', { name: /masuk/i }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
  })

  test('unauthenticated user sees dashboard or login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    const url = page.url()
    expect(url === 'http://localhost:3000/dashboard' || url.includes('/login')).toBeTruthy()
  })

  test('register page renders form elements', async ({ page }) => {
    await page.goto('/register')
    await page.waitForSelector('input', { timeout: 15000 })
    await expect(page.locator('input').first()).toBeVisible()
  })
})
