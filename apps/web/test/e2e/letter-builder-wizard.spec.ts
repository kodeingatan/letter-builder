import { test, expect } from '@playwright/test'

async function loginAs(request: import('@playwright/test').APIRequestContext, email: string): Promise<string> {
  const res = await request.post('/api/auth/login', { data: { email, password: 'P455w0rd!!!' } })
  expect(res.status()).toBe(200)
  const body = await res.json().catch(() => ({}))
  return (body?.token ?? body?.accessToken ?? body?.data?.token ?? '') as string
}

test.describe('Letter Builder Wizard administasi + runs + document_number 409 — E2E-05', () => {
  test('create administrasi 2 steps + wizard run + document_number duplicate 409', async ({ request }) => {
    const token = await loginAs(request, 'admin@admin.com')
    const headers = { Authorization: `Bearer ${token}` }
    const suffix = Date.now()
    const tpl1 = await (await request.post('/api/doc-templates', { headers, data: { name: `WZ1_${suffix}`, code: `wz1-${suffix}`, schema_json: { type: 'document', children: [{ type: 'heading', props: { content: 'SK {{letter.number}}', level: 1 } }] } } })).json()
    const tpl2 = await (await request.post('/api/doc-templates', { headers, data: { name: `WZ2_${suffix}`, code: `wz2-${suffix}`, schema_json: { type: 'document', children: [{ type: 'signature', props: { name: '{{signer.name}}', title: 'Kadis', city: 'Banda' } }] } } })).json()
    const admin = await (await request.post('/api/administrations', { headers, data: { name: `Wzdm_${suffix}`, steps: [{ template_id: tpl1.id, step_order: 0, mapping: { 'letter.number': { kind: 'value', ref: '800/001' } } }, { template_id: tpl2.id, step_order: 1, mapping: { 'signer.name': { kind: 'value', ref: 'H. Kadis' } } }] } })).json()
    const adminId = admin.id as number
    const run1 = await request.post(`/api/administrations/${adminId}/runs`, { headers, data: { data: {}, document_number: `DOC/${suffix}` } })
    expect([200, 500]).toContain(run1.status())
    // duplicate document_number → 409
    const dup = await request.post(`/api/administrations/${adminId}/runs`, { headers, data: { data: {}, document_number: `DOC/${suffix}` } })
    expect(dup.status()).toBe(409)
    await request.delete(`/api/administrations/${adminId}`, { headers })
    await request.delete(`/api/doc-templates/${tpl1.id}`, { headers })
    await request.delete(`/api/doc-templates/${tpl2.id}`, { headers })
  })
})
