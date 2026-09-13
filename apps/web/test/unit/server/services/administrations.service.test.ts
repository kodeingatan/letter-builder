import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { DataSource } from 'typeorm'

let testDs: DataSource
vi.mock('../../../../server/utils/db', () => ({
  getDataSource: () => Promise.resolve(testDs),
}))

import { AdministrationsService } from '../../../../server/services/administrations.service'
import { DocTemplatesService } from '../../../../server/services/doc-templates.service'
import { DocComponentsService } from '../../../../server/services/doc-components.service'
import { DocumentsService } from '../../../../server/services/documents.service'
import { MasterDdlService } from '../../../../server/services/master-ddl.service'
import { setBrowserLauncher } from '../../../../server/services/pdf.service'
import { DocTemplateSchema } from '../../../../server/entities/doc-template.entity'
import { DocComponentSchema } from '../../../../server/entities/doc-component.entity'
import { AdministrationSchema } from '../../../../server/entities/administration.entity'
import { AdminStepSchema } from '../../../../server/entities/admin-step.entity'
import { DocumentSchema } from '../../../../server/entities/document.entity'
import { SettingSchema } from '../../../../server/entities/setting.entity'

const skTree = {
  type: 'document',
  children: [
    { type: 'heading', props: { content: 'SK {{letter.number}}', level: 1 } },
    {
      type: 'repeater', props: { source: 'employees', item: 'item' },
      children: [{ type: 'text', props: { content: '{{item.nama}} ({{item.nip}})' } }],
    },
    { type: 'signature', props: { name: '{{signer.name}}', title: 'Kadis', city: 'Banda Aceh' } },
  ],
}

const ttdTree = {
  type: 'document',
  children: [{ type: 'signature', props: { name: '{{signer.name}}', title: 'Kepala Dinas', city: 'Banda Aceh' } }],
}

function fakeLauncher() {
  return async () => ({
    newPage: async () => ({ setContent: async () => {}, pdf: async () => new Uint8Array([1, 2, 3]), close: async () => {} }),
    close: async () => {},
  }) as never
}

