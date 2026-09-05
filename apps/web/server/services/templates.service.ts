import { getDataSource } from '~~/server/utils/db'
import { TemplateSchema, TemplateVersionSchema } from '~~/server/entities/template.entity'
import {
  ComponentSchema,
  ComponentDataRequirementSchema,
  ComponentVersionSchema,
} from '~~/server/entities/component.entity'
import { GlobalTableSchema } from '~~/server/entities/global-table.entity'
import { GlobalTableRowSchema } from '~~/server/entities/global-table-row.entity'
import { isNonEmptyContent, countMeaningfulNodes } from '~~/server/utils/template-helpers'
import {
  validateNodeShapes,
  parseTreeInput,
  hasCompositionNodes,
  sanitizeTree,
  collectPlacements,
  isSlotBound,
  type CompositionNode,
  type TreeIssue,
  type TreeValidation,
  type UnboundSlot,
} from '~~/server/utils/composition-tree'
import { TemplateBindingsService } from '~~/server/services/template-bindings.service'
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

/**
 * Composition-tree validation (Task 15). Pure shape checks live in
 * `server/utils/composition-tree.ts`; the DB-backed checks below resolve
 * component placements (BR-001), loop source tables + rowIds (BR-002), and
 * unbound requirement slots (REQ-006). Legacy Task 14 skeletons (nodes
 * without `kind`) pass through untouched.
 */
async function checkPlacementRequirements(
  ds: any,
  nodeId: string,
  path: string,
  componentId: unknown,
  componentVersion: unknown,
  bindings: Record<string, unknown>,
  errors: TreeIssue[],
  unbound: UnboundSlot[],
): Promise<void> {
  if (typeof componentId !== 'number' || isNaN(componentId)) return // shape error already reported
  const component: any = await ds.getRepository(ComponentSchema).findOne({ where: { id: componentId } })
  if (!component) {
    errors.push({ path: `${path}.attrs.componentId`, message: `Component #${componentId} not found` })
    return
  }
  const verRepo = ds.getRepository(ComponentVersionSchema)
  let snapshot: any = null
  if (componentVersion !== undefined) {
    snapshot = await verRepo.findOne({ where: { componentId, version: componentVersion } })
    if (!snapshot) {
      errors.push({
        path: `${path}.attrs.componentVersion`,
        message: `Component "${component.name}" has no published v${componentVersion}`,
      })
      return
    }
  } else {
    // BR-001: unpinned placements resolve the latest-published version.
    const snapshots: any[] = await verRepo
      .createQueryBuilder('v')
      .where('v.componentId = :id', { id: componentId })
      .orderBy('v.version', 'DESC')
      .limit(1)
      .getMany()
    snapshot = snapshots[0] ?? null
    if (!snapshot) {
      errors.push({
        path: `${path}.attrs.componentVersion`,
        message: `Component "${component.name}" has no published version yet (publish the component first)`,
      })
      return
    }
  }
  let requirements: Array<{ name: string; type: string }> = []
  try {
    const parsed = JSON.parse(snapshot.requirements)
    if (Array.isArray(parsed)) requirements = parsed
  } catch {
    // Fall back to live requirements when the snapshot payload is unreadable.
    const live: any[] = await ds.getRepository(ComponentDataRequirementSchema).find({ where: { componentId } })
    requirements = live.map((r) => ({ name: r.name, type: r.type }))
  }
  for (const req of requirements) {
    if (!isSlotBound(bindings[req.name])) {
      unbound.push({
        nodeId,
        componentId,
        componentName: component.name,
        requirement: req.name,
        type: req.type,
      })
    }
  }
}

async function checkLoopSources(
  ds: any,
  nodes: CompositionNode[],
  basePath: string,
  errors: TreeIssue[],
  warnings: TreeIssue[],
): Promise<void> {
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index]
    const path = `${basePath}[${index}]`
    if (!isCompositionNode(node)) continue
    if (node.kind === 'loop') {
      const source = (node.attrs ?? {}).source
      if (source && typeof source === 'object' && typeof source.tableName === 'string' && source.tableName.trim()) {
        // BR-002: loop source table must exist (case-insensitive name match).
        const tables: any[] = await ds
          .getRepository(GlobalTableSchema)
          .createQueryBuilder('t')
          .where('LOWER(t.name) = LOWER(:name)', { name: source.tableName.trim() })
          .getMany()
        const table = tables[0]
        if (!table) {
          errors.push({ path: `${path}.attrs.source.tableName`, message: `Source table "${source.tableName}" does not exist` })
        } else if (source.mode === 'selected' && Array.isArray(source.rowIds)) {
          const wanted = source.rowIds.map((v: unknown) => Number(v)).filter((v: number) => !isNaN(v))
          if (wanted.length) {
            const found: any[] = await ds
              .getRepository(GlobalTableRowSchema)
              .createQueryBuilder('r')
              .where('r.globalTableId = :tableId', { tableId: table.id })
              .andWhere('r.id IN (:...ids)', { ids: wanted })
              .getMany()
            const foundIds = new Set(found.map((r) => r.id))
            for (const id of wanted) {
              if (!foundIds.has(id)) {
                // BR-002: stale ids warn, never silently drop.
                warnings.push({ path: `${path}.attrs.source.rowIds`, message: `Row #${id} no longer exists in table "${table.name}"` })
              }
            }
          }
        }
      }
    }
    if (Array.isArray(node.children)) {
      await checkLoopSources(ds, node.children, `${path}.children`, errors, warnings)
    }
  }
}

