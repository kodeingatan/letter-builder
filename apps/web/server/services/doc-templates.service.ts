import { getDataSource } from '../utils/db'
import { DocTemplateSchema } from '../entities/doc-template.entity'
import { AdminStepSchema } from '../entities/admin-step.entity'
import { DocNodeSchema, assertTreeLimits } from '../dto/documents.dto'
import { TiptapConverterService } from './tiptap-converter.service'
import { RendererService } from './renderer.service'
import { generatePdfFromHtml } from './pdf.service'
import { DocComponentsService } from './doc-components.service'
import type {
  CreateDocTemplateInput, UpdateDocTemplateInput, PersuratanQueryInput, PreviewPdfInput,
} from '../dto/persuratan.dto'
import type { DocNode } from '../../shared/types/document'

/**
 * DocTemplate service (Task 07): letter templates as JSON Trees.
 * Publish bumps `version`; runs lock the version for reproducibility (BR-005/DR-001).
 */

function toPublic(row: Record<string, unknown>) {
  const { schemaJson, ...rest } = row
  void schemaJson
  return { ...rest, schema_json: safeParseJson(row.schemaJson) }
}

function safeParseJson(text: unknown): unknown {
  try {
    return JSON.parse(String(text ?? '{}'))
  } catch {
    return {}
  }
}

export const DocTemplatesService = {
  async findAll(query: PersuratanQueryInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(DocTemplateSchema)
    const qb = repo.createQueryBuilder('t')
    if (query.search) {
      qb.where('(t.name LIKE :search OR t.code LIKE :search)', { search: `%${query.search}%` })
    }
    const sortable = new Set(['id', 'name', 'code', 'version', 'status', 'createdAt', 'updatedAt'])
    qb.orderBy(`t.${sortable.has(query.sortBy) ? query.sortBy : 'id'}`, query.sortOrder)
    const total = await qb.getCount()
    const data = await qb.skip((query.page - 1) * query.limit).take(query.limit).getMany()
    return { data: (data as unknown as Array<Record<string, unknown>>).map(toPublic), total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) }
  },

  async findOne(id: number) {
    const ds = await getDataSource()
    const row = await ds.getRepository(DocTemplateSchema).findOne({ where: { id } })
    if (!row) notFound(id)
    return toPublic(row as unknown as Record<string, unknown>)
  },

  async create(input: CreateDocTemplateInput) {
    assertValidTree(input.schema_json)
    const ds = await getDataSource()
    const repo = ds.getRepository(DocTemplateSchema)
    if (await repo.findOne({ where: { name: input.name } })) conflict(`Template "${input.name}" already exists`)
    if (await repo.findOne({ where: { code: input.code } })) conflict(`Code "${input.code}" already exists`)
    const saved = await repo.save(repo.create({
      name: input.name,
      code: input.code,
      description: input.description ?? null,
      schemaJson: JSON.stringify(input.schema_json),
      version: 1,
      status: 'DRAFT',
    }))
    return DocTemplatesService.findOne((saved as unknown as { id: number }).id)
  },

  async update(id: number, input: UpdateDocTemplateInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(DocTemplateSchema)
    const current = await repo.findOne({ where: { id } })
    if (!current) notFound(id)
    const row = current as unknown as Record<string, unknown>
    if (input.name && input.name !== row.name && await repo.findOne({ where: { name: input.name } })) {
      conflict(`Template "${input.name}" already exists`)
    }
    if (input.schema_json !== undefined) assertValidTree(input.schema_json)
    const nextStatus = input.status ?? String(row.status)
    assertStatusTransition(String(row.status), nextStatus)
    if (nextStatus === 'PUBLISHED') assertPublishable(input.schema_json ?? safeParseJson(row.schemaJson))
    const schemaChanged = input.schema_json !== undefined &&
      JSON.stringify(input.schema_json) !== JSON.stringify(safeParseJson(row.schemaJson))
    await repo.createQueryBuilder().update().set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.schema_json !== undefined ? { schemaJson: JSON.stringify(input.schema_json) } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      // BR-005: publish bumps the version — as does editing a PUBLISHED schema,
      // so future runs never silently change meaning under the same version.
      ...((nextStatus === 'PUBLISHED' && (row.status !== 'PUBLISHED' || schemaChanged))
        ? { version: Number(row.version) + 1 } : {}),
    }).where('id = :id', { id }).execute()
    return DocTemplatesService.findOne(id)
  },

  async remove(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(DocTemplateSchema)
    const current = await repo.findOne({ where: { id } })
    if (!current) notFound(id)
    const steps = await ds.getRepository(AdminStepSchema).find({ where: { templateId: id } })
    if (steps.length > 0) {
      const admins = new Set((steps as unknown as Array<{ adminId: number }>).map((s) => s.adminId))
      const error = new Error(
        `Template "${(current as unknown as { name: string }).name}" is still used by ${steps.length} step(s) in ${admins.size} administration(s)`,
      ) as Error & { statusCode?: number; data?: unknown }
      error.statusCode = 409
      error.data = { steps: steps.length, administrations: [...admins] }
      throw error
    }
    await repo.createQueryBuilder().delete().where('id = :id', { id }).execute()
    return { id }
  },

  /** Auto-form schema: requirements derived from the tree (Step 3, FR-005). */
  async formSchema(id: number) {
    const template = await DocTemplatesService.findOne(id)
    const tree = (template as unknown as { schema_json: DocNode }).schema_json
    const requirements = TiptapConverterService.scanRequirements(tree)
    return {
      template_id: id,
      version: (template as unknown as { version: number }).version,
      requirements: requirements.filter((r) => !r.scoped),
      scoped: requirements.filter((r) => r.scoped).map((r) => r.path),
    }
  },

  /** Render preview HTML without saving (Step 3–4). */
  async preview(id: number, data: Record<string, unknown> = {}) {
    const template = await DocTemplatesService.findOne(id)
    const tree = (template as unknown as { schema_json: DocNode }).schema_json
    const components = await DocComponentsService.registry()
    return RendererService.render(tree, data, { components })
  },

  /** Preview PDF via the Task 05 engine (Step 4, FR-006). */
  async previewPdf(id: number, input: PreviewPdfInput) {
    const template = await DocTemplatesService.findOne(id)
    const tree = (template as unknown as { schema_json: DocNode }).schema_json
    // Render with the component registry so component-ref resolves (AC-004).
    const components = await DocComponentsService.registry()
    const { html } = RendererService.render(tree, input.data, { components })
    return generatePdfFromHtml(html, input.page)
  },
}

