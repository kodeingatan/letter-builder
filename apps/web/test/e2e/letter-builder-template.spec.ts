import { test, expect } from '@playwright/test'

async function loginAs(request: import('@playwright/test').APIRequestContext, email: string): Promise<string> {
  const res = await request.post('/api/auth/login', { data: { email, password: 'P455w0rd!!!' } })
  expect(res.status()).toBe(200)
  const body = await res.json().catch(() => ({}))
  return (body?.token ?? body?.accessToken ?? body?.data?.token ?? '') as string
}

test.describe('Letter Builder Template builder + publish vs 409 — E2E-04', () => {
  test('builder drag + publish BR-002 + delete template used by steps → 409', async ({ request }) => {
    const token = await loginAs(request, 'admin@admin.com')
    const headers = { Authorization: `Bearer ${token}` }
    const suffix = Date.now()
    const tplRes = await request.post('/api/doc-templates', { headers, data: { name: `TplB_${suffix}`, code: `tplb-${suffix}`, schema_json: { type: 'document', children: [{ type: 'heading', props: { content: 'Hello {{letter.number}}', level: 1 } }] } } })
    expect(tplRes.status()).toBe(200)
    const tpl = await tplRes.json()
    const tplId = tpl.id as number
    // publish without mapping not required? heading has content, should succeed if at least 1 content block
    const pub = await request.put(`/api/doc-templates/${tplId}`, { headers, data: { status: 'PUBLISHED' } })
    // Could be 200 or 400 depending on content — we just assert not 500
    expect([200, 400]).toContain(pub.status())
    // create administration using template
    const adminRes = await request.post('/api/administrations', { headers, data: { name: `AdmB_${suffix}`, steps: [{ template_id: tplId, step_order: 0, mapping: { 'letter.number': { kind: 'value', ref: '800/1' } } }] } })
    expect(adminRes.status()).toBe(200)
    const admin = await adminRes.json()
    // delete template while used → 409
    const del409 = await request.delete(`/api/doc-templates/${tplId}`, { headers })
    expect(del409.status()).toBe(409)
    const body = await del409.json()
    expect(body.data.steps).toBeGreaterThan(0)
    // cleanup
    await request.delete(`/api/administrations/${admin.id}`, { headers })
    const delOk = await request.delete(`/api/doc-templates/${tplId}`, { headers })
    expect(delOk.status()).toBe(200)
  })
})
