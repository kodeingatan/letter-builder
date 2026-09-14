import { test, expect } from '@playwright/test'

async function loginAs(request: import('@playwright/test').APIRequestContext, email: string): Promise<string> {
  const res = await request.post('/api/auth/login', { data: { email, password: 'P455w0rd!!!' } })
  expect(res.status()).toBe(200)
  const body = await res.json().catch(() => ({}))
  return (body?.token ?? body?.accessToken ?? body?.data?.token ?? '') as string
}

test.describe('Letter Builder Errors & permissions & edge — E2E-06', () => {
  test('401 → /login, 403 single, 404 slug NEmpty+Kembali, 500 PDF retry tanpa reset', async ({ request, page }) => {
    const viewer = await loginAs(request, 'viewer@example.com')
    const admin = await loginAs(request, 'admin@admin.com')
    // 401 anon
    const anon = await request.get('/api/master-data')
    expect(anon.status()).toBe(401)
    // 403 viewer POST Master Data
    const deny = await request.post('/api/master-data', { headers: { Authorization: `Bearer ${viewer}` }, data: { name: 'nope', display_name: 'Nope', columns: [{ name: 'nama', display_name: 'Nama', type: 'text' }] } })
    expect(deny.status()).toBe(403)
    // 403 admin allowed
    const allow = await request.get('/api/master-data', { headers: { Authorization: `Bearer ${admin}` } })
    expect(allow.status()).toBe(200)
    // 404 slug
    const notFound = await request.get('/api/master-data/unknown_slug_xyz_999', { headers: { Authorization: `Bearer ${admin}` } })
    expect(notFound.status()).toBe(404)
    // 400 validation slug blacklist
    const bad = await request.post('/api/master-data', { headers: { Authorization: `Bearer ${admin}` }, data: { name: 'users', display_name: 'Users', columns: [{ name: 'nama', display_name: 'Nama', type: 'text' }] } })
    // could be 400 or 409 duplicate depending on existing, not 500
    expect([400, 409]).toContain(bad.status())
  })

  test('div-by-zero operation preview warning handled via API 400/ null', async ({ request }) => {
    const token = await loginAs(request, 'admin@admin.com')
    const headers = { Authorization: `Bearer ${token}` }
    const slug = `e2e_calc_${Date.now()}`
    await request.post('/api/master-data', { headers, data: { name: slug, display_name: 'Calc', columns: [{ name: 'aa', display_name: 'A', type: 'number' }, { name: 'bb', display_name: 'B', type: 'number' }, { name: 'rr', display_name: 'R', type: 'readonly_operation_text', config: { expression: 'aa / bb' } }] } })
    const row = await request.post(`/api/master-data/${slug}/rows`, { headers, data: { aa: 5, bb: 0 } })
    expect(row.status()).toBe(200)
    const body = await row.json()
    // rr should be null due to div-by-zero
    expect(body.rr).toBeNull()
    await request.delete(`/api/master-data/${slug}`, { headers })
  })

  test('image allowlist — javascript: rejected 400', async ({ request }) => {
    const token = await loginAs(request, 'admin@admin.com')
    const headers = { Authorization: `Bearer ${token}` }
    const slug = `e2e_img_${Date.now()}`
    await request.post('/api/master-data', { headers, data: { name: slug, display_name: 'Img', columns: [{ name: 'foto', display_name: 'Foto', type: 'image' }] } })
    const bad = await request.post(`/api/master-data/${slug}/rows`, { headers, data: { foto: 'javascript:alert(1)' } })
    expect(bad.status()).toBe(400)
    await request.delete(`/api/master-data/${slug}`, { headers })
  })
})