/**
 * Full composition validation for a draft tree: shape-level checks plus
 * DB-backed placement/loop checks. `unbound` never affects `valid` —
 * unbound slots block Publish, not Save (REQ-006).
 */
async function validateCompositionNodes(nodes: unknown[]): Promise<TreeValidation> {
  const shape = validateNodeShapes(nodes)
  const errors = [...shape.errors]
  const warnings = [...shape.warnings]
  const unbound: UnboundSlot[] = []
  const empty: TreeValidation = {
    valid: false,
    errors,
    warnings,
    unbound,
    stats: shape.stats,
  }
  if (errors.length > 0 || !hasCompositionNodes(nodes)) {
    empty.valid = errors.length === 0
    return empty
  }
  const ds = await getDataSource()
  // NOTE: validate against the original array (cast) so error paths keep
  // their real indices when legacy nodes interleave with composition nodes.
  const asNodes = nodes as CompositionNode[]
  for (const placement of collectPlacements(asNodes)) {
    await checkPlacementRequirements(
      ds,
      placement.nodeId,
      placement.path,
      placement.componentId,
      placement.componentVersion,
      placement.bindings,
      errors,
      unbound,
    )
  }
  await checkLoopSources(ds, asNodes, 'nodes', errors, warnings)
  return { valid: errors.length === 0, errors, warnings, unbound, stats: shape.stats }
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

  /**
   * Live editor feedback (Task 15 API): validate a candidate draft tree
   * without persisting it. `content` accepts the JSON string or the parsed
   * `{ nodes: [...] }` object. Always 200s — problems surface via
   * `errors` (save-blocking) and `unbound` (publish-blocking).
   */
  async validateTree(id: number, content: unknown): Promise<TreeValidation> {
    const ds = await getDataSource()
    const template = await ds.getRepository(TemplateSchema).findOne({ where: { id } })
    if (!template) throw httpError(404, 'Template not found')
    const parsed = parseTreeInput(content)
    if (!Array.isArray(parsed.nodes)) {
      return {
        valid: false,
        errors: [{ path: 'content', message: parsed.error ?? 'Content must be a JSON document tree { nodes: [...] }' }],
        warnings: [],
        unbound: [],
        stats: { nodeCount: 0, placementCount: 0, loopCount: 0, conditionCount: 0, tokenCount: 0 },
      }
    }
    return validateCompositionNodes(parsed.nodes)
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
    if (data.content !== undefined) {
      // Task 15: pasted HTML is sanitized authoritatively on save (AC-005)
      // and structural problems (bad shapes, invalid conditions/tokens per
      // AC-003, unknown components) block the save. Unbound slots stay
      // draft-legal — only Publish rejects them (REQ-006).
      const trimmed = typeof data.content === 'string' ? data.content.trim() : ''
      if (trimmed) {
        const parsed = parseTreeInput(data.content)
        if (!Array.isArray(parsed.nodes)) {
          throw httpError(422, parsed.error ?? 'Content must be a JSON document tree { nodes: [...] }')
        }
        const sanitized = sanitizeTree(parsed.nodes as CompositionNode[])
        const checked = await validateCompositionNodes(sanitized)
        if (checked.errors.length > 0) {
          throw httpError(422, checked.errors[0].message, { code: 'INVALID_TREE', errors: checked.errors })
        }
        template.content = JSON.stringify({ nodes: sanitized })
      } else {
        template.content = data.content
      }
    }
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

    // Task 15 publish-guard extension: composition trees must be
    // structurally valid and carry zero unbound requirement slots (REQ-006,
    // AC-004). Legacy Task 14 skeletons skip this gate.
    const parsed = parseTreeInput(template.content)
    if (Array.isArray(parsed.nodes) && hasCompositionNodes(parsed.nodes)) {
      const checked = await validateCompositionNodes(parsed.nodes)
      if (checked.errors.length > 0) {
        throw httpError(422, checked.errors[0].message, { code: 'INVALID_TREE', errors: checked.errors })
      }
      if (checked.unbound.length > 0) {
        const names = checked.unbound.map((s) => `"${s.componentName ?? `#${s.componentId}`} · ${s.requirement}"`)
        throw httpError(422, `Cannot publish: ${checked.unbound.length} unbound requirement slot(s): ${names.join(', ')}`, {
          code: 'UNBOUND_REQUIREMENTS',
          slots: checked.unbound,
        })
      }
    }

    // Task 16: embed bindings snapshot into version content (REQ-005).
    // Bindings travel inside the version snapshot JSON — no separate versioned rows.
    let versionContent = template.content as string
    try {
      const bindingsSnapshot = await TemplateBindingsService.snapshotForPublish(id)
      if (Object.keys(bindingsSnapshot).length > 0) {
        const parsed = parseTreeInput(template.content)
        if (Array.isArray(parsed.nodes)) {
          versionContent = JSON.stringify({ nodes: parsed.nodes, bindings: bindingsSnapshot })
        }
      }
    } catch {
      // If bindings lookup fails (e.g. entity not yet created), fall back to raw content.
    }

    const verRepo = ds.getRepository(TemplateVersionSchema)
    const snapshotCount = await verRepo.count({ where: { templateId: id } })
    const newVersion = snapshotCount + 1

    await verRepo.save(
      verRepo.create({
        templateId: id,
        version: newVersion,
        content: versionContent,
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
