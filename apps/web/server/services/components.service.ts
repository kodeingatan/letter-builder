import { getDataSource } from '~~/server/utils/db'
import {
  ComponentSchema,
  ComponentDataRequirementSchema,
  ComponentVersionSchema,
} from '~~/server/entities/component.entity'
import {
  validatePlaceholders,
  renderPreview,
  sampleValueForType,
} from '~~/server/utils/component-helpers'
import type {
  ComponentQueryInput,
  CreateComponentInput,
  UpdateComponentInput,
  PreviewComponentInput,
  ComponentRequirementInput,
} from '~~/server/dto/components.dto'

const searchableFields = ['name', 'content', 'status']
const sortableFields = ['id', 'name', 'looping', 'version', 'status', 'createdAt', 'updatedAt']

function httpError(statusCode: number, message: string, data?: unknown): Error {
  return Object.assign(new Error(message), { statusCode, data })
}

function assertNoDuplicateRequirements(requirements: ComponentRequirementInput[]) {
  const seen = new Set<string>()
  for (const r of requirements) {
    const key = r.name.toLowerCase()
    if (seen.has(key)) throw httpError(422, `Duplicate requirement name "${r.name}"`)
    seen.add(key)
  }
}

/**
 * usedBy stub: template binding tables land in Task 14/16.
 * Guarded via hasMetadata so this works both before and after they exist.
 */
async function findTemplateBindings(componentId: number): Promise<Array<{ id: number; name: string }>> {
  const ds = await getDataSource()
  // Task 16 binding table (conventional name); enforced when it lands.
  if (ds.hasMetadata('template_component_bindings')) {
    try {
      const rows: Array<{ templateId: number; templateName: string }> = await ds.query(
        `SELECT b."templateId" AS "templateId", t.name AS "templateName"
         FROM template_component_bindings b
         LEFT JOIN templates t ON t.id = b."templateId"
         WHERE b."componentId" = ?`,
        [componentId],
      )
      return rows.map((r) => ({ id: r.templateId, name: r.templateName ?? `#${r.templateId}` }))
    } catch {
      return []
    }
  }
  return []
}

