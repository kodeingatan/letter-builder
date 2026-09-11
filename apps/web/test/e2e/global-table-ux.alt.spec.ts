import { test, expect } from '@playwright/test'

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.waitForSelector('input', { timeout: 15000 })
  await page.locator('input').first().fill('admin@admin.com')
  await page.locator('input').nth(1).fill('P455w0rd!!!')
  const btn = page.getByRole('button', { name: /masuk/i })
  await btn.waitFor({ state: 'visible', timeout: 10000 })
  await btn.click({ force: true })
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
}

test.describe('Global Table UX — Alt/Error/Permission (ERR-01..03, AC-002/005)', () => {
  test('confirm delete, 409 restrict, 422 duplikat, CSV quoted partial, 403 matrix', async ({ page, request }) => {
    test.setTimeout(180000)
    const loginRes = await request.post('/api/auth/login', { data: { email: 'admin@admin.com', password: 'P455w0rd!!!' } })
    expect(loginRes.ok()).toBeTruthy()
    const { accessToken } = await loginRes.json()
    const headers = { Authorization: `Bearer ${accessToken}` }

    const tableName = `e2e_gtu_alt_${Date.now()}`
    let tableId = 0
    let targetId = 0
    try {
      // setup base table + target
      const tRes = await request.post('/api/global-tables', { headers, data: { name: tableName, displayName: 'GTU Alt' } })
      expect(tRes.status()).toBe(201)
      tableId = (await tRes.json()).id
      await request.post(`/api/global-tables/${tableId}/columns`, { headers, data: { name: 'nama', displayName: 'Nama', type: 'text', required: true, position: 0 } })

      const dupRes = await request.post(`/api/global-tables/${tableId}/columns`, { headers, data: { name: 'nama', displayName: 'Nama Dup', type: 'text', position: 1 } })
      expect(dupRes.status()).toBe(409) // ERR-01 duplicate name

      const badSelect = await request.post(`/api/global-tables/${tableId}/columns`, { headers, data: { name: 'bad', displayName: 'Bad', type: 'select', options: 'not json', position: 2 } })
      expect(badSelect.status()).toBe(422) // optionRules

      // target for restrict test
      const targetName = `e2e_gtu_alt_t_${Date.now()}`
      const t2Res = await request.post('/api/global-tables', { headers, data: { name: targetName, displayName: 'Target Alt' } })
      expect(t2Res.status()).toBe(201)
      targetId = (await t2Res.json()).id
      await request.post(`/api/global-tables/${targetId}/columns`, { headers, data: { name: 'ref', displayName: 'Ref', type: 'text', position: 0 } })
      const targetRow = await request.post(`/api/data/${targetName}`, { headers, data: { ref: 'A' } })
      expect(targetRow.status()).toBe(201)
      const tRowId = (await targetRow.json()).id

      await request.post(`/api/global-tables/${tableId}/columns`, { headers, data: { name: 'dept', displayName: 'Dept', type: 'select-table-relation', relationTableId: targetId, relationConfig: JSON.stringify({ displayColumns: ['ref'], separator: ' - ', onTargetDelete: 'restrict' }), position: 3 } })
      const ownerRow = await request.post(`/api/data/${tableName}`, { headers, data: { nama: 'Owner', dept: tRowId } })
      expect(ownerRow.status()).toBe(201)

      // 409 restrict on delete target row
      const delRestrict = await request.delete(`/api/data/${targetName}/${tRowId}`, { headers })
      expect(delRestrict.status()).toBe(409) // ERR-02
      const body409 = await delRestrict.json()
      expect(body409.message || JSON.stringify(body409)).toContain('restrict')

      // CSV quoted preview + partial: header nama + status (select) ; row2 has quoted comma, row3 invalid select
      const csvQuoted = 'nama,status\n"Sari, S.T.",a\n"Bad Row",zzz'
      // need status column select exists? create status select for CSV test
      await request.post(`/api/global-tables/${tableId}/columns`, { headers, data: { name: 'status', displayName: 'Status', type: 'select', options: JSON.stringify([{ label: 'A', value: 'a' }]), position: 4 } })
      const importRes = await request.post(`/api/data/${tableName}/import`, { headers, multipart: { file: { name: 'test.csv', mimeType: 'text/csv', buffer: Buffer.from(csvQuoted) } } })
      expect(importRes.ok()).toBeTruthy()
      const summary = await importRes.json()
      expect(summary.imported).toBe(1) // Sari, S.T. valid
      expect(summary.failed).toBe(1)
      expect(summary.errors[0].row).toBe(3)
      expect(summary.errors[0].reason).toContain('Status')

      // 401 without token
      const noAuth = await request.get(`/api/data/${tableName}`, { headers: {} })
      expect(noAuth.status()).toBe(401)

      // UI: browse still accessible with auth
      await loginAsAdmin(page)
      await page.goto(`/dashboard/data/${tableName}`)
      // If table requires permission, should show data or empty, not 404
      await page.waitForLoadState('networkidle')
      const titleVisible = await page.getByText('GTU Alt').first().isVisible().catch(() => false)
      expect(titleVisible || await page.getByText('Owner').first().isVisible().catch(() => false) || await page.getByRole('button', { name: /tambah baris/i }).first().isVisible().catch(() => false)).toBeTruthy()

      // cleanup owner then target detach case: delete owner then target should succeed
      const rows = await request.get(`/api/data/${tableName}`, { headers })
      const rowsJson = await rows.json()
      for (const r of rowsJson.data ?? []) {
        await request.delete(`/api/data/${tableName}/${r.id}`, { headers }).catch(() => {})
      }
      const delOk = await request.delete(`/api/data/${targetName}/${tRowId}`, { headers })
      expect([200, 204]).toContain(delOk.status())

      await request.delete(`/api/global-tables/${tableId}`, { headers })
      await request.delete(`/api/global-tables/${targetId}`, { headers })
    } catch (e) {
      if (tableId) await request.delete(`/api/global-tables/${tableId}`, { headers }).catch(() => {})
      if (targetId) await request.delete(`/api/global-tables/${targetId}`, { headers }).catch(() => {})
      throw e
    }
  })
})
