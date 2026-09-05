import { getDataSource } from '~~/server/utils/db'
import { TemplateSchema, TemplateVersionSchema } from '~~/server/entities/template.entity'
import { isNonEmptyContent, countMeaningfulNodes } from '~~/server/utils/template-helpers'
import type {
  TemplateQueryInput,
  CreateTemplateInput,
  UpdateTemplateInput,
} from '~~/server/dto/templates.dto'

const searchableFields = ['name', 'description', 'status']
const sortableFields = ['id', 'name', 'version', 'status', 'createdAt', 'updatedAt']

function httpError(statusCode: number, message: string, data?: unknown): Error {
  return Object.assign(new Error(message), { statusCode, data })
}

/**
 * usedBy stubs: administration steps (Task 17) pin a template version and
 * documents (Task 19) snapshot `templateVersion`. Tables land later —
 * guarded via hasMetadata + try/catch so this works before and after.
 */
export interface TemplateUsage {
  steps: Array<{ id: number; name: string }>
  documents: Array<{ id: number; name: string }>
  stepCount: number
  documentCount: number
}

async function findUsages(templateId: number): Promise<TemplateUsage> {
  const ds = await getDataSource()
  const steps: Array<{ id: number; name: string }> = []
  const documents: Array<{ id: number; name: string }> = []

  if (ds.hasMetadata('administration_steps')) {
    try {
      const rows: Array<{ id: number; name: string }> = await ds.query(
        'SELECT id, name FROM administration_steps WHERE "templateId" = ?',
        [templateId],
      )
      for (const r of rows) steps.push({ id: r.id, name: r.name ?? `#${r.id}` })
    } catch {}
  }

  if (ds.hasMetadata('documents')) {
    try {
      const rows: Array<{ id: number; name: string }> = await ds.query(
        'SELECT id, title AS name FROM documents WHERE "templateId" = ?',
        [templateId],
      )
      for (const r of rows) documents.push({ id: r.id, name: r.name ?? `#${r.id}` })
    } catch {}
  }

  return { steps, documents, stepCount: steps.length, documentCount: documents.length }
}

async function findOneWithRelations(id: number) {
  const ds = await getDataSource()
  const template: any = await ds.getRepository(TemplateSchema).findOne({ where: { id } })
  if (!template) throw httpError(404, 'Template not found')
  const versions = await ds
    .getRepository(TemplateVersionSchema)
    .createQueryBuilder('v')
    .where('v.templateId = :id', { id })
    .orderBy('v.version', 'DESC')
    .getMany()
  const usedBy = await findUsages(id)
  return {
    ...template,
    versions,
    usedBy,
    usageCount: usedBy.stepCount + usedBy.documentCount,
    nodeCount: countMeaningfulNodes(template.content),
  }
}

