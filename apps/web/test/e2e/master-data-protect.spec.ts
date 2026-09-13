import { test, expect } from '@playwright/test'

async function loginAs(request: import('@playwright/test').APIRequestContext, email: string): Promise<string> {
  const res = await request.post('/api/auth/login', {
    data: { email, password: 'P455w0rd!!!' },
  })
  expect(res.status()).toBe(200)
  const body = await res.json().catch(() => ({}))
  return (body?.token ?? body?.accessToken ?? body?.data?.token ?? '') as string
}

test.describe('Master Data protection — Task 06 (E2E-02)', () => {
  test('duplicate slug → 409 (ERR-01)', async ({ request }) => {
    const token = await loginAs(request, 'admin@admin.com')
    const payload = {
      name: 'e2e_dupe',
      display_name: 'E2E Dupe',
      columns: [{ name: 'nama', display_name: 'Nama', type: 'text' }],
    }
    const first = await request.post('/api/master-data', {
      headers: { Authorization: `Bearer ${token}` }, data: payload,
    })
    expect([200, 409]).toContain(first.status())
    const second = await request.post('/api/master-data', {
      headers: { Authorization: `Bearer ${token}` }, data: payload,
    })
    expect(second.status()).toBe(409)
    await request.delete('/api/master-data/e2e_dupe', {
      headers: { Authorization: `Bearer ${token}` },
    })
  })

  test('delete referenced table → 409 with references (AC-005, BR-004)', async ({ request }) => {
    const token = await loginAs(request, 'admin@admin.com')
    const headers = { Authorization: `Bearer ${token}` }
    await request.post('/api/master-data', {
      headers,
      data: { name: 'e2e_parent', display_name: 'E2E Parent', columns: [{ name: 'nama', display_name: 'Nama', type: 'text' }] },
    })
    await request.post('/api/master-data', {
      headers,
      data: {
        name: 'e2e_child', display_name: 'E2E Child',
        columns: [{ name: 'parent_id', display_name: 'Parent', type: 'relation_single', config: { target_slug: 'e2e_parent' } }],
      },
    })
    const del = await request.delete('/api/master-data/e2e_parent', { headers })
    expect(del.status()).toBe(409)
    const body = await del.json()
    expect(JSON.stringify(body)).toContain('e2e_child')
    await request.delete('/api/master-data/e2e_child', { headers })
    const delParent = await request.delete('/api/master-data/e2e_parent', { headers })
    expect(delParent.status()).toBe(200)
  })

  test('RBAC: anon 401, viewer POST 403 but GET allowed (AC-007)', async ({ request }) => {
    const noAuth = await request.get('/api/master-data')
    expect(noAuth.status()).toBe(401)
    const viewer = await loginAs(request, 'viewer@example.com')
    const denied = await request.post('/api/master-data', {
      headers: { Authorization: `Bearer ${viewer}` },
      data: { name: 'e2e_nope', display_name: 'Nope', columns: [{ name: 'nama', display_name: 'Nama', type: 'text' }] },
    })
    expect(denied.status()).toBe(403)
    const allowed = await request.get('/api/master-data', {
      headers: { Authorization: `Bearer ${viewer}` },
    })
    expect(allowed.status()).toBe(200)
  })

  test('invalid sort/search column → 400 (BR-003)', async ({ request }) => {
    const token = await loginAs(request, 'admin@admin.com')
    const headers = { Authorization: `Bearer ${token}` }
    // Self-sufficient table (no cross-file dependency — files run in parallel).
    await request.delete('/api/master-data/e2e_sort', { headers }).catch(() => {})
    const created = await request.post('/api/master-data', {
      headers,
      data: {
        name: 'e2e_sort', display_name: 'E2E Sort',
        columns: [
          { name: 'nama', display_name: 'Nama', type: 'text', is_searchable: true },
          { name: 'total_info', display_name: 'Info', type: 'readonly_operation_text', config: { expression: '"x"++nama' } },
        ],
      },
    })
    expect(created.status()).toBe(200)
    const badSort = await request.get('/api/master-data/e2e_sort/rows', {
      headers, params: { sortBy: 'total_info', sortOrder: 'ASC' },
    })
    expect(badSort.status()).toBe(400)
    const badField = await request.get('/api/master-data/e2e_sort/rows', {
      headers, params: { search: 'x', searchField: 'total_info' },
    })
    expect(badField.status()).toBe(400)
    await request.delete('/api/master-data/e2e_sort', { headers })
  })

  test('empty table shows NEmpty + CTA (ALT-01)', async ({ page, request }) => {
    test.setTimeout(180000)
    const token = await loginAs(request, 'admin@admin.com')
    await request.post('/api/master-data', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'e2e_empty', display_name: 'E2E Empty', columns: [{ name: 'nama', display_name: 'Nama', type: 'text' }] },
    })
    await page.goto('/login')
    await page.waitForSelector('input', { timeout: 30000 })
    await page.locator('input').first().fill('admin@admin.com')
    await page.locator('input').nth(1).fill('P455w0rd!!!')
    const loginBtn = page.getByRole('button', { name: /masuk/i })
    await loginBtn.waitFor({ state: 'visible', timeout: 20000 })
    await loginBtn.click({ force: true, timeout: 20000 })
    await expect(page).toHaveURL('/dashboard', { timeout: 30000 })
    await page.goto('/dashboard/master-data/e2e_empty')
    await expect(page.getByText('Belum ada data', { exact: false }).first()).toBeVisible({ timeout: 60000 })
    await request.delete('/api/master-data/e2e_empty', {
      headers: { Authorization: `Bearer ${token}` },
    })
  })
})
