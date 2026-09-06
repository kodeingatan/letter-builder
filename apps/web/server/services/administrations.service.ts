import { getDataSource } from '~~/server/utils/db'
import {
  AdministrationSchema,
  AdministrationStepSchema,
  AdministrationVersionSchema,
} from '~~/server/entities/administration.entity'
import { TemplateSchema, TemplateVersionSchema } from '~~/server/entities/template.entity'
import {
  normalizeStepOrder,
  parseStepFields,
  validatePublishSteps,
  validateStepFields,
  type StepDraft,
} from '~~/server/utils/administration-helpers'
import type {
  AdministrationQueryInput,
  BulkStepsInput,
  CreateAdministrationInput,
  UpdateAdministrationInput,
} from '~~/server/dto/administrations.dto'

const searchableFields = ['name', 'description', 'status']
const sortableFields = ['id', 'name', 'status', 'version', 'createdAt', 'updatedAt']

function httpError(statusCode: number, message: string, data?: unknown): Error {
  return Object.assign(new Error(message), { statusCode, data })
}

async function countDocuments(administrationId: number): Promise<number> {
  const ds = await getDataSource()
  if (!ds.hasMetadata('documents')) return 0
  try {
    const rows: Array<{ count: string | number }> = await ds.query(
      'SELECT COUNT(*) AS count FROM documents WHERE "administrationId" = ?',
      [administrationId],
    )
    return Number(rows[0]?.count ?? 0)
  } catch {
    return 0
  }
}

async function loadSteps(administrationId: number): Promise<any[]> {
  const ds = await getDataSource()
  return ds
    .getRepository(AdministrationStepSchema)
    .createQueryBuilder('step')
    .where('step.administrationId = :id', { id: administrationId })
    .orderBy('step.order', 'ASC')
    .getMany()
}

/**
 * Validate a template pin against the templates store (BR-004):
 * missing template → 404; draft (unpublished) template → 422;
 * unknown version → 422. `latest` requires a published template.
 */
async function validateTemplatePin(templateId: number, templateVersion: string | null | undefined, stepName: string) {
  const ds = await getDataSource()
  const template: any = await ds.getRepository(TemplateSchema).findOne({ where: { id: templateId } })
  if (!template) throw httpError(404, `Step "${stepName}" pins template #${templateId}, which does not exist`)
  if (template.status !== 'published') {
    throw httpError(422, `Step "${stepName}" pins template "${template.name}", which is not published yet (publish the template first)`, {
      code: 'TEMPLATE_NOT_PUBLISHED',
    })
  }
  const version = (templateVersion ?? '').trim()
  if (!version) {
    throw httpError(422, `Step "${stepName}" pins a template but has no version (choose a version or "latest")`, {
      code: 'TEMPLATE_VERSION_REQUIRED',
    })
  }
  if (version !== 'latest') {
    const numeric = Number(version)
    if (!Number.isInteger(numeric) || numeric < 1) {
      throw httpError(422, `Step "${stepName}" pins unknown template version "${version}"`, {
        code: 'TEMPLATE_VERSION_NOT_FOUND',
      })
    }
    const snapshot = await ds.getRepository(TemplateVersionSchema).findOne({
      where: { templateId, version: numeric },
    })
    if (!snapshot) {
      throw httpError(422, `Step "${stepName}" pins template "${template.name}" version "${version}", which does not exist`, {
        code: 'TEMPLATE_VERSION_NOT_FOUND',
      })
    }
  }
  return template
}

function toStepPayload(step: any, templateInfo?: Record<number, any>) {
  const fields = parseStepFields(step.fields)
  const info = step.templateId != null ? templateInfo?.[step.templateId] : undefined
  const resolvedVersion =
    step.templateVersion === 'latest' ? (info?.version ?? 'latest') : step.templateVersion
  return {
    ...step,
    fields,
    fieldCount: fields.length,
    templateName: info?.name ?? null,
    templateMissing: step.templateId != null && !info,
    resolvedTemplateVersion: step.templateId != null ? resolvedVersion : null,
  }
}

async function resolveTemplateInfo(templateIds: number[]): Promise<Record<number, any>> {
  const ds = await getDataSource()
  const info: Record<number, any> = {}
  for (const id of [...new Set(templateIds)].filter((v) => v != null)) {
    const template: any = await ds.getRepository(TemplateSchema).findOne({ where: { id } })
    if (template) info[id] = { id, name: template.name, status: template.status, version: template.version }
  }
  return info
}

