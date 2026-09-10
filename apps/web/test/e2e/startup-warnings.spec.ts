import { test, expect } from '@playwright/test'

// Task 24 (AC-006): `/favicon.svg` resolves as a static asset instead of
// falling through to vue-router (`VUE_ROUTER_R0004`).
test.describe('Startup warnings cleanup — favicon', () => {
  test('GET /favicon.svg returns SVG content', async ({ request }) => {
    const res = await request.get('/favicon.svg')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('image/svg+xml')
    const body = await res.text()
    expect(body).toContain('<svg')
  })

  test('navigating to /login logs no favicon/router warning', async ({ page }) => {
    const warnings: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'warning' || msg.type() === 'error') warnings.push(msg.text())
    })
    page.on('pageerror', (err) => warnings.push(String(err)))
    await page.goto('/login')
    await page.waitForSelector('input', { timeout: 15000 })
    expect(warnings.filter((t) => t.includes('R0004') || t.includes('favicon'))).toEqual([])
  })
})
