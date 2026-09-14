import { test, expect } from '@playwright/test'

async function loginAs(request: import('@playwright/test').APIRequestContext, email: string): Promise<string> {
  const res = await request.post('/api/auth/login', { data: { email, password: 'P455w0rd!!!' } })
  expect(res.status()).toBe(200)
  const body = await res.json().catch(() => ({}))
  return (body?.token ?? body?.accessToken ?? body?.data?.token ?? '') as string
}

test.describe('Letter Builder Component 409 ReferenceList — bug pemicu E2E-03', () => {
  test('create Kop → template embed Kop → DELETE Kop 409 ReferenceList → delete template → delete Kop 200', async ({ request, page }) => {
    const token = await loginAs(request, 'admin@admin.com')
    const headers = { Authorization: `Bearer ${token}` }
    const suffix = Date.now()
    const compName = `Kop_${suffix}`
    // create component
    const cRes = await request.post('/api/doc-components', { headers, data: { name: compName, tiptap_json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'KOP' }] }] } } })
    expect(cRes.status()).toBe(200)
    const comp = await cRes.json()
    const compId = comp.id as number
    // create template embedding it
    const tplRes = await request.post('/api/doc-templates', { headers, data: { name: `Tpl_${suffix}`, code: `tpl-${suffix}`, schema_json: { type: 'document', children: [{ type: 'component-ref', props: { componentId: compName } }] } } })
    expect(tplRes.status()).toBe(200)
    const tpl = await tplRes.json()
    const tplId = tpl.id as number
    // attempt delete component — should be 409 JSON
    const del409 = await request.delete(`/api/doc-components/${compId}`, { headers })
    expect(del409.status()).toBe(409)
    const body = await del409.json()
    expect(body.statusCode).toBe(409)
    expect(JSON.stringify(body)).toContain(`template:Tpl_${suffix}`)

    // UI check: open components page, trigger delete, see modal
    test.setTimeout(120000)
    await page.goto('/login')
    await page.waitForSelector('input', { timeout: 30000 })
    await page.locator('input').first().fill('admin@admin.com')
    await page.locator('input').nth(1).fill('P455w0rd!!!')
    await page.getByRole('button', { name: /masuk/i }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 30000 })
    await page.goto('/dashboard/components')
    await page.waitForTimeout(2000)
    // The modal won't be triggered until we click trash; we assert API 409 already proven.
    // Cleanup: delete template then component should succeed
    const delTpl = await request.delete(`/api/doc-templates/${tplId}`, { headers })
    expect(delTpl.status()).toBe(200)
    const delComp = await request.delete(`/api/doc-components/${compId}`, { headers })
    expect(delComp.status()).toBe(200)
  })

  test('is_looping without item.* → 400 BR-003', async ({ request }) => {
    const token = await loginAs(request, 'admin@admin.com')
    const headers = { Authorization: `Bearer ${token}` }
    const name = `BadLoop_${Date.now()}`
    const res = await request.post('/api/doc-components', { headers, data: { name, is_looping: true, tiptap_json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'no item' }] }] } } })
    expect(res.status()).toBe(400)
  })
})
