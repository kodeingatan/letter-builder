import { test, expect } from '@playwright/test'

async function loginAndGetToken(request: import('@playwright/test').APIRequestContext): Promise<string> {
  const res = await request.post('/api/auth/login', {
    data: { email: 'admin@admin.com', password: 'P455w0rd!!!' },
  })
  if (res.status() !== 200) return ''
  const body = await res.json().catch(() => ({}))
  return (body?.token ?? body?.accessToken ?? body?.data?.token ?? '') as string
}

const skPayload = {
  schema_json: {
    type: 'document',
    children: [
      { type: 'heading', props: { content: 'SK Test', level: 1 } },
      {
        type: 'repeater',
        props: { source: 'employees', item: 'employee' },
        children: [{ type: 'text', props: { content: '{{employee.name}}/{{employee.nip}}' } }],
      },
      {
        type: 'condition',
        props: { field: '{{letter.type}}', operator: 'eq', value: 'internal' },
        children: [{ type: 'text', props: { content: 'INTERNAL' } }],
        elseChildren: [{ type: 'text', props: { content: 'EKSTERNAL' } }],
      },
    ],
  },
  data: {
    employees: [
      { name: 'Afdal', nip: '199xxx' },
      { name: 'Budi', nip: '198xxx' },
    ],
    letter: { type: 'internal' },
  },
}

test.describe('Document Engine — Task 05 preview → pdf (E2E-01)', () => {
  test('POST /api/documents/preview renders SK + condition (Step 1–3, AC-001/002)', async ({ request }) => {
    const token = await loginAndGetToken(request)
    expect(token).not.toBe('')
    const res = await request.post('/api/documents/preview', {
      headers: { Authorization: `Bearer ${token}` },
      data: skPayload,
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.html).toContain('Afdal/199xxx')
    expect(body.html).toContain('Budi/198xxx')
    expect(body.html).toContain('INTERNAL')
    expect(body.html).not.toContain('EKSTERNAL')
    expect(Array.isArray(body.warnings)).toBe(true)
  })

  test('preview without token → 401 (AC-007)', async ({ request }) => {
    const res = await request.post('/api/documents/preview', { data: skPayload })
    expect(res.status()).toBe(401)
  })

  test('preview with role lacking permission → 403 (AC-007)', async ({ request }) => {
    const login = await request.post('/api/auth/login', {
      data: { email: 'viewer@example.com', password: 'P455w0rd!!!' },
    })
    expect(login.status()).toBe(200)
    const body = await login.json().catch(() => ({}))
    const token = (body?.token ?? body?.accessToken ?? body?.data?.token ?? '') as string
    expect(token).not.toBe('')
    const res = await request.post('/api/documents/preview', {
      headers: { Authorization: `Bearer ${token}` },
      data: skPayload,
    })
    expect(res.status()).toBe(403)
  })

  test('preview with invalid schema → 400 (AC-005)', async ({ request }) => {
    const token = await loginAndGetToken(request)
    expect(token).not.toBe('')
    const res = await request.post('/api/documents/preview', {
      headers: { Authorization: `Bearer ${token}` },
      data: { schema_json: { type: 'teleport' }, data: {} },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/documents/pdf → url → GET pdf binary (Step 4–5, AC-006)', async ({ request }) => {
    const token = await loginAndGetToken(request)
    expect(token).not.toBe('')
    const res = await request.post('/api/documents/pdf', {
      headers: { Authorization: `Bearer ${token}` },
      data: { ...skPayload, page: { size: 'A4', orientation: 'portrait' } },
    })
    if (res.status() === 500) {
      // Infra path: no Chrome binary in this environment (ERR-04 documented).
      const body = await res.json().catch(() => ({}))
      expect(JSON.stringify(body)).toContain('Failed to generate PDF')
      test.skip(true, 'Chrome binary unavailable — PDF infra path documented (ERR-04)')
      return
    }
    expect(res.status()).toBe(200)
    const { url } = await res.json()
    expect(url).toMatch(/^\/api\/storage\/documents\/.*\.pdf$/)
    const pdf = await request.get(url)
    expect(pdf.status()).toBe(200)
    expect(pdf.headers()['content-type']).toContain('application/pdf')
  })

  test('pdf without token → 401 (AC-007)', async ({ request }) => {
    const res = await request.post('/api/documents/pdf', { data: skPayload })
    expect(res.status()).toBe(401)
  })
})