async function findOneWithRelations(id: number) {
  const ds = await getDataSource()
  const administration: any = await ds.getRepository(AdministrationSchema).findOne({ where: { id } })
  if (!administration) throw httpError(404, 'Administration not found')
  const steps = await loadSteps(id)
  const templateInfo = await resolveTemplateInfo(steps.map((s) => s.templateId).filter((v) => v != null))
  const versions = await ds
    .getRepository(AdministrationVersionSchema)
    .createQueryBuilder('v')
    .where('v.administrationId = :id', { id })
    .orderBy('v.version', 'DESC')
    .getMany()
  const docsCount = await countDocuments(id)
  const templatesUsed = [...new Set(steps.map((s) => s.templateId).filter((v) => v != null))]
  return {
    ...administration,
    steps: steps.map((s) => toStepPayload(s, templateInfo)),
    versions,
    stepCount: steps.length,
    docsCount,
    documentCount: docsCount,
    templatesUsed,
    templatesUsedCount: templatesUsed.length,
  }
}

export const AdministrationsService = {
  async findAll(query: AdministrationQueryInput) {
    const ds = await getDataSource()
    const qb = ds.getRepository(AdministrationSchema).createQueryBuilder('administration')

    if (query.search) {
      if (query.searchField && searchableFields.includes(query.searchField)) {
        qb.where(`administration.${query.searchField} LIKE :search`, { search: `%${query.search}%` })
      } else {
        const conditions = searchableFields.map((f) => `administration.${f} LIKE :search`)
        qb.where(`(${conditions.join(' OR ')})`, { search: `%${query.search}%` })
      }
    }

    if (sortableFields.includes(query.sortBy)) {
      qb.orderBy(`administration.${query.sortBy}`, query.sortOrder)
    }

    const total = await qb.getCount()
    const rows = await qb.skip((query.page - 1) * query.limit).take(query.limit).getMany()

    const data = await Promise.all(
      rows.map(async (row: any) => {
        const stepCount = await ds.getRepository(AdministrationStepSchema).count({
          where: { administrationId: row.id },
        })
        const docsCount = await countDocuments(row.id)
        return { ...row, stepCount, docsCount, documentCount: docsCount }
      }),
    )

    return { data, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) }
  },

  async findOne(id: number) {
    return findOneWithRelations(id)
  },

  async create(data: CreateAdministrationInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(AdministrationSchema)

    const existing = await repo
      .createQueryBuilder('administration')
      .where('LOWER(administration.name) = LOWER(:name)', { name: data.name })
      .getOne()
    if (existing) throw httpError(409, `Administration "${data.name}" already exists`)

    const saved: any = await repo.save(
      repo.create({
        name: data.name,
        description: data.description ?? null,
        status: 'draft',
        version: 0,
      }),
    )
    return findOneWithRelations(saved.id)
  },

  /** Metadata edit: drafts accept name+description; published only description (structural edits go via new-version); archived is read-only. */
  async update(id: number, data: UpdateAdministrationInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(AdministrationSchema)
    const administration: any = await repo.findOne({ where: { id } })
    if (!administration) throw httpError(404, 'Administration not found')

    if (administration.status === 'archived') {
      throw httpError(422, 'Archived administrations are read-only', { code: 'ARCHIVED_READ_ONLY' })
    }
    if (data.name !== undefined && data.name !== administration.name) {
      if (administration.status !== 'draft') {
        throw httpError(
          422,
          'Published administrations cannot be renamed directly: open a new version first (POST /api/administrations/:id/new-version)',
          { code: 'PUBLISHED_STRUCTURAL_EDIT' },
        )
      }
      const clash = await repo
        .createQueryBuilder('administration')
        .where('LOWER(administration.name) = LOWER(:name)', { name: data.name })
        .andWhere('administration.id != :id', { id })
        .getOne()
      if (clash) throw httpError(409, `Administration "${data.name}" already exists`)
      administration.name = data.name
    }
    if (data.description !== undefined) administration.description = data.description

    await repo.save(administration)
    return findOneWithRelations(id)
  },

  /**
   * Bulk ordered upsert of steps (BR-002): array position determines dense
   * 1..N order regardless of client payload. Transactional — pin and field
   * validation failures roll everything back. Draft administrations only.
   */
  async saveSteps(id: number, input: BulkStepsInput) {
    const ds = await getDataSource()
    const administration: any = await ds.getRepository(AdministrationSchema).findOne({ where: { id } })
    if (!administration) throw httpError(404, 'Administration not found')
    if (administration.status === 'archived') {
      throw httpError(422, 'Archived administrations are read-only', { code: 'ARCHIVED_READ_ONLY' })
    }
    if (administration.status !== 'draft') {
      throw httpError(
        422,
        'Published administrations cannot change steps directly: open a new version first (POST /api/administrations/:id/new-version)',
        { code: 'PUBLISHED_STRUCTURAL_EDIT' },
      )
    }

    const ordered = normalizeStepOrder(input.steps as StepDraft[])

    // Pre-validate field lists (pure) before touching the DB.
    for (let index = 0; index < ordered.length; index++) {
      const step = ordered[index]
      const stepName = step.name?.trim() ? step.name.trim() : `Step ${index + 1}`
      const hasTemplate = step.templateId !== undefined && step.templateId !== null
      if (hasTemplate && (!step.templateVersion || !String(step.templateVersion).trim())) {
        throw httpError(422, `Step "${stepName}" pins a template but has no version (choose a version or "latest")`, {
          code: 'TEMPLATE_VERSION_REQUIRED',
        })
      }
      for (const problem of validateStepFields(step.fields as any)) {
        throw httpError(422, `Step "${stepName}": ${problem}`, { code: 'INVALID_STEP_FIELDS' })
      }
    }

    // Pin validation against the templates store (BR-004).
    for (const step of ordered) {
      if (step.templateId !== undefined && step.templateId !== null) {
        await validateTemplatePin(step.templateId, step.templateVersion, step.name?.trim() || 'Unnamed step')
      }
    }

    const existing = await loadSteps(id)
    const ownedIds = new Set(existing.map((s) => s.id))
    for (const step of ordered) {
      if (step.id !== undefined && !ownedIds.has(step.id)) {
        throw httpError(422, `Step #${step.id} does not belong to administration #${id}`, {
          code: 'FOREIGN_STEP_ID',
        })
      }
    }

    await ds.transaction(async (manager) => {
      const repo = manager.getRepository(AdministrationStepSchema)
      const wantedIds = new Set(ordered.filter((s) => s.id !== undefined).map((s) => s.id as number))
      const removed = existing.filter((s) => !wantedIds.has(s.id))
      if (removed.length > 0) {
        await repo.createQueryBuilder().delete().where('id IN (:...ids)', { ids: removed.map((s) => s.id) }).execute()
      }
      // Two-phase write through negative orders so UNIQUE(administrationId, order) never collides mid-reorder.
      for (let index = 0; index < ordered.length; index++) {
        const step = ordered[index]
        const fields = step.fields && step.fields.length > 0 ? JSON.stringify(step.fields) : null
        if (step.id !== undefined) {
          await repo.createQueryBuilder().update().set({
            order: -(index + 1),
            name: step.name.trim(),
            templateId: step.templateId ?? null,
            templateVersion: step.templateId != null ? String(step.templateVersion).trim() : null,
            fields,
          }).where('id = :sid', { sid: step.id }).execute()
        } else {
          const created: any = await repo.save(
            repo.create({
              administrationId: id,
              order: -(index + 1),
              name: step.name.trim(),
              templateId: step.templateId ?? null,
              templateVersion: step.templateId != null ? String(step.templateVersion).trim() : null,
              fields,
            }),
          )
          step.id = created.id
        }
      }
      for (let index = 0; index < ordered.length; index++) {
        await repo.createQueryBuilder().update().set({ order: index + 1 }).where('id = :sid', { sid: ordered[index].id }).execute()
      }
    })

    return findOneWithRelations(id)
  },

  /** Publish the workflow: validates ≥1 valid step, snapshots steps JSON, flips status. */
  async publish(id: number, publishedBy?: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(AdministrationSchema)
    const administration: any = await repo.findOne({ where: { id } })
    if (!administration) throw httpError(404, 'Administration not found')
    if (administration.status === 'archived') {
      throw httpError(422, 'Archived administrations cannot be published', { code: 'ARCHIVED_READ_ONLY' })
    }

    const steps = await loadSteps(id)
    const drafts: StepDraft[] = steps.map((s) => ({
      id: s.id,
      name: s.name,
      templateId: s.templateId,
      templateVersion: s.templateVersion,
      fields: parseStepFields(s.fields),
    }))

    const issues = validatePublishSteps(drafts)
    if (issues.length > 0) {
      throw httpError(422, `Cannot publish: ${issues[0].message}`, {
        code: 'PUBLISH_VALIDATION',
        issues,
      })
    }
    // Re-check pins live: templates may have been unpublished or deleted since the steps were saved.
    for (const step of drafts) {
      if (step.templateId !== undefined && step.templateId !== null) {
        await validateTemplatePin(step.templateId, step.templateVersion, step.name?.trim() || 'Unnamed step')
      }
    }

    const snapshotSteps = drafts.map((s, index) => ({
      order: index + 1,
      name: s.name.trim(),
      templateId: s.templateId ?? null,
      templateVersion: s.templateId != null ? String(s.templateVersion).trim() : null,
      fields: s.fields ?? [],
    }))

    const verRepo = ds.getRepository(AdministrationVersionSchema)
    const snapshotCount = await verRepo.count({ where: { administrationId: id } })
    const newVersion = snapshotCount + 1

    await verRepo.save(
      verRepo.create({
        administrationId: id,
        version: newVersion,
        steps: JSON.stringify(snapshotSteps),
        publishedBy: publishedBy ?? null,
      }),
    )

    administration.version = newVersion
    administration.status = 'published'
    await repo.save(administration)
    return findOneWithRelations(id)
  },

  /** Archive keeps history but blocks new runs (Task 18). */
  async archive(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(AdministrationSchema)
    const administration: any = await repo.findOne({ where: { id } })
    if (!administration) throw httpError(404, 'Administration not found')
    if (administration.status === 'archived') {
      throw httpError(422, 'Administration is already archived', { code: 'ALREADY_ARCHIVED' })
    }
    administration.status = 'archived'
    await repo.save(administration)
    return findOneWithRelations(id)
  },

  /**
   * Open a new draft working copy from a published administration
   * (REQ-004): steps are kept, status reopens as draft; the next publish
   * yields a NEW version snapshot. History rows are untouched.
   */
  async newVersion(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(AdministrationSchema)
    const administration: any = await repo.findOne({ where: { id } })
    if (!administration) throw httpError(404, 'Administration not found')
    if (administration.status !== 'published') {
      throw httpError(422, 'Only published administrations can open a new version (drafts are already editable)', {
        code: 'NOT_PUBLISHED',
      })
    }
    administration.status = 'draft'
    await repo.save(administration)
    return findOneWithRelations(id)
  },

  async findVersion(id: number, version: number) {
    const ds = await getDataSource()
    const administration = await ds.getRepository(AdministrationSchema).findOne({ where: { id } })
    if (!administration) throw httpError(404, 'Administration not found')
    const snapshot: any = await ds.getRepository(AdministrationVersionSchema).findOne({
      where: { administrationId: id, version },
    })
    if (!snapshot) throw httpError(404, `Version v${version} not found`)
    return { ...snapshot, steps: parseStepFields(snapshot.steps) }
  },

  /** BR-006: administrations with documents cannot be deleted — archive instead. */
  async remove(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(AdministrationSchema)
    const administration = await repo.findOne({ where: { id } })
    if (!administration) throw httpError(404, 'Administration not found')

    const docsCount = await countDocuments(id)
    if (docsCount > 0) {
      throw httpError(
        409,
        `Administration has ${docsCount} document(s) and cannot be deleted: archive it instead (POST /api/administrations/${id}/archive)`,
        { code: 'HAS_DOCUMENTS', docsCount },
      )
    }

    await ds.getRepository(AdministrationStepSchema).createQueryBuilder().delete().where('administrationId = :id', { id }).execute()
    await ds.getRepository(AdministrationVersionSchema).createQueryBuilder().delete().where('administrationId = :id', { id }).execute()
    await repo.remove(administration)
    return { message: 'Administration deleted' }
  },
}