/** INV-001: stored trees always pass Task 05 validation. */
function assertValidTree(schemaJson: unknown): void {
  const parsed = DocNodeSchema.safeParse(schemaJson)
  if (!parsed.success) {
    const error = new Error(`Invalid schema: ${parsed.error.errors[0].message}`) as Error & { statusCode?: number }
    error.statusCode = 400
    throw error
  }
  try {
    assertTreeLimits(schemaJson)
  } catch (e) {
    const error = new Error((e as Error).message) as Error & { statusCode?: number }
    error.statusCode = 400
    throw error
  }
}

/** BR-002: publish requires all bindings mapped-later + at least 1 content block. */
function assertPublishable(schemaJson: unknown): void {
  const tree = schemaJson as DocNode
  const blocks = tree.type === 'document' ? (tree.children ?? []) : [tree]
  const hasContent = blocks.some((b) => !['header', 'footer'].includes(b.type))
  if (!hasContent) {
    const error = new Error('Publish requires at least 1 content block (BR-002)') as Error & { statusCode?: number }
    error.statusCode = 400
    throw error
  }
}

function assertStatusTransition(from: string, to: string): void {
  if (from === to) return
  const allowed: Record<string, string[]> = { DRAFT: ['PUBLISHED'], PUBLISHED: ['ARCHIVED'], ARCHIVED: [] }
  if (!(allowed[from] ?? []).includes(to)) {
    const error = new Error(`Invalid status transition ${from} → ${to}`) as Error & { statusCode?: number }
    error.statusCode = 400
    throw error
  }
}

function notFound(id: number): never {
  const error = new Error(`Template ${id} not found`) as Error & { statusCode?: number }
  error.statusCode = 404
  throw error
}

function conflict(message: string): never {
  const error = new Error(message) as Error & { statusCode?: number }
  error.statusCode = 409
  throw error
}
