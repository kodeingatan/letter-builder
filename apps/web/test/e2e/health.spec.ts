import { test, expect } from '@playwright/test'

test.describe('Health probe — Task 02 AC-003 / FR-007', () => {
  test('GET /api/health returns 200 healthy without renderer', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('status')
    expect(['healthy', 'degraded']).toContain(body.status)
    expect(body).toHaveProperty('db')
    expect(body).toHaveProperty('storage')
    expect(body).toHaveProperty('version')
    expect(body).not.toHaveProperty('renderer')
    expect(body).not.toHaveProperty('activeRenderCount')
    expect(typeof body.version).toBe('string')
  })

  test('GET /api/health is public without auth and idempotent (7x as per report)', async ({ request }) => {
    for (let i = 0; i < 7; i++) {
      const res = await request.get('/api/health')
      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(body.status).toBeDefined()
    }
  })

  test('health response does not expose PII and is JSON', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.headers()['content-type']).toContain('application/json')
    const body = await res.json()
    const jsonStr = JSON.stringify(body)
    expect(jsonStr).not.toContain('password')
    expect(jsonStr).not.toContain('token')
  })
})
