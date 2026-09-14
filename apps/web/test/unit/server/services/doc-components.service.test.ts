import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { DataSource } from 'typeorm'

let testDs: DataSource
vi.mock('../../../../server/utils/db', () => ({
  getDataSource: () => Promise.resolve(testDs),
}))

import { DocComponentsService } from '../../../../server/services/doc-components.service'
import { DocTemplateSchema } from '../../../../server/entities/doc-template.entity'
import { DocComponentSchema } from '../../../../server/entities/doc-component.entity'

describe('doc-components.service — 409 + findReferences + looping BR-003 (UT-01)', () => {
  beforeAll(async () => {
    testDs = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [DocTemplateSchema, DocComponentSchema],
      synchronize: true,
    })
    await testDs.initialize()
  })
  afterAll(async () => { await testDs.destroy() })

  it('creates component and rejects duplicate name 409', async () => {
    await DocComponentsService.create({
      name: 'Kop Surat',
      tiptap_json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'KOP' }] }] },
    } as never)
    await expect(DocComponentsService.create({
      name: 'Kop Surat',
      tiptap_json: { type: 'doc', content: [] },
    } as never)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('rejects is_looping without item.* 400 BR-003', async () => {
    await expect(DocComponentsService.create({
      name: 'Loop Bad',
      is_looping: true,
      tiptap_json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'no item' }] }] },
    } as never)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('allows is_looping with item.* binding', async () => {
    const c = await DocComponentsService.create({
      name: 'Daftar Pegawai',
      is_looping: true,
      tiptap_json: {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: [{ type: 'docBinding', attrs: { name: 'nama', target: 'item.nama', view: 'text' } }],
        }],
      },
    } as never)
    expect((c as { name: string }).name).toBe('Daftar Pegawai')
  })

  it('findReferences exact-match does not leak substring EC-10', async () => {
    // Create template that embeds "Kop Surat" via componentId
    await testDs.getRepository(DocTemplateSchema).save(
      testDs.getRepository(DocTemplateSchema).create({
        name: 'SK Pengangkatan',
        code: 'sk-pengangkatan',
        description: null,
        schemaJson: JSON.stringify({ type: 'document', children: [{ type: 'component-ref', props: { componentId: 'Kop Surat' } }] }),
        version: 1,
        status: 'DRAFT',
      }),
    )
    const refs = await DocComponentsService.findReferences('Kop Surat')
    expect(refs).toContain('template:SK Pengangkatan')
    // Substring "Kop" must NOT match "Kop Surat"
    const falseRefs = await DocComponentsService.findReferences('Kop')
    expect(falseRefs).not.toContain('template:SK Pengangkatan')
  })

  it('findReferences includes component referencing another component', async () => {
    await DocComponentsService.create({
      name: 'Wrapper',
      tiptap_json: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }],
      },
    } as never)
    // Manually inject component reference string
    await testDs.getRepository(DocComponentSchema).createQueryBuilder().update()
      .set({ tiptapJson: JSON.stringify({ type: 'doc', content: [{ type: 'docBinding', attrs: { component: 'Kop Surat' } }] }) })
      .where('name = :name', { name: 'Wrapper' }).execute()
    const refs = await DocComponentsService.findReferences('Kop Surat')
    expect(refs).toContain('component:Wrapper')
  })

  it('remove 409 when used by template (bug pemicu)', async () => {
    const all = await testDs.getRepository(DocComponentSchema).find()
    const kop = all.find((c: any) => c.name === 'Kop Surat')
    await expect(DocComponentsService.remove((kop as any).id)).rejects.toMatchObject({ statusCode: 409, data: { references: expect.arrayContaining(['template:SK Pengangkatan']) } })
  })

  it('remove 200 after deref succeeds', async () => {
    await testDs.getRepository(DocTemplateSchema).createQueryBuilder().delete().where('name = :name', { name: 'SK Pengangkatan' }).execute()
    // Also remove Wrapper that references Kop Surat via tiptapJson
    await testDs.getRepository(DocComponentSchema).createQueryBuilder().delete().where('name = :name', { name: 'Wrapper' }).execute()
    const all = await testDs.getRepository(DocComponentSchema).find()
    const kop = all.find((c: any) => c.name === 'Kop Surat')
    await expect(DocComponentsService.remove((kop as any).id)).resolves.toMatchObject({ id: (kop as any).id })
  })

  it('findOne 404 when missing', async () => {
    await expect(DocComponentsService.findOne(99999)).rejects.toMatchObject({ statusCode: 404 })
  })
})
