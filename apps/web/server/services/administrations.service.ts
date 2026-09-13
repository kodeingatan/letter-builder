import { getDataSource } from '../utils/db'
import { AdministrationSchema } from '../entities/administration.entity'
import { AdminStepSchema } from '../entities/admin-step.entity'
import { DocTemplateSchema } from '../entities/doc-template.entity'
import { DocumentSchema } from '../entities/document.entity'
import { SettingSchema } from '../entities/setting.entity'
import { TiptapConverterService } from './tiptap-converter.service'
import { RendererService } from './renderer.service'
import { generatePdfFromHtml } from './pdf.service'
import { DocComponentsService } from './doc-components.service'
import { MasterDdlService } from './master-ddl.service'
import type {
  CreateAdministrationInput, UpdateAdministrationInput, PersuratanQueryInput, RunWizardInput,
} from '../dto/persuratan.dto'
import type { MappingEntry } from '../../shared/types/persuratan'
import type { DocNode } from '../../shared/types/document'

/**
 * Administrations service (Task 07): multi-step letter definitions + wizard runs.
 * Each run renders every step template via the Task 05 engine, concatenates
 * with page breaks, and persists a version-locked snapshot (DR-001).
 */

interface StepInput {
  template_id: number
  step_order: number
  mapping: Record<string, MappingEntry>
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'admin'
}

