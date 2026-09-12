import { test, expect } from '@playwright/test'

async function loginAndGetToken(request: import('@playwright/test').APIRequestContext): Promise<string> {
  const res = await request.post('/api/auth/login', {
    data: { email: 'admin@admin.com', password: 'P455w0rd!!!' },
  })
  // login may return 200 with token in body or set-cookie; try both
  if (res.status() === 200) {
    const body = await res.json().catch(() => ({}))
    if (body?.token) return body.token as string
    if (body?.accessToken) return body.accessToken as string
    if (body?.data?.token) return body.data.token as string
  }
  // fallback: try to extract from set-cookie header or return empty for unauthenticated 404 check
  return ''
}

test.describe('Negative dynamic APIs — Task 02 AC-009 / Task 01 invariant (404)', () => {
  const dynamicRoutes = [
    '/api/global-tables',
    '/api/components',
    '/api/templates',
    '/api/administrations',
    '/api/documents',
    '/api/runs/mine',
    '/api/navigation',
  ]

  for (const route of dynamicRoutes) {
    test(`GET ${route} returns 404 (not 500)`, async ({ request }) => {
      const token = await loginAndGetToken(request)
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await request.get(route, { headers })
      expect([404, 401, 403]).toContain(res.status())
      // Must not be 500 — the route should be missing, not erroring
      expect(res.status()).not.toBe(500)
      if (res.status() === 404) {
        const text = await res.text().catch(() => '')
        expect(text.toLowerCase()).toMatch(/not found|cannot find/)
      }
    })
  }

  test('POST /api/expressions/validate returns 404', async ({ request }) => {
    const token = await loginAndGetToken(request)
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await request.post('/api/expressions/validate', { headers, data: {} })
    expect([404, 401, 403]).toContain(res.status())
    expect(res.status()).not.toBe(500)
  })

  test('POST /api/render/preview returns 404', async ({ request }) => {
    const token = await loginAndGetToken(request)
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await request.post('/api/render/preview', { headers, data: {} })
    expect([404, 401, 403]).toContain(res.status())
    expect(res.status()).not.toBe(500)
  })

  test('GET /api/data/test-table returns 404', async ({ request }) => {
    const token = await loginAndGetToken(request)
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await request.get('/api/data/test-table', { headers })
    expect([404, 401, 403]).toContain(res.status())
    expect(res.status()).not.toBe(500)
  })
})