export const ComponentsService = {
  async findAll(query: ComponentQueryInput) {
    const ds = await getDataSource()
    const qb = ds.getRepository(ComponentSchema).createQueryBuilder('component')

    if (query.search) {
      if (query.searchField && searchableFields.includes(query.searchField)) {
        qb.where(`component.${query.searchField} LIKE :search`, { search: `%${query.search}%` })
      } else {
        const conditions = searchableFields.map((f) => `component.${f} LIKE :search`)
        qb.where(`(${conditions.join(' OR ')})`, { search: `%${query.search}%` })
      }
    }

    if (sortableFields.includes(query.sortBy)) {
      qb.orderBy(`component.${query.sortBy}`, query.sortOrder)
    }

    const total = await qb.getCount()
    const rows = await qb.skip((query.page - 1) * query.limit).take(query.limit).getMany()

    const data = await Promise.all(
      rows.map(async (row: any) => {
        const requirementCount = await ds
          .getRepository(ComponentDataRequirementSchema)
          .count({ where: { componentId: row.id } })
        const usedBy = await findTemplateBindings(row.id)
        return { ...row, requirementCount, usageCount: usedBy.length }
      }),
    )

    return { data, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) }
  },

  async findOne(id: number) {
    const ds = await getDataSource()
    const component = await ds.getRepository(ComponentSchema).findOne({ where: { id } })
    if (!component) throw httpError(404, 'Component not found')

    const requirements = await ds.getRepository(ComponentDataRequirementSchema).find({
      where: { componentId: id },
    })
    const versions = await ds
      .getRepository(ComponentVersionSchema)
      .createQueryBuilder('v')
      .where('v.componentId = :id', { id })
      .orderBy('v.version', 'DESC')
      .getMany()
    const usedBy = await findTemplateBindings(id)
    const { unknown, unused } = validatePlaceholders((component as any).content, requirements as any[])

    return { ...(component as object), requirements, versions, usedBy, usageCount: usedBy.length, placeholderWarnings: unused, placeholderUnknown: unknown }
  },

  async create(data: CreateComponentInput) {
    assertNoDuplicateRequirements(data.requirements)
    const { unknown, unused } = validatePlaceholders(data.content, data.requirements)
    if (unknown.length) {
      throw httpError(422, `Unknown placeholder(s) in content: ${unknown.map((u) => `{{${u}}}`).join(', ')}`, { unknown })
    }

    const ds = await getDataSource()
    const repo = ds.getRepository(ComponentSchema)

    const existing = await repo
      .createQueryBuilder('component')
      .where('LOWER(component.name) = LOWER(:name)', { name: data.name })
      .getOne()
    if (existing) throw httpError(409, `Component "${data.name}" already exists`)

    const saved: any = await repo.save(
      repo.create({
        name: data.name,
        content: data.content ?? null,
        looping: data.looping,
        version: 1,
        status: 'draft',
      }),
    )

    if (data.requirements.length) {
      const reqRepo = ds.getRepository(ComponentDataRequirementSchema)
      await reqRepo.save(data.requirements.map((r) => reqRepo.create({ componentId: saved.id, name: r.name, type: r.type })))
    }

    return this.findOne(saved.id)
  },

  async update(id: number, data: UpdateComponentInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(ComponentSchema)
    const component: any = await repo.findOne({ where: { id } })
    if (!component) throw httpError(404, 'Component not found')

    const nextRequirements: ComponentRequirementInput[] | undefined = data.requirements
    if (nextRequirements) assertNoDuplicateRequirements(nextRequirements)

    const effectiveContent = data.content !== undefined ? data.content : component.content
    if (nextRequirements) {
      const { unknown } = validatePlaceholders(effectiveContent, nextRequirements)
      if (unknown.length) {
        throw httpError(422, `Unknown placeholder(s) in content: ${unknown.map((u) => `{{${u}}}`).join(', ')}`, { unknown })
      }
    } else if (data.content !== undefined) {
      const current = await ds.getRepository(ComponentDataRequirementSchema).find({ where: { componentId: id } })
      const { unknown } = validatePlaceholders(data.content, current as any[])
      if (unknown.length) {
        throw httpError(422, `Unknown placeholder(s) in content: ${unknown.map((u) => `{{${u}}}`).join(', ')}`, { unknown })
      }
    }

    if (data.name !== undefined && data.name !== component.name) {
      const clash = await repo
        .createQueryBuilder('component')
        .where('LOWER(component.name) = LOWER(:name)', { name: data.name })
        .andWhere('component.id != :id', { id })
        .getOne()
      if (clash) throw httpError(409, `Component "${data.name}" already exists`)
      component.name = data.name
    }
    if (data.content !== undefined) component.content = data.content
    if (data.looping !== undefined) component.looping = data.looping

    if (nextRequirements) {
      // BR-004: removing a requirement used by a template binding is blocked
      // (409) unless that template version is draft. Template tables land in
      // Task 14/16 — enforce via stub interface now.
      const current = await ds.getRepository(ComponentDataRequirementSchema).find({ where: { componentId: id } })
      const nextNames = new Set(nextRequirements.map((r) => r.name))
      const removed = current.filter((c: any) => !nextNames.has(c.name))
      if (removed.length) {
        const usedBy = await findTemplateBindings(id)
        if (usedBy.length) {
          throw httpError(
            409,
            `Cannot remove requirement(s) ${removed.map((r: any) => `"${r.name}"`).join(', ')}: bound by template(s) ${usedBy.map((t) => `"${t.name}"`).join(', ')}`,
            { removed: removed.map((r: any) => r.name), usedBy },
          )
        }
      }
      const reqRepo = ds.getRepository(ComponentDataRequirementSchema)
      await reqRepo.createQueryBuilder().delete().where('componentId = :id', { id }).execute()
      if (nextRequirements.length) {
        await reqRepo.save(nextRequirements.map((r) => reqRepo.create({ componentId: id, name: r.name, type: r.type })))
      }
      // Editing a published component reopens it as draft; the version
      // number only moves on publish (BR-005).
      if (component.status === 'published') component.status = 'draft'
    } else if (data.content !== undefined || data.looping !== undefined) {
      if (component.status === 'published') component.status = 'draft'
    }

    // Refresh cached single-mode preview (optional convenience).
    try {
      const reqs = nextRequirements ?? ((await ds.getRepository(ComponentDataRequirementSchema).find({ where: { componentId: id } })) as any[])
      if (!component.looping) {
        component.preview = renderPreview(component.content, reqs, false).html || null
      }
    } catch {}

    await repo.save(component)
    return this.findOne(id)
  },

  async publish(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(ComponentSchema)
    const component: any = await repo.findOne({ where: { id } })
    if (!component) throw httpError(404, 'Component not found')

    const reqRepo = ds.getRepository(ComponentDataRequirementSchema)
    const verRepo = ds.getRepository(ComponentVersionSchema)
    const requirements = await reqRepo.find({ where: { componentId: id } })
    const { unknown } = validatePlaceholders(component.content, requirements as any[])
    if (unknown.length) {
      throw httpError(422, `Unknown placeholder(s) in content: ${unknown.map((u) => `{{${u}}}`).join(', ')}`, { unknown })
    }

    const snapshotCount = await verRepo.count({ where: { componentId: id } })
    const newVersion = snapshotCount + 1

    await verRepo.save(
      verRepo.create({
        componentId: id,
        version: newVersion,
        content: component.content,
        looping: component.looping,
        requirements: JSON.stringify(requirements.map((r: any) => ({ name: r.name, type: r.type }))),
      }),
    )

    component.version = newVersion
    component.status = 'published'
    try {
      component.preview = renderPreview(component.content, requirements as any[], component.looping).html || null
    } catch {}
    await repo.save(component)
    return this.findOne(id)
  },

  async findVersion(id: number, version: number) {
    const ds = await getDataSource()
    const component = await ds.getRepository(ComponentSchema).findOne({ where: { id } })
    if (!component) throw httpError(404, 'Component not found')
    const snapshot: any = await ds.getRepository(ComponentVersionSchema).findOne({
      where: { componentId: id, version },
    })
    if (!snapshot) throw httpError(404, `Version v${version} not found`)
    return { ...snapshot, requirements: JSON.parse(snapshot.requirements) }
  },

  async preview(id: number, data: PreviewComponentInput) {
    const ds = await getDataSource()
    const component: any = await ds.getRepository(ComponentSchema).findOne({ where: { id } })
    if (!component) throw httpError(404, 'Component not found')
    const requirements = (await ds.getRepository(ComponentDataRequirementSchema).find({
      where: { componentId: id },
    })) as any[]
    const { unknown, unused } = validatePlaceholders(component.content, requirements)
    const { html, blockCount } = renderPreview(
      component.content,
      requirements,
      component.looping,
      (data.samples ?? {}) as Record<string, string | number>,
      data.items as Record<string, string | number>[] | undefined,
    )
    return { html, blockCount, looping: component.looping, unknown, warnings: unused }
  },

  async remove(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(ComponentSchema)
    const component = await repo.findOne({ where: { id } })
    if (!component) throw httpError(404, 'Component not found')

    const usedBy = await findTemplateBindings(id)
    if (usedBy.length) {
      throw httpError(409, `Component is bound by template(s) ${usedBy.map((t) => `"${t.name}"`).join(', ')} and cannot be deleted`, { usedBy })
    }

    // Requirements are deleted explicitly (SQLite has no FK cascade here);
    // version snapshots are retained as immutable history.
    await ds.getRepository(ComponentDataRequirementSchema).createQueryBuilder().delete().where('componentId = :id', { id }).execute()
    await repo.remove(component)
    return { message: 'Component deleted' }
  },

  /** Sample-value helper exposed for the editor UI. */
  sampleFor(type: string, name: string) {
    return sampleValueForType(type, name)
  },
}