export const AdministrationsService = {
  async findAll(query: PersuratanQueryInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(AdministrationSchema)
    const where = query.search ? '(a.name LIKE :search OR a.slug LIKE :search)' : undefined
    const params = query.search ? { search: `%${query.search}%` } : {}
    // Count without the steps join (join would inflate the total).
    const countQb = repo.createQueryBuilder('a')
    if (where) countQb.where(where, params)
    const total = await countQb.getCount()
    const listQb = repo.createQueryBuilder('a').leftJoinAndSelect('a.steps', 's')
    if (where) listQb.where(where, params)
    listQb.orderBy('a.id', query.sortOrder)
    const data = await listQb.skip((query.page - 1) * query.limit).take(query.limit).getMany()
    return { data, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) }
  },

  async findOne(id: number) {
    const ds = await getDataSource()
    const row = await ds.getRepository(AdministrationSchema).findOne({
      where: { id },
      relations: { steps: true },
    } as never)
    if (!row) notFound(id)
    const admin = row as unknown as Record<string, unknown> & { steps: Array<Record<string, unknown>> }
    const stepsRepo = ds.getRepository(AdminStepSchema)
    const steps = await stepsRepo.find({ where: { adminId: id }, order: { stepOrder: 'ASC' } })
    const parsed = (steps as unknown as Array<Record<string, unknown>>).map((s) => ({
      id: s.id,
      admin_id: s.adminId,
      template_id: s.templateId,
      step_order: s.stepOrder,
      mapping: safeParseJson(s.mappingJson),
    }))
    return { ...admin, steps: parsed }
  },

  async create(input: CreateAdministrationInput) {
    const slug = input.slug ?? slugify(input.name)
    assertSlug(slug)
    const ds = await getDataSource()
    const repo = ds.getRepository(AdministrationSchema)
    if (await repo.findOne({ where: { name: input.name } })) conflict(`Administration "${input.name}" already exists`)
    if (await repo.findOne({ where: { slug } })) conflict(`Slug "${slug}" already exists`)
    const saved = await repo.save(repo.create({ name: input.name, slug, description: input.description ?? null }))
    const id = (saved as unknown as { id: number }).id
    if (input.steps?.length) await AdministrationsService.replaceSteps(id, input.steps)
    return AdministrationsService.findOne(id)
  },

  async update(id: number, input: UpdateAdministrationInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(AdministrationSchema)
    const current = await repo.findOne({ where: { id } })
    if (!current) notFound(id)
    if (input.name && input.name !== (current as unknown as { name: string }).name) {
      if (await repo.findOne({ where: { name: input.name } })) conflict(`Administration "${input.name}" already exists`)
    }
    await repo.createQueryBuilder().update().set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    }).where('id = :id', { id }).execute()
    if (input.steps !== undefined) await AdministrationsService.replaceSteps(id, input.steps)
    return AdministrationsService.findOne(id)
  },

  async remove(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(AdministrationSchema)
    const current = await repo.findOne({ where: { id } })
    if (!current) notFound(id)
    // Runs (documents) are history — keep them, detach admin link.
    await ds.getRepository(DocumentSchema).createQueryBuilder().update()
      .set({ adminId: null }).where('adminId = :id', { id }).execute()
    // Delete steps explicitly: query-builder deletes bypass ORM cascades.
    await ds.getRepository(AdminStepSchema).createQueryBuilder().delete().where('adminId = :id', { id }).execute()
    await repo.createQueryBuilder().delete().where('id = :id', { id }).execute()
    return { id }
  },

  async replaceSteps(adminId: number, steps: StepInput[]) {
    const ds = await getDataSource()
    const templateRepo = ds.getRepository(DocTemplateSchema)
    const orders = new Set<number>()
    for (const step of steps) {
      if (orders.has(step.step_order)) {
        const error = new Error(`Duplicate step_order ${step.step_order} (INV-002)`) as Error & { statusCode?: number }
        error.statusCode = 400
        throw error
      }
      orders.add(step.step_order)
      const template = await templateRepo.findOne({ where: { id: step.template_id } })
      if (!template) {
        const error = new Error(`Template ${step.template_id} not found`) as Error & { statusCode?: number }
        error.statusCode = 404
        throw error
      }
      await AdministrationsService.assertMappingComplete(step.template_id, step.mapping)
    }
    const stepsRepo = ds.getRepository(AdminStepSchema)
    await stepsRepo.createQueryBuilder().delete().where('adminId = :adminId', { adminId }).execute()
    for (const step of steps) {
      await stepsRepo.save(stepsRepo.create({
        adminId,
        templateId: step.template_id,
        stepOrder: step.step_order,
        mappingJson: JSON.stringify(step.mapping ?? {}),
      }))
    }
  },

  /** DR-002: step mapping must cover every non-scoped requirement. */
  async assertMappingComplete(templateId: number, mapping: Record<string, MappingEntry>): Promise<void> {
    const ds = await getDataSource()
    const template = await ds.getRepository(DocTemplateSchema).findOne({ where: { id: templateId } })
    if (!template) return
    const tree = JSON.parse((template as unknown as { schemaJson: string }).schemaJson) as DocNode
    const required = TiptapConverterService.scanRequirements(tree).filter((r) => !r.scoped).map((r) => r.path)
    const missing = required.filter((path) => mapping[path] === undefined)
    if (missing.length > 0) {
      const error = new Error(`Mapping incomplete — missing: ${missing.join(', ')} (DR-002)`) as Error & { statusCode?: number }
      error.statusCode = 400
      throw error
    }
  },

  /**
   * Execute the wizard: resolve mappings → render each step → combined HTML
   * (+ PDF unless draft) → version-locked document row (Step 6, FR-008).
   */
  async executeRun(adminId: number, input: RunWizardInput) {
    const admin = await AdministrationsService.findOne(adminId) as unknown as {
      steps: Array<{ template_id?: number; templateId: number; step_order?: number; stepOrder: number; mapping: Record<string, MappingEntry> }>
    }
    const ds = await getDataSource()
    const baseSteps = (admin.steps ?? []).map((s, i) => ({
      template_id: s.template_id ?? s.templateId,
      step_order: s.step_order ?? s.stepOrder ?? i,
      mapping: (s.mapping ?? {}) as Record<string, MappingEntry>,
    }))
    const extraSteps = (input.extra_steps ?? []).map((s, i) => ({
      template_id: s.template_id,
      step_order: baseSteps.length + i,
      mapping: s.mapping ?? {},
    }))
    const allSteps = [...baseSteps, ...extraSteps]
    if (allSteps.length === 0) {
      const error = new Error('Administration has no steps') as Error & { statusCode?: number }
      error.statusCode = 400
      throw error
    }
    if (input.document_number) {
      const dupe = await ds.getRepository(DocumentSchema).findOne({ where: { documentNumber: input.document_number } })
      if (dupe) conflict(`Document number "${input.document_number}" already exists (BR-006)`)
    }

    const system = await buildSystemContext()
    const components = await DocComponentsService.registry()
    const parts: string[] = []
    const warnings: string[] = []
    const stepMeta: Array<{ template_id: number; version: number }> = []
    const templateRepo = ds.getRepository(DocTemplateSchema)

    for (const step of allSteps) {
      const template = await templateRepo.findOne({ where: { id: step.template_id } })
      if (!template) {
        const error = new Error(`Template ${step.template_id} not found`) as Error & { statusCode?: number }
        error.statusCode = 404
        throw error
      }
      const row = template as unknown as { schemaJson: string; version: number }
      await AdministrationsService.assertMappingComplete(step.template_id, step.mapping)
      const tree = JSON.parse(row.schemaJson) as DocNode
      const requirements = TiptapConverterService.scanRequirements(tree).filter((r) => !r.scoped)
      const data: Record<string, unknown> = {}
      for (const req of requirements) {
        const entry = step.mapping[req.path] as MappingEntry
        data[req.path.split('.')[0]] = data[req.path.split('.')[0]] ?? {}
        setPath(data, req.path, await TiptapConverterService.resolveMapping(entry, {
          data: input.data ?? {},
          system,
          masterCell: (table, column, rowId) => masterCellValue(table, column, rowId),
          masterList: (table) => masterListRows(table),
        }))
      }
      const rendered = RendererService.render(tree, data, { components })
      warnings.push(...rendered.warnings)
      parts.push(rendered.html)
      stepMeta.push({ template_id: step.template_id, version: row.version })
    }

    const html = parts.join('<div class="doc-pagebreak"></div>')
    let pdfPath: string | null = null
    let pdfError: string | null = null
    if (!input.as_draft) {
      try {
        const { url } = await generatePdfFromHtml(html)
        pdfPath = url
      } catch (error) {
        // ERR-03: run still saves as draft-able HTML; client offers retry.
        pdfError = (error as Error).message
      }
    }

    const docRepo = ds.getRepository(DocumentSchema)
    const saved = await docRepo.save(docRepo.create({
      adminId,
      templateId: allSteps[0].template_id,
      documentNumber: input.document_number ?? null,
      dataJson: JSON.stringify({ data: input.data ?? {}, steps: stepMeta }),
      renderedHtml: html,
      pdfPath,
      status: input.as_draft || pdfError ? 'DRAFT' : 'FINAL',
      templateVersion: Math.max(...stepMeta.map((s) => s.version)),
    }))
    const id = (saved as unknown as { id: number }).id
    const created = await docRepo.findOne({ where: { id } }) as unknown as Record<string, unknown>
    const document = {
      id: created.id,
      admin_id: created.adminId ?? null,
      template_id: created.templateId ?? null,
      document_number: created.documentNumber ?? null,
      data_json: created.dataJson,
      rendered_html: created.renderedHtml ?? null,
      pdf_path: created.pdfPath ?? null,
      status: created.status,
      template_version: created.templateVersion,
    }
    return { document, html, warnings, pdfError }
  },
}