describe('administrations.service — wizard runs (UT-03, FR-007/008, AC-005/006)', () => {
  let adminId = 0
  let skId = 0
  let ttdId = 0

  beforeAll(async () => {
    testDs = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [DocTemplateSchema, DocComponentSchema, AdministrationSchema, AdminStepSchema, DocumentSchema, SettingSchema],
      synchronize: true,
    })
    await testDs.initialize()
    setBrowserLauncher(fakeLauncher())

    // Master source for the loop (Task 06 interop).
    await MasterDdlService.createTable(testDs, 'pegawai', [
      { name: 'nama', type: 'text' },
      { name: 'nip', type: 'text' },
    ])
    await testDs.query(`INSERT INTO "mst_pegawai" ("nama", "nip") VALUES ('Afdal', '199xxx'), ('Budi', '198xxx')`)

    const sk = await DocTemplatesService.create({ name: 'SK', code: 'sk', schema_json: skTree } as never)
    skId = (sk as { id: number }).id
    const ttd = await DocTemplatesService.create({ name: 'TTD', code: 'ttd', schema_json: ttdTree } as never)
    ttdId = (ttd as { id: number }).id
    const admin = await AdministrationsService.create({
      name: 'SK Pengangkatan',
      steps: [
        {
          template_id: skId, step_order: 0,
          mapping: {
            employees: { kind: 'master-list', ref: 'pegawai' },
            'letter.number': { kind: 'value', ref: '800/001' },
            'signer.name': { kind: 'value', ref: 'H. Kadis' },
          },
        },
        {
          template_id: ttdId, step_order: 1,
          mapping: { 'signer.name': { kind: 'field', ref: 'step1.penandatangan' } },
        },
      ],
    })
    adminId = (admin as unknown as { id: number }).id
  })
  afterAll(async () => {
    setBrowserLauncher(null)
    await testDs.destroy()
  })

  it('creates administrations with ordered steps (Step 5)', async () => {
    const admin = await AdministrationsService.findOne(adminId) as unknown as {
      steps: Array<{ step_order: number }>
    }
    expect(admin.steps.map((s) => s.step_order)).toEqual([0, 1])
  })

  it('rejects duplicate step_order and incomplete mapping (INV-002, DR-002)', async () => {
    await expect(AdministrationsService.replaceSteps(adminId, [
      { template_id: skId, step_order: 0, mapping: {} },
      { template_id: ttdId, step_order: 0, mapping: {} },
    ])).rejects.toMatchObject({ statusCode: 400 })
    await expect(AdministrationsService.replaceSteps(adminId, [
      { template_id: skId, step_order: 0, mapping: {} },
    ])).rejects.toThrow(/Mapping incomplete/)
  })

  it('executes 2-step wizard → combined doc + PDF (Step 6, AC-005)', async () => {
    const result = await AdministrationsService.executeRun(adminId, {
      data: { step1: { penandatangan: 'H. Kadis' } },
      document_number: 'SK/001/2026',
    })
    const doc = result.document as unknown as { id: number; status: string; pdf_path: string; template_version: number }
    expect(doc.status).toBe('FINAL')
    expect(doc.pdf_path).toMatch(/\.pdf$/)
    expect(result.pdfError).toBeNull()
    expect(result.html).toContain('Afdal (199xxx)')
    expect(result.html).toContain('Budi (198xxx)')
    expect(result.html).toContain('doc-pagebreak')
    expect(doc.template_version).toBe(1)
  })

  it('runs lock versions: old html unchanged after republish (AC-006)', async () => {
    const before = await DocumentsService.findOne(1) as unknown as { rendered_html: string }
    await DocTemplatesService.update(skId, { status: 'PUBLISHED' })
    const after = await DocumentsService.findOne(1) as unknown as { rendered_html: string; template_version: number }
    expect(after.rendered_html).toBe(before.rendered_html)
    expect(after.template_version).toBe(1)
  })

  it('renders looping components inside repeaters via registry (AC-002, FR-002)', async () => {
    await DocComponentsService.create({
      name: 'Item Card',
      is_looping: true,
      tiptap_json: {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: [{ type: 'docBinding', attrs: { name: 'nama', target: 'item.nama', view: 'text' } }],
        }],
      },
    })
    const tpl = await DocTemplatesService.create({
      name: 'SK Card', code: 'sk-card',
      schema_json: {
        type: 'document',
        children: [{
          type: 'repeater', props: { source: 'employees', item: 'item' },
          children: [{ type: 'component-ref', props: { componentId: 'Item Card', propsOverride: {} } }],
        }],
      },
    } as never)
    const tplId = (tpl as { id: number }).id
    const admin = await AdministrationsService.create({
      name: 'Card Admin',
      steps: [{
        template_id: tplId, step_order: 0,
        mapping: { employees: { kind: 'master-list', ref: 'pegawai' } },
      }],
    })
    const result = await AdministrationsService.executeRun((admin as unknown as { id: number }).id, { data: {} })
    expect(result.html).toContain('Afdal')
    expect(result.html).toContain('Budi')
  })

  it('duplicate document_number → 409 (BR-006)', async () => {
    await expect(AdministrationsService.executeRun(adminId, {
      data: {}, document_number: 'SK/001/2026',
    })).rejects.toMatchObject({ statusCode: 409 })
  })

  it('PDF failure still saves the run with pdfError (ERR-03)', async () => {
    setBrowserLauncher(async () => { throw new Error('no chrome') })
    try {
      const result = await AdministrationsService.executeRun(adminId, { data: {}, as_draft: false })
      const doc = result.document as unknown as { status: string; pdf_path: string | null }
      expect(doc.status).toBe('DRAFT')
      expect(doc.pdf_path).toBeNull()
      expect(result.pdfError).toContain('Failed to generate PDF')
    } finally {
      setBrowserLauncher(fakeLauncher())
    }
  })

  it('cancel preserves history (Step 6)', async () => {
    const cancelled = await DocumentsService.cancel(1) as unknown as { status: string }
    expect(cancelled.status).toBe('CANCELLED')
    const runs = await DocumentsService.findAll({ page: 1, limit: 20, sortBy: 'id', sortOrder: 'DESC' }, adminId)
    expect(runs.total).toBeGreaterThanOrEqual(2)
  })

  it('removes administrations with explicit step cleanup (runs detached)', async () => {
    await AdministrationsService.remove(adminId)
    await expect(AdministrationsService.findOne(adminId)).rejects.toMatchObject({ statusCode: 404 })
    const stepsLeft = await testDs.getRepository(AdminStepSchema).find({ where: { adminId } })
    expect(stepsLeft).toHaveLength(0)
    const orphanRuns = await DocumentsService.findAll({ page: 1, limit: 20, sortBy: 'id', sortOrder: 'DESC' })
    expect(orphanRuns.total).toBeGreaterThanOrEqual(2)
  })
})
