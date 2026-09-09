import { test, expect } from '@playwright/test'

/**
 * Task 12 — Global Table Data & Generated CRUD (Pegawai fixture).
 *
 * API-driven end-to-end coverage: table + columns setup, row CRUD,
 * validation, search/sort scoping (BR-002 incl. NOT_SEARCHABLE /
 * NOT_ORDERABLE), defaultValue prefill, CSV import/export with per-row
 * errors (AC-004), a generated-browse UI smoke check (AC-001), and
 * cascade cleanup on table delete (no orphan rows/columns).
 */

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

test.describe('Table Data — Pegawai generated CRUD', () => {
  // API + UI + dev-server boot in one flow needs more than the 60s default.
  test('full CRUD + validation + CSV import/export + cascade cleanup', async ({ page, request }) => {
    test.setTimeout(180000);
    // API token (UI login pattern is covered by the browse check below).
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'admin@admin.com', password: 'P455w0rd!!!' },
    })
    expect(loginRes.ok()).toBeTruthy()
    const { accessToken } = await loginRes.json()
    const headers = { Authorization: `Bearer ${accessToken}` }

    const tableName = `e2e_pegawai_${Date.now()}`
    let tableId = 0
    let rowId = 0

    try {
      // --- setup: table + columns ---
      const tableRes = await request.post('/api/global-tables', {
        headers,
        data: { name: tableName, displayName: 'E2E Pegawai' },
      })
      expect(tableRes.status()).toBe(201)
      tableId = (await tableRes.json()).id
      expect(tableId).toBeGreaterThan(0)

      const columns = [
        { name: 'nama', displayName: 'Nama', type: 'text', required: true, searchable: true, orderable: true },
        { name: 'nik', displayName: 'NIK', type: 'text', required: false, searchable: false, orderable: false },
        { name: 'umur', displayName: 'Umur', type: 'number', required: false, searchable: false, orderable: true },
        { name: 'gelar', displayName: 'Gelar', type: 'text', required: false, searchable: false, orderable: false, defaultValue: 'Staff' },
      ]
      for (const [i, col] of columns.entries()) {
        const colRes = await request.post(`/api/global-tables/${tableId}/columns`, {
          headers,
          data: { ...col, position: i },
        })
        expect([200, 201]).toContain(colRes.status())
      }

      // --- create: defaultValue fills omitted optional column ---
      const createRes = await request.post(`/api/data/${tableName}`, {
        headers,
        data: { nama: 'Budi', umur: 30 },
      })
      expect(createRes.status()).toBe(201)
      const created = await createRes.json()
      rowId = created.id
      expect(rowId).toBeGreaterThan(0)
      expect(created.nama).toBe('Budi')
      expect(created.gelar).toBe('Staff')

      // --- browse: defaultValue is exposed in the column payload ---
      const browseRes = await request.get(`/api/data/${tableName}`, { headers })
      expect(browseRes.ok()).toBeTruthy()
      const browse = await browseRes.json()
      expect(browse.total).toBe(1)
      expect(browse.columns.find((c: any) => c.name === 'gelar')?.defaultValue).toBe('Staff')

      // --- field-specific search on searchable column (BR-002) ---
      const fieldSearch = await request.get(`/api/data/${tableName}?search=budi&searchField=nama`, { headers })
      expect(fieldSearch.ok()).toBeTruthy()
      expect((await fieldSearch.json()).total).toBe(1)

      // --- field-specific search on NON-searchable column → 422 ---
      const badField = await request.get(`/api/data/${tableName}?search=x&searchField=nik`, { headers })
      expect(badField.status()).toBe(422)
      expect((await badField.json()).data?.code ?? (await badField.json()).code).toBeDefined()

      // --- sort on non-orderable column → 422 NOT_ORDERABLE (AC-005) ---
      const badSort = await request.get(`/api/data/${tableName}?sortBy=nik&sortOrder=ASC`, { headers })
      expect(badSort.status()).toBe(422)

      // --- update: partial payload keeps other values (200) ---
      const updateRes = await request.put(`/api/data/${tableName}/${rowId}`, {
        headers,
        data: { umur: 31 },
      })
      expect(updateRes.status()).toBe(200)
      expect((await updateRes.json()).umur).toBe(31)

      const oneRes = await request.get(`/api/data/${tableName}/${rowId}`, { headers })
      expect(oneRes.ok()).toBeTruthy()
      expect((await oneRes.json()).nama).toBe('Budi')

      // --- validation: required violation persists nothing (AC-002) ---
      const invalidRes = await request.post(`/api/data/${tableName}`, { headers, data: { umur: 20 } })
      expect(invalidRes.status()).toBe(422)

      // --- CSV import: 1 good + 1 bad row → partial summary (AC-004) ---
      const csv = 'nama,umur,gelar\nSari,25,Manager\nBroken,abc,Staff'
      const importRes = await request.post(`/api/data/${tableName}/import`, {
        headers,
        multipart: { file: { name: 'pegawai.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) } },
      })
      expect(importRes.ok()).toBeTruthy()
      const summary = await importRes.json()
      expect(summary.imported).toBe(1)
      expect(summary.failed).toBe(1)
      expect(summary.errors[0].row).toBe(3)

      // --- CSV export streams the rows ---
      const exportRes = await request.get(`/api/data/${tableName}/export?format=csv`, { headers })
      expect(exportRes.ok()).toBeTruthy()
      const exported = await exportRes.text()
      expect(exported).toContain('nama')
      expect(exported).toContain('Budi')
      expect(exported).toContain('Sari')

      // --- generated browse UI renders with zero custom code (AC-001) ---
      await loginAsAdmin(page)
      await page.goto(`/dashboard/data/${tableName}`)
      // NOTE: no networkidle — the page polls; auto-waiting expects are enough.
      await expect(page.getByRole('button', { name: /add row/i })).toBeVisible({ timeout: 20000 })
      await expect(page.getByText('Budi').first()).toBeVisible({ timeout: 20000 })
    } finally {
      // --- cleanup: table delete cascades rows + columns (must-fix) ---
      if (tableId) {
        const delTable = await request.delete(`/api/global-tables/${tableId}`, { headers })
        expect([200, 204]).toContain(delTable.status())
        const colsAfter = await request.get(`/api/global-tables/${tableId}/columns`, { headers })
        expect(colsAfter.ok()).toBeTruthy()
        const colsBody = await colsAfter.json()
        expect(colsBody.total ?? colsBody.data?.length ?? -1).toBe(0)
        const browseAfter = await request.get(`/api/data/${tableName}`, { headers })
        expect(browseAfter.status()).toBe(404)
      }
    }
  })
})