export const TemplatesService = {
  async findAll(query: TemplateQueryInput) {
    const ds = await getDataSource()
    const qb = ds.getRepository(TemplateSchema).createQueryBuilder('template')

    if (query.search) {
      if (query.searchField && searchableFields.includes(query.searchField)) {
        qb.where(`template.${query.searchField} LIKE :search`, { search: `%${query.search}%` })
      } else {
        const conditions = searchableFields.map((f) => `template.${f} LIKE :search`)
        qb.where(`(${conditions.join(' OR ')})`, { search: `%${query.search}%` })
      }
    }

    if (sortableFields.includes(query.sortBy)) {
      qb.orderBy(`template.${query.sortBy}`, query.sortOrder)
    }

    const total = await qb.getCount()
    const rows = await qb.skip((query.page - 1) * query.limit).take(query.limit).getMany()

    const data = await Promise.all(
      rows.map(async (row: any) => {
        const usedBy = await findUsages(row.id)
        return {
          ...row,
          nodeCount: countMeaningfulNodes(row.content),
          stepCount: usedBy.stepCount,
          documentCount: usedBy.documentCount,
          usageCount: usedBy.stepCount + usedBy.documentCount,
        }
      }),
    )

    return { data, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) }
  },

  async findOne(id: number) {
    return findOneWithRelations(id)
  },

  async create(data: CreateTemplateInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(TemplateSchema)

    const existing = await repo
      .createQueryBuilder('template')
      .where('LOWER(template.name) = LOWER(:name)', { name: data.name })
      .getOne()
    if (existing) throw httpError(409, `Template "${data.name}" already exists`)

    const saved: any = await repo.save(
      repo.create({
        name: data.name,
        description: data.description ?? null,
        content: data.content ?? null,
        version: 0,
        status: 'draft',
      }),
    )
    return findOneWithRelations(saved.id)
  },

  /** Edit the draft working copy only (BR-003: version snapshots are append-only rows, never touched here). */
  async update(id: number, data: UpdateTemplateInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(TemplateSchema)
    const template: any = await repo.findOne({ where: { id } })
    if (!template) throw httpError(404, 'Template not found')

    if (data.name !== undefined && data.name !== template.name) {
      const clash = await repo
        .createQueryBuilder('template')
        .where('LOWER(template.name) = LOWER(:name)', { name: data.name })
        .andWhere('template.id != :id', { id })
        .getOne()
      if (clash) throw httpError(409, `Template "${data.name}" already exists`)
      template.name = data.name
    }
    if (data.description !== undefined) template.description = data.description
    if (data.content !== undefined) template.content = data.content
    // Editing after publish reopens the working copy as draft; the version
    // counter only moves on publish.
    if (template.status === 'published' && data.content !== undefined) template.status = 'draft'

    await repo.save(template)
    return findOneWithRelations(id)
  },

  /** Freeze the draft as an immutable version snapshot (BR-002/BR-003/BR-004, AC-002/AC-005). */
  async publish(id: number, publishedBy?: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(TemplateSchema)
    const template: any = await repo.findOne({ where: { id } })
    if (!template) throw httpError(404, 'Template not found')

    if (!isNonEmptyContent(template.content)) {
      throw httpError(422, 'Cannot publish an empty template: content must contain at least one text node or component placement ({ nodes: [...] })')
    }

    const verRepo = ds.getRepository(TemplateVersionSchema)
    const snapshotCount = await verRepo.count({ where: { templateId: id } })
    const newVersion = snapshotCount + 1

    await verRepo.save(
      verRepo.create({
        templateId: id,
        version: newVersion,
        content: template.content as string,
        publishedBy: publishedBy ?? null,
      }),
    )

    template.version = newVersion
    template.status = 'published'
    await repo.save(template)
    return findOneWithRelations(id)
  },

  async findVersion(id: number, version: number) {
    const ds = await getDataSource()
    const template = await ds.getRepository(TemplateSchema).findOne({ where: { id } })
    if (!template) throw httpError(404, 'Template not found')
    const snapshot: any = await ds.getRepository(TemplateVersionSchema).findOne({
      where: { templateId: id, version },
    })
    if (!snapshot) throw httpError(404, `Version v${version} not found`)
    return { ...snapshot, nodeCount: countMeaningfulNodes(snapshot.content) }
  },

  /**
   * Two-step auditable rollback (AC-003): copy the snapshot into the draft
   * working copy. History rows are untouched; publishing afterwards yields
   * a NEW version (v3 after rolling v2 back to v1).
   */
  async rollbackToDraft(id: number, version: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(TemplateSchema)
    const template: any = await repo.findOne({ where: { id } })
    if (!template) throw httpError(404, 'Template not found')
    const snapshot: any = await ds.getRepository(TemplateVersionSchema).findOne({
      where: { templateId: id, version },
    })
    if (!snapshot) throw httpError(404, `Version v${version} not found`)

    template.content = snapshot.content
    template.status = 'draft'
    await repo.save(template)
    return findOneWithRelations(id)
  },

  async remove(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(TemplateSchema)
    const template = await repo.findOne({ where: { id } })
    if (!template) throw httpError(404, 'Template not found')

    const usedBy = await findUsages(id)
    if (usedBy.stepCount + usedBy.documentCount > 0) {
      throw httpError(
        409,
        `Template is referenced by ${usedBy.stepCount} administration step(s) and ${usedBy.documentCount} document(s) and cannot be deleted`,
        { usedBy },
      )
    }

    // Version snapshots are immutable history — delete explicitly
    // (no FK cascade declared, matching codebase convention).
    await ds.getRepository(TemplateVersionSchema).createQueryBuilder().delete().where('templateId = :id', { id }).execute()
    await repo.remove(template)
    return { message: 'Template deleted' }
  },
}
