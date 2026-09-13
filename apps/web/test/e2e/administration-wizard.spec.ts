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

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` })

const UID = `${Date.now().toString(36)}`

test.describe('Administration wizard — Task 07 (E2E-02)', () => {
  test('admin create → run 2-step → combined doc + runs list (Step 5–6, AC-005)', async ({ request }) => {
    const token = await loginAs(request, 'admin@admin.com')
    const headers = authHeaders(token)
    // Templates (reuse E2E SK when present, else create minimal pair)
    const mkTemplate = async (name: string, code: string, children: unknown[]) => {
      const res = await request.post('/api/doc-templates', {
        headers, data: { name, code, schema_json: { type: 'document', children } },
      })
      expect(res.status()).toBe(200)
      return (await res.json()).id as number
    }
    const skId = await mkTemplate(`E2E Wiz SK ${UID}`, `e2e-wiz-sk-${UID}`, [
      { type: 'heading', props: { content: 'SK {{letter.number}}', level: 1 } },
      {
        type: 'repeater', props: { source: 'employees', item: 'item' },
        children: [{ type: 'text', props: { content: '{{item.nama}}' } }],
      },
    ])
    const ttdId = await mkTemplate(`E2E Wiz TTD ${UID}`, `e2e-wiz-ttd-${UID}`, [
      { type: 'signature', props: { name: '{{signer.name}}', title: 'Kadis', city: 'Banda Aceh' } },
    ])
    const admin = await request.post('/api/administrations', {
      headers,
      data: {
        name: `E2E Wiz Admin ${UID}`,
        steps: [
          {
            template_id: skId, step_order: 0,
            mapping: {
              employees: { kind: 'master-list', ref: 'pegawai' },
              'letter.number': { kind: 'value', ref: '800/9' },
            },
          },
          { template_id: ttdId, step_order: 1, mapping: { 'signer.name': { kind: 'value', ref: 'H. Kadis' } } },
        ],
      },
    })
    expect(admin.status()).toBe(200)
    const adminBody = await admin.json()
    const run = await request.post(`/api/administrations/${adminBody.id}/runs`, {
      headers, data: { data: {}, document_number: `E2E/${UID}` },
    })
    expect(run.status()).toBe(200)
    const runBody = await run.json()
    expect(runBody.html).toContain('800/9')
    expect(runBody.html).toContain('doc-pagebreak')
    expect(runBody.document.status === 'FINAL' || runBody.pdfError !== null).toBe(true)
    const runs = await request.get(`/api/administrations/${adminBody.id}/runs`, { headers })
    expect((await runs.json()).total).toBeGreaterThanOrEqual(1)
    // Cancel preserves history
    const cancel = await request.delete(`/api/documents/${runBody.document.id}`, { headers })
    expect((await cancel.json()).status).toBe('CANCELLED')
    // Duplicate document_number → 409
    const dupe = await request.post(`/api/administrations/${adminBody.id}/runs`, {
      headers, data: { data: {}, document_number: `E2E/${UID}` },
    })
    expect(dupe.status()).toBe(409)
  })

  test('protection: incomplete mapping 400, delete used 409, RBAC 401/403 (AC-006/007)', async ({ request }) => {
    const token = await loginAs(request, 'admin@admin.com')
    const headers = authHeaders(token)
    const list = await request.get('/api/administrations', { headers })
    const admin = (await list.json()).data.find((a: { name: string }) => a.name === `E2E Wiz Admin ${UID}`)
    expect(admin).toBeTruthy()
    // Incomplete mapping → 400 (DR-002)
    const badRun = await request.post(`/api/administrations/${admin.id}/runs`, { headers, data: { data: {} } })
    // employees/letter mappings exist → may succeed; force incompleteness via extra step
    const templates = await request.get('/api/doc-templates', { headers })
    const ttd = (await templates.json()).data.find((t: { name: string }) => t.name === `E2E Wiz TTD ${UID}`)
    const incomplete = await request.post(`/api/administrations/${admin.id}/runs`, {
      headers,
      data: {
        data: {},
        extra_steps: [{ template_id: ttd.id, mapping: {} }],
      },
    })
    expect(incomplete.status()).toBe(400)
    void badRun
    // Delete template used by steps → 409
    const sk = (await templates.json()).data.find((t: { name: string }) => t.name === `E2E Wiz SK ${UID}`)
    const delUsed = await request.delete(`/api/doc-templates/${sk.id}`, { headers })
    expect(delUsed.status()).toBe(409)
    // RBAC
    expect((await request.get('/api/doc-templates')).status()).toBe(401)
    const viewer = await loginAs(request, 'viewer@example.com')
    expect((await request.post('/api/doc-templates', {
      headers: authHeaders(viewer), data: { name: 'X', code: 'x', schema_json: { type: 'document', children: [] } },
    })).status()).toBe(403)
  })

  test('wizard UI renders per-letter menu (Step 6 UI)', async ({ page }) => {
    test.setTimeout(240000)
    await page.goto('/login')
    await page.waitForSelector('input', { timeout: 30000 })
    await page.locator('input').first().fill('admin@admin.com')
    await page.locator('input').nth(1).fill('P455w0rd!!!')
    const btn = page.getByRole('button', { name: /masuk/i })
    await btn.waitFor({ state: 'visible', timeout: 20000 })
    await btn.click({ force: true, timeout: 20000 })
    await expect(page).toHaveURL('/dashboard', { timeout: 30000 })
    await page.goto('/dashboard/documents/sk-pengangkatan-demo')
    await expect(page.getByText('Wizard', { exact: false }).first()).toBeVisible({ timeout: 60000 })
    await expect(page.getByText('Riwayat Run', { exact: false }).first()).toBeVisible({ timeout: 60000 })
  })
})
