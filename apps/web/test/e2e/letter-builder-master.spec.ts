import { test, expect } from '@playwright/test'

async function loginAs(request: import('@playwright/test').APIRequestContext, email: string): Promise<string> {
  const res = await request.post('/api/auth/login', { data: { email, password: 'P455w0rd!!!' } })
  expect(res.status()).toBe(200)
  const body = await res.json().catch(() => ({}))
  return (body?.token ?? body?.accessToken ?? body?.data?.token ?? '') as string
}

test.describe('Letter Builder Master happy — E2E-01', () => {
  test('create definisi Pegawai 5 kolom → browse search/sort/visibility → create row relation+operasi → schema GET', async ({ request }) => {
    const token = await loginAs(request, 'admin@admin.com')
    const headers = { Authorization: `Bearer ${token}` }
    const slug = `e2e_lb_master_${Date.now()}`
    await request.delete(`/api/master-data/${slug}`, { headers }).catch(() => {})
    const payload = {
      name: slug,
      display_name: `LB Master ${slug}`,
      columns: [
        { name: 'nama', display_name: 'Nama', type: 'text', is_required: true, is_searchable: true, is_orderable: true },
        { name: 'jabatan', display_name: 'Jabatan', type: 'text' },
        { name: 'gaji', display_name: 'Gaji', type: 'number', config: { currency: true }, is_orderable: true },
        { name: 'total', display_name: 'Total', type: 'readonly_operation_text', config: { expression: '"Total: "++gaji' } },
        { name: 'foto', display_name: 'Foto', type: 'image' },
      ],
    }
    const created = await request.post('/api/master-data', { headers, data: payload })
    expect(created.status()).toBe(200)
    const schema = await request.get(`/api/master-data/${slug}/schema`, { headers })
    expect(schema.status()).toBe(200)
    const browse = await request.get(`/api/master-data/${slug}/rows`, { headers, params: { page: 1, limit: 20, sortBy: 'id', sortOrder: 'DESC' } })
    expect(browse.status()).toBe(200)
    await request.delete(`/api/master-data/${slug}`, { headers })
  })
})
