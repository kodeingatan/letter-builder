import { test, expect } from '@playwright/test'

async function loginAs(request: import('@playwright/test').APIRequestContext, email: string): Promise<string> {
  const res = await request.post('/api/auth/login', {
    data: { email, password: 'P455w0rd!!!' },
  })
  expect(res.status()).toBe(200)
  const body = await res.json().catch(() => ({}))
  const token = (body?.token ?? body?.accessToken ?? body?.data?.token ?? '') as string
  expect(token).not.toBe('')
  return token
}

const SLUG = 'e2e_pegawai'

const tablePayload = {
  name: SLUG,
  display_name: 'E2E Pegawai',
  columns: [
    { name: 'nama', display_name: 'Nama', type: 'text', is_required: true, is_searchable: true, is_orderable: true },
    { name: 'gaji', display_name: 'Gaji', type: 'number', config: { currency: true }, is_orderable: true },
    { name: 'total_info', display_name: 'Info Total', type: 'readonly_operation_text', config: { expression: '"Total: "++gaji' } },
  ],
}

test.describe('Master Data — Task 06 definisi → browse (E2E-01)', () => {
  test('POST /api/master-data creates mst table (Step 2, AC-001)', async ({ request }) => {
    const token = await loginAs(request, 'admin@admin.com')
    await request.delete('/api/master-data/e2e_pegawai', {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
    const res = await request.post('/api/master-data', {
      headers: { Authorization: `Bearer ${token}` },
      data: tablePayload,
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.slug).toBe(SLUG)
    expect(body.columns.length).toBe(3)
  })

  test('rows: create with server operation + search + sort (Step 3–4, AC-002/004)', async ({ request }) => {
    const token = await loginAs(request, 'admin@admin.com')
    const headers = { Authorization: `Bearer ${token}` }
    for (const [nama, gaji] of [['Afdal', 2000000], ['Budi', 1500000], ['Citra', 5000000]] as const) {
      const res = await request.post(`/api/master-data/${SLUG}/rows`, { headers, data: { nama, gaji } })
      expect(res.status()).toBe(200)
      const row = await res.json()
      expect(row.total_info).toBe(`Total: ${gaji}`)
    }
    const searched = await request.get(`/api/master-data/${SLUG}/rows`, {
      headers, params: { search: 'afd' },
    })
    expect(searched.status()).toBe(200)
    const searchBody = await searched.json()
    expect(searchBody.total).toBe(1)
    expect(searchBody.data[0].nama).toBe('Afdal')
    const sorted = await request.get(`/api/master-data/${SLUG}/rows`, {
      headers, params: { sortBy: 'gaji', sortOrder: 'DESC' },
    })
    const sortBody = await sorted.json()
    expect(sortBody.data[0].nama).toBe('Citra')
  })

  test('relations: single + multiple validate targets (AC-003, FR-005)', async ({ request }) => {
    const token = await loginAs(request, 'admin@admin.com')
    const headers = { Authorization: `Bearer ${token}` }
    await request.post('/api/master-data', {
      headers,
      data: { name: 'e2e_jabatan', display_name: 'E2E Jabatan', columns: [{ name: 'nama', display_name: 'Nama', type: 'text', is_searchable: true }] },
    })
    const parent = await request.post('/api/master-data/e2e_jabatan/rows', { headers, data: { nama: 'Programmer' } })
    expect(parent.status()).toBe(200)
    const parentId = (await parent.json()).id
    await request.post('/api/master-data', {
      headers,
      data: {
        name: 'e2e_pegawai_rel', display_name: 'E2E Pegawai Rel',
        columns: [
          { name: 'nama', display_name: 'Nama', type: 'text' },
          { name: 'jabatan_id', display_name: 'Jabatan', type: 'relation_single', config: { target_slug: 'e2e_jabatan', display_column: 'nama' } },
          { name: 'atasan_ids', display_name: 'Atasan', type: 'relation_multiple', config: { target_slug: 'e2e_jabatan' } },
        ],
      },
    })
    const child = await request.post('/api/master-data/e2e_pegawai_rel/rows', {
      headers, data: { nama: 'Afdal', jabatan_id: parentId, atasan_ids: [parentId] },
    })
    expect(child.status()).toBe(200)
    const childBody = await child.json()
    expect(childBody.jabatan_id).toBe(parentId)
    expect(childBody.atasan_ids).toEqual([parentId])
    const badRef = await request.post('/api/master-data/e2e_pegawai_rel/rows', {
      headers, data: { nama: 'Ghost', jabatan_id: 999999 },
    })
    expect(badRef.status()).toBe(400)
    await request.delete('/api/master-data/e2e_pegawai_rel', { headers })
    await request.delete('/api/master-data/e2e_jabatan', { headers })
  })

  test('GET schema exposes columns for builder (Step 5, AC-006)', async ({ request }) => {
    const token = await loginAs(request, 'admin@admin.com')
    const res = await request.get(`/api/master-data/${SLUG}/schema`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.slug).toBe(SLUG)
    expect(body.columns.map((c: { name: string }) => c.name)).toContain('total_info')
  })

  test('UI pages render: list + browse + create (Step 1/3)', async ({ page }) => {
    test.setTimeout(180000)
    await page.goto('/login')
    await page.waitForSelector('input', { timeout: 30000 })
    await page.locator('input').first().fill('admin@admin.com')
    await page.locator('input').nth(1).fill('P455w0rd!!!')
    const btn = page.getByRole('button', { name: /masuk/i })
    await btn.waitFor({ state: 'visible', timeout: 20000 })
    await btn.click({ force: true, timeout: 20000 })
    await expect(page).toHaveURL('/dashboard', { timeout: 30000 })

    await page.goto('/dashboard/master-data')
    await expect(page.getByText('Master Data', { exact: false }).first()).toBeVisible({ timeout: 60000 })

    await page.goto(`/dashboard/master-data/${SLUG}`)
    await expect(page.getByText('Afdal', { exact: false }).first()).toBeVisible({ timeout: 60000 })

    await page.goto('/dashboard/master-data/create')
    await expect(page.getByText('Nama internal')).toBeVisible({ timeout: 60000 })
  })
})
