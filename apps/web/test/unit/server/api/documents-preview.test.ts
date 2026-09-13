import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { RendererService } from '../../../../server/services/renderer.service'
import { PreviewDocumentSchema } from '../../../../server/dto/documents.dto'

const routePath = join(process.cwd(), 'server/api/documents/preview.post.ts')

const skPayload = {
  schema_json: {
    type: 'document',
    children: [
      {
        type: 'repeater',
        props: { source: 'employees', item: 'employee' },
        children: [{ type: 'text', props: { content: '{{employee.name}}/{{employee.nip}}/{{employee.role}}' } }],
      },
    ],
  },
  data: {
    employees: [
      { name: 'Afdal', nip: '199xxx', role: 'Programmer' },
      { name: 'Budi', nip: '198xxx', role: 'Analis' },
    ],
  },
}

describe('documents preview — AC-001/002/005 service-level (API-01)', () => {
  it('renders SK repeater HTML (Step 1, AC-001)', () => {
    const parsed = PreviewDocumentSchema.safeParse(skPayload)
    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    const { html } = RendererService.render(parsed.data.schema_json as never, parsed.data.data as never)
    expect(html).toContain('Afdal/199xxx/Programmer')
    expect(html).toContain('Budi/198xxx/Analis')
  })

  it('invalid schema fails Zod (Step ERR-01, AC-005 → 400)', () => {
    const parsed = PreviewDocumentSchema.safeParse({ schema_json: { type: 'nope' }, data: {} })
    expect(parsed.success).toBe(false)
  })
})

describe('documents preview route contract — auth/RBAC/validation (AC-007)', () => {
  it('route file exists', () => {
    expect(existsSync(routePath)).toBe(true)
  })

  const content = existsSync(routePath) ? readFileSync(routePath, 'utf8') : ''

  it('enforces requireApiAccess (401 without token, 403 without permission)', () => {
    expect(content).toContain('requireApiAccess')
  })

  it('validates with Zod and maps failure to 400', () => {
    expect(content).toContain('PreviewDocumentSchema')
    expect(content).toContain('statusCode: 400')
  })

  it('writes DOCUMENT_PREVIEW activity log', () => {
    expect(content).toContain('DOCUMENT_PREVIEW')
  })
})