async function buildSystemContext(): Promise<Record<string, unknown>> {
  const ds = await getDataSource()
  const settings = await ds.getRepository(SettingSchema).find()
  const office: Record<string, unknown> = {}
  for (const setting of settings as unknown as Array<{ key: string; value: string }>) {
    office[setting.key] = setting.value
  }
  // current_date resolves inside ExpressionService; listed here for mapping UX.
  return { office, current_date: new Date().toISOString().slice(0, 10) }
}

async function masterCellValue(table: string, column: string, rowId: number): Promise<unknown> {
  const ds = await getDataSource()
  const physical = MasterDdlService.physicalTableName(table)
  const rows = await ds.query(
    `SELECT * FROM ${MasterDdlService.quote(physical)} WHERE "id" = ?`, [rowId],
  ) as Array<Record<string, unknown>>
  if (rows.length === 0) throw new Error(`Master row ${table}#${rowId} not found`)
  return rows[0][column] ?? null
}

async function masterListRows(table: string): Promise<Array<Record<string, unknown>>> {
  const ds = await getDataSource()
  const physical = MasterDdlService.physicalTableName(table)
  const rows = await ds.query(`SELECT * FROM ${MasterDdlService.quote(physical)} ORDER BY "id" ASC LIMIT 500`)
  return rows as Array<Record<string, unknown>>
}

function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const segments = path.split('.')
  let current = target
  for (let i = 0; i < segments.length - 1; i++) {
    const next = current[segments[i]]
    if (next === null || typeof next !== 'object') current[segments[i]] = {}
    current = current[segments[i]] as Record<string, unknown>
  }
  current[segments[segments.length - 1]] = value
}

function safeParseJson(text: unknown): unknown {
  try {
    return JSON.parse(String(text ?? '{}'))
  } catch {
    return {}
  }
}

function assertSlug(slug: string): void {
  if (!/^[a-z][a-z0-9-]{1,60}$/.test(slug)) {
    const error = new Error(`Invalid slug "${slug}" (BR-001)`) as Error & { statusCode?: number }
    error.statusCode = 400
    throw error
  }
}

function notFound(id: number): never {
  const error = new Error(`Administration ${id} not found`) as Error & { statusCode?: number }
  error.statusCode = 404
  throw error
}

function conflict(message: string): never {
  const error = new Error(message) as Error & { statusCode?: number }
  error.statusCode = 409
  throw error
}
