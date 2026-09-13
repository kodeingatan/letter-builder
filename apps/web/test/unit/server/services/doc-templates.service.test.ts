import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { DataSource } from 'typeorm'

let testDs: DataSource
vi.mock('../../../../server/utils/db', () => ({
  getDataSource: () => Promise.resolve(testDs),
}))

import { DocTemplatesService } from '../../../../server/services/doc-templates.service'
import { DocComponentsService } from '../../../../server/services/doc-components.service'
import { DocTemplateSchema } from '../../../../server/entities/doc-template.entity'
import { DocComponentSchema } from '../../../../server/entities/doc-component.entity'
import { AdministrationSchema } from '../../../../server/entities/administration.entity'
import { AdminStepSchema } from '../../../../server/entities/admin-step.entity'
import { setBrowserLauncher } from '../../../../server/services/pdf.service'

const skTree = {
  type: 'document',
  children: [
    { type: 'heading', props: { content: 'SK {{letter.number}}', level: 1 } },
    {
      type: 'repeater', props: { source: 'employees', item: 'item' },
      children: [{ type: 'text', props: { content: '{{item.nama}}' } }],
    },
  ],
}

describe('doc-templates.service — CRUD + publish/version (UT-02, BR-002/005, AC-006)', () => {
  beforeAll(async () => {
    testDs = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [DocTemplateSchema, DocComponentSchema, AdministrationSchema, AdminStepSchema],
      synchronize: true,
    })
    await testDs.initialize()
  })
  afterAll(async () => { await testDs.destroy() })

  it('creates drafts with valid DocNode trees (INV-001)', async () => {
    const t = await DocTemplatesService.create({ name: 'SK', code: 'sk', schema_json: skTree } as never)
    expect((t as { status: string }).status).toBe('DRAFT')
    expect((t as { version: number }).version).toBe(1)
  })

  it('rejects duplicate name/code (409) and invalid trees (400)', async () => {
    await expect(DocTemplatesService.create({ name: 'SK', code: 'sk2', schema_json: skTree } as never)).rejects.toMatchObject({ statusCode: 409 })
    await expect(DocTemplatesService.create({ name: 'SK2', code: 'sk', schema_json: skTree } as never)).rejects.toMatchObject({ statusCode: 409 })
    await expect(DocTemplatesService.create({ name: 'Bad', code: 'bad', schema_json: { type: 'teleport' } } as never)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('publishes with version bump; republish keeps version', async () => {
    const t = await DocTemplatesService.findOne(1) as { version: number }
    const pub = await DocTemplatesService.update(1, { status: 'PUBLISHED' }) as { version: number; status: string }
    expect(pub.status).toBe('PUBLISHED')
    expect(pub.version).toBe(t.version + 1)
    const again = await DocTemplatesService.update(1, { description: 'x' }) as { version: number }
    expect(again.version).toBe(pub.version)
  })

  it('editing a PUBLISHED schema bumps the version (BR-005)', async () => {
    const before = await DocTemplatesService.findOne(1) as { version: number }
    const changed = { ...skTree, children: [...skTree.children, { type: 'divider' }] }
    const updated = await DocTemplatesService.update(1, { schema_json: changed }) as { version: number }
    expect(updated.version).toBe(before.version + 1)
  })

  it('rejects publish without content blocks and bad transitions', async () => {
    const empty = await DocTemplatesService.create({
      name: 'Kosong', code: 'kosong',
      schema_json: { type: 'document', children: [{ type: 'footer', children: [] }] },
    } as never)
    await expect(DocTemplatesService.update((empty as { id: number }).id, { status: 'PUBLISHED' })).rejects.toMatchObject({ statusCode: 400 })
    await expect(DocTemplatesService.update(1, { status: 'DRAFT' })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('formSchema lists non-scoped requirements (FR-005, AC-003)', async () => {
    const form = await DocTemplatesService.formSchema(1)
    expect(form.requirements.map((r) => r.path)).toContain('letter.number')
    expect(form.scoped).toContain('item.nama')
  })

  it('preview renders with component registry', async () => {
    await DocComponentsService.create({
      name: 'Kop',
      tiptap_json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'KOP' }] }] },
    })
    const { html } = await DocTemplatesService.preview(1, {
      letter: { number: '800/1' },
      employees: [{ nama: 'Afdal' }],
    })
    expect(html).toContain('800/1')
    expect(html).toContain('Afdal')
  })

  it('previewPdf delegates to the engine (mocked browser, AC-004)', async () => {
    setBrowserLauncher(async () => ({
      newPage: async () => ({ setContent: async () => {}, pdf: async () => new Uint8Array([1, 2, 3]), close: async () => {} }),
      close: async () => {},
    }) as never)
    try {
      const result = await DocTemplatesService.previewPdf(1, { data: { letter: { number: 'X' }, employees: [] } })
      expect(result.url).toMatch(/\.pdf$/)
    } finally {
      setBrowserLauncher(null)
    }
  })

  it('blocks delete of templates used by steps (409, BR-004)', async () => {
    const ds = testDs
    const adminRepo = ds.getRepository(AdministrationSchema)
    const admin = await adminRepo.save(adminRepo.create({ name: 'Adm', slug: 'adm', description: null }))
    const adminId = (admin as unknown as { id: number }).id
    await ds.getRepository(AdminStepSchema).save(
      ds.getRepository(AdminStepSchema).create({ adminId, templateId: 1, stepOrder: 0, mappingJson: '{}' }),
    )
    await expect(DocTemplatesService.remove(1)).rejects.toMatchObject({ statusCode: 409 })
    await ds.getRepository(AdminStepSchema).createQueryBuilder().delete().where('templateId = :id', { id: 1 }).execute()
    await adminRepo.createQueryBuilder().delete().where('id = :id', { id: adminId }).execute()
    await expect(DocTemplatesService.remove(2)).resolves.toMatchObject({ id: 2 })
  })
})
