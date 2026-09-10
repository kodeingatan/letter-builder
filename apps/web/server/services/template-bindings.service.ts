import { getDataSource } from '~~/server/utils/db'
import { TemplateBindingSchema } from '~~/server/entities/template-binding.entity'
import { TemplateSchema } from '~~/server/entities/template.entity'
import {
  ComponentSchema,
  ComponentDataRequirementSchema,
  ComponentVersionSchema,
} from '~~/server/entities/component.entity'
import { GlobalTableSchema } from '~~/server/entities/global-table.entity'
import { GlobalTableColumnSchema } from '~~/server/entities/global-table-column.entity'
import { validate, evaluate } from '~~/server/utils/expressions'
import { BINDING_SOURCES, SYSTEM_KEYS } from '~~/server/dto/template-bindings.dto'
import type { BindingUpsertInput, BulkBindingsInput, PreviewBindingsInput } from '~~/server/dto/template-bindings.dto'
import {
  collectPlacements,
  isCompositionNode,
  isSlotBound,
} from '~~/server/utils/composition-tree'
// Canonical composition type (Task 24 single source of truth).
import type { CompositionNode } from '../../shared/types/template'
import { isItemScopedRef, itemFieldOf, slotKeyOf } from '~~/server/utils/binding-refs'

export { isItemScopedRef, itemFieldOf, slotKeyOf }

function httpError(statusCode: number, message: string, data?: unknown): Error {
  return Object.assign(new Error(message), { statusCode, data })
}

// ---------------------------------------------------------------------------
// Source-specific ref validators (REQ-003, BR-002)
// ---------------------------------------------------------------------------

interface ValidationResult {
  valid: boolean
  error?: string
}

async function validateAdministrationRef(sourceRef: string): Promise<ValidationResult> {
  // Loop-item refs resolve against the collection item at run time (REQ-002).
  if (isItemScopedRef(sourceRef)) return { valid: true }
  // Administration fields (Task 17) may not exist yet — graceful empty state.
  const ds = await getDataSource()
  if (!ds.hasMetadata('administration_steps')) {
    return { valid: true }
  }
  // For now, accept any non-empty ref; Task 17 schema validation plugs in later.
  return { valid: true }
}

async function validateGlobalTableRef(sourceRef: string): Promise<ValidationResult> {
  // Loop-item refs resolve against the collection item at run time (REQ-002).
  if (isItemScopedRef(sourceRef)) return { valid: true }
  // sourceRef format: "tableName.columnName" or "tableName"
  const parts = sourceRef.split('.')
  if (parts.length < 1 || !parts[0]?.trim()) {
    return { valid: false, error: 'global_table sourceRef must reference a table name' }
  }
  const tableName = parts[0].trim()
  const columnName = parts.length > 1 ? parts[1].trim() : null

  const ds = await getDataSource()
  const tables: any[] = await ds
    .getRepository(GlobalTableSchema)
    .createQueryBuilder('t')
    .where('LOWER(t.name) = LOWER(:name)', { name: tableName })
    .getMany()
  const table = tables[0]
  if (!table) {
    return { valid: false, error: `Global Table "${tableName}" does not exist` }
  }

  if (columnName) {
    const columns: any[] = await ds
      .getRepository(GlobalTableColumnSchema)
      .createQueryBuilder('c')
      .where('c."globalTableId" = :tableId', { tableId: table.id })
      .andWhere('LOWER(c.name) = LOWER(:col)', { col: columnName })
      .getMany()
    if (!columns.length) {
      return { valid: false, error: `Column "${columnName}" does not exist in table "${tableName}"` }
    }
  }

  return { valid: true }
}

async function validateExpressionRef(expression: string): Promise<ValidationResult> {
  const result = validate(expression)
  if (!result.valid) {
    return { valid: false, error: `Expression validation failed: ${result.error}` }
  }
  return { valid: true }
}

async function validateSystemRef(sourceRef: string): Promise<ValidationResult> {
  if (!(SYSTEM_KEYS as readonly string[]).includes(sourceRef)) {
    return { valid: false, error: `System key "${sourceRef}" is not whitelisted. Allowed: ${SYSTEM_KEYS.join(', ')}` }
  }
  return { valid: true }
}

async function validateBindingRef(binding: BindingUpsertInput): Promise<ValidationResult> {
  switch (binding.source) {
    case 'administration':
      return validateAdministrationRef(binding.sourceRef ?? '')
    case 'global_table':
      return validateGlobalTableRef(binding.sourceRef ?? '')
    case 'manual':
      return { valid: true } // literalValue already validated by Zod
    case 'expression':
      return validateExpressionRef(binding.expression ?? '')
    case 'system':
      return validateSystemRef(binding.sourceRef ?? '')
    default:
      return { valid: false, error: `Unknown source "${binding.source}"` }
  }
}

// ---------------------------------------------------------------------------
// Type compatibility check (BR-005)
// ---------------------------------------------------------------------------

const HARD_MISMATCHES: Array<[string, string]> = [
  ['image', 'number'],
  ['date', 'image'],
]

function checkTypeCompatibility(
  requirementType: string,
  source: string,
  literalValue?: string | null,
): { compatible: boolean; warning?: string } {
  if (source === 'expression' || source === 'administration' || source === 'system') {
    return { compatible: true }
  }
  if (source === 'global_table') {
    // Global table columns have their own type; cross-check is deferred to render time.
    return { compatible: true }
  }
  if (source === 'manual' && literalValue != null) {
    for (const [reqType, srcType] of HARD_MISMATCHES) {
      if (requirementType === reqType && source === 'manual') {
        // Check if the literal looks numeric when the requirement expects non-numeric
        if (requirementType === 'image' && /^\d+(\.\d+)?$/.test(literalValue)) {
          return { compatible: false, warning: `Hard mismatch: image requirement bound to numeric literal` }
        }
      }
    }
    // Soft mismatch: text requirement with number literal — warn only
    if (requirementType === 'text' && /^\d+(\.\d+)?$/.test(literalValue)) {
      return { compatible: true, warning: `Soft mismatch: text requirement bound to numeric literal` }
    }
  }
  return { compatible: true }
}

// ---------------------------------------------------------------------------
// Stale detection (BR-006)
// ---------------------------------------------------------------------------

async function detectStaleBindings(
  ds: any,
  templateId: number,
): Promise<Map<string, string>> {
  const staleMap = new Map<string, string>()
  const bindings: any[] = await ds
    .getRepository(TemplateBindingSchema)
    .find({ where: { templateId } })

  for (const b of bindings) {
    // Loop-item refs are scoped to the run-time collection item (REQ-002) —
    // never stale, regardless of which tables/columns exist.
    if (isItemScopedRef(b.sourceRef)) continue
    if (b.source === 'global_table' && b.sourceRef) {
      const parts = b.sourceRef.split('.')
      const tableName = parts[0]
      const columnName = parts[1]
      if (tableName && columnName) {
        const tables: any[] = await ds
          .getRepository(GlobalTableSchema)
          .createQueryBuilder('t')
          .where('LOWER(t.name) = LOWER(:name)', { name: tableName })
          .getMany()
        const table = tables[0]
        if (!table) {
          staleMap.set(slotKeyOf(b.placementId, b.requirementName), `Table "${tableName}" no longer exists`)
          continue
        }
        const columns: any[] = await ds
          .getRepository(GlobalTableColumnSchema)
          .createQueryBuilder('c')
          .where('c."globalTableId" = :tableId', { tableId: table.id })
          .andWhere('LOWER(c.name) = LOWER(:col)', { col: columnName })
          .getMany()
        if (!columns.length) {
          staleMap.set(slotKeyOf(b.placementId, b.requirementName), `Column "${columnName}" no longer exists in table "${tableName}"`)
        }
      }
    }
    // Check if the component or its requirement still exists
    const component = await ds.getRepository(ComponentSchema).findOne({ where: { id: b.componentId } })
    if (!component) {
      staleMap.set(slotKeyOf(b.placementId, b.requirementName), `Component #${b.componentId} no longer exists`)
      continue
    }
    const req = await ds
      .getRepository(ComponentDataRequirementSchema)
      .createQueryBuilder('r')
      .where('r."componentId" = :cid', { cid: b.componentId })
      .andWhere('LOWER(r.name) = LOWER(:name)', { name: b.requirementName })
      .getOne()
    if (!req) {
      staleMap.set(slotKeyOf(b.placementId, b.requirementName), `Requirement "${b.requirementName}" no longer exists on component "${component.name}"`)
    }
  }

  return staleMap
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSystemContext(): Record<string, unknown> {
  const now = new Date()
  return {
    current_date: now.toISOString().split('T')[0],
  }
}

// ---------------------------------------------------------------------------
// Draft-tree slot helpers (REQ-006 / C4)
// ---------------------------------------------------------------------------

/** Parse the draft working-copy tree from `templates.content` (JSON string). */
function draftNodesOf(content: unknown): CompositionNode[] | null {
  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content
    const nodes = Array.isArray(parsed) ? parsed : parsed?.nodes
    if (!Array.isArray(nodes)) return null
    const valid = nodes.filter(isCompositionNode)
    return valid.length || nodes.length === 0 ? valid : null
  } catch {
    return null
  }
}

/**
 * Map every component placement to whether it sits inside a loop node
 * (drives REQ-004 `item.*` defaults in the Bindings tab).
 */
function placementLoopMap(nodes: CompositionNode[]): Map<string, boolean> {
  const map = new Map<string, boolean>()
  const walk = (list: CompositionNode[], inLoop: boolean) => {
    for (const node of list) {
      if (!isCompositionNode(node)) continue
      const inside = inLoop || node.kind === 'loop'
      if (node.kind === 'component') map.set(node.id, inLoop)
      if (Array.isArray(node.children)) walk(node.children as CompositionNode[], inside)
    }
  }
  walk(nodes, false)
  return map
}

/**
 * Resolve the data-requirement contract for a placement: published component
 * version snapshot first, live requirements as fallback (mirrors
 * `checkPlacementRequirements` in templates.service.ts).
 */
async function resolvePlacementRequirements(
  ds: any,
  componentId: number,
  componentVersion: unknown,
): Promise<Array<{ name: string; type: string }>> {
  let requirements: Array<{ name: string; type: string }> = []
  try {
    const verRepo = ds.getRepository(ComponentVersionSchema)
    let snapshot: any = null
    if (typeof componentVersion === 'number') {
      snapshot = await verRepo.findOne({ where: { componentId, version: componentVersion } })
    } else {
      const snapshots: any[] = await verRepo
        .createQueryBuilder('v')
        .where('v.componentId = :id', { id: componentId })
        .orderBy('v.version', 'DESC')
        .limit(1)
        .getMany()
      snapshot = snapshots[0] ?? null
    }
    if (snapshot) {
      const parsed = JSON.parse(snapshot.requirements)
      if (Array.isArray(parsed)) requirements = parsed
    }
  } catch {
    // Fall through to live requirements below.
  }
  if (!requirements.length) {
    const live: any[] = await ds.getRepository(ComponentDataRequirementSchema).find({ where: { componentId } })
    requirements = live.map((r) => ({ name: r.name, type: r.type }))
  }
  return requirements
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const TemplateBindingsService = {
  /**
   * Slot states for a template draft: every persisted binding keyed by slot,
   * with lazy stale detection applied (BR-006). Used by `findAll` and by
   * `validate-tree` (REQ-006) so both read the same store.
   */
  async slotStates(templateId: number): Promise<Map<string, 'bound' | 'stale'>> {
    const ds = await getDataSource()
    const bindings: any[] = await ds
      .getRepository(TemplateBindingSchema)
      .find({ where: { templateId } })
    const staleMap = await detectStaleBindings(ds, templateId)
    const states = new Map<string, 'bound' | 'stale'>()
    for (const b of bindings) {
      const key = slotKeyOf(b.placementId, b.requirementName)
      states.set(key, staleMap.has(key) || b.status === 'stale' ? 'stale' : 'bound')
    }
    return states
  },

  /**
   * GET /api/templates/:id/bindings
   * All requirement slots of every draft-tree placement, grouped by
   * placement: bound rows from this store plus synthetic `unbound` rows for
   * slots with no binding yet (so Designers can bind from scratch).
   * `totalUnbound` drives the publish guard badge (REQ-006).
   */
  async findAll(templateId: number) {
    const ds = await getDataSource()
    const template = await ds.getRepository(TemplateSchema).findOne({ where: { id: templateId } })
    if (!template) throw httpError(404, 'Template not found')

    const bindings: any[] = await ds
      .getRepository(TemplateBindingSchema)
      .find({ where: { templateId } })
    const bySlot = new Map<string, any>()
    for (const b of bindings) bySlot.set(slotKeyOf(b.placementId, b.requirementName), b)

    const staleMap = await detectStaleBindings(ds, templateId)

    // Walk the draft tree so unbound slots are listed, not just bound rows.
    const nodes = draftNodesOf((template as any).content)
    const placements = nodes ? collectPlacements(nodes) : []
    const loopMap = nodes ? placementLoopMap(nodes) : new Map<string, boolean>()

    const groups: any[] = []
    let totalUnbound = 0

    for (const p of placements) {
      if (typeof p.componentId !== 'number') continue
      const component = await ds.getRepository(ComponentSchema).findOne({ where: { id: p.componentId } })
      const componentName = component?.name ?? `#${p.componentId}`
      const requirements = await resolvePlacementRequirements(ds, p.componentId, p.componentVersion)
      const rows: any[] = []
      let unboundCount = 0
      for (const req of requirements) {
        const key = slotKeyOf(p.nodeId, req.name)
        const stored = bySlot.get(key)
        const staleReason = staleMap.get(key)
        if (stored && !staleReason) {
          rows.push({
            ...stored,
            componentName,
            requirementType: req.type,
            status: 'bound',
          })
        } else if (stored && staleReason) {
          rows.push({
            ...stored,
            componentName,
            requirementType: req.type,
            status: 'stale',
            staleReason,
          })
          unboundCount++
        } else {
          // Synthetic unbound slot — no row persisted yet (C4).
          rows.push({
            id: null,
            templateId,
            placementId: p.nodeId,
            componentId: p.componentId,
            requirementName: req.name,
            source: 'manual',
            sourceRef: null,
            literalValue: null,
            expression: null,
            status: 'unbound',
            componentName,
            requirementType: req.type,
          })
          unboundCount++
        }
      }
      totalUnbound += unboundCount
      groups.push({
        placementId: p.nodeId,
        componentId: p.componentId,
        componentName,
        componentVersion: p.componentVersion,
        inLoop: loopMap.get(p.nodeId) ?? false,
        bindings: rows,
        unboundCount,
      })
    }

    // Bound rows whose placement vanished from the tree (deleted node):
    // surface them so they can be rebound or removed instead of leaking.
    const knownPlacements = new Set(placements.map((p) => p.nodeId))
    for (const b of bindings) {
      if (knownPlacements.has(b.placementId)) continue
      const component = await ds.getRepository(ComponentSchema).findOne({ where: { id: b.componentId } })
      groups.push({
        placementId: b.placementId,
        componentId: b.componentId,
        componentName: component?.name ?? `#${b.componentId}`,
        componentVersion: undefined,
        inLoop: false,
        orphaned: true,
        bindings: [
          {
            ...b,
            componentName: component?.name ?? `#${b.componentId}`,
            requirementType: 'text',
            status: 'stale',
            staleReason: `Placement "${b.placementId}" no longer exists in the draft tree`,
          },
        ],
        unboundCount: 1,
      })
      totalUnbound++
    }

    return {
      placements: groups,
      totalBindings: bindings.length,
      totalUnbound,
    }
  },

  /**
   * PUT /api/templates/:id/bindings
   * Bulk upsert bindings in a transaction. Validates all refs (REQ-003).
   * Returns saved count and list of stale slots (BR-006).
   */
  async bulkUpsert(templateId: number, data: BulkBindingsInput) {
    const ds = await getDataSource()
    const template = await ds.getRepository(TemplateSchema).findOne({ where: { id: templateId } })
    if (!template) throw httpError(404, 'Template not found')

    // Validate all refs before persisting (transactional: all-or-nothing)
    for (const binding of data.bindings) {
      const refCheck = await validateBindingRef(binding)
      if (!refCheck.valid) {
        throw httpError(
          422,
          `Invalid binding for "${binding.requirementName}" on placement "${binding.placementId}": ${refCheck.error}`,
          { placementId: binding.placementId, requirementName: binding.requirementName, error: refCheck.error },
        )
      }

      // Type compatibility check (BR-005)
      const comp = await ds.getRepository(ComponentSchema).findOne({ where: { id: binding.componentId } })
      if (!comp) {
        throw httpError(422, `Component #${binding.componentId} not found`)
      }
      const req = await ds
        .getRepository(ComponentDataRequirementSchema)
        .createQueryBuilder('r')
        .where('r."componentId" = :cid', { cid: binding.componentId })
        .andWhere('LOWER(r.name) = LOWER(:name)', { name: binding.requirementName })
        .getOne()
      const reqType = req?.type ?? 'text'
      const compat = checkTypeCompatibility(reqType, binding.source, binding.literalValue)
      if (!compat.compatible) {
        throw httpError(
          422,
          `Type mismatch for "${binding.requirementName}": ${compat.warning}`,
          { placementId: binding.placementId, requirementName: binding.requirementName, warning: compat.warning },
        )
      }
    }

    // Transactional bulk upsert
    const queryRunner = ds.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const repo = queryRunner.manager.getRepository(TemplateBindingSchema)
      let savedCount = 0

      for (const binding of data.bindings) {
        // BR-001: One binding per (templateId, placementId, requirementName); rebind overwrites
        const existing: any = await repo.findOne({
          where: {
            templateId,
            placementId: binding.placementId,
            requirementName: binding.requirementName,
          },
        })

        if (existing) {
          existing.componentId = binding.componentId
          existing.source = binding.source
          existing.sourceRef = binding.sourceRef ?? null
          existing.literalValue = binding.literalValue ?? null
          existing.expression = binding.expression ?? null
          existing.status = 'bound'
          await repo.save(existing)
        } else {
          await repo.save(
            repo.create({
              templateId,
              placementId: binding.placementId,
              componentId: binding.componentId,
              requirementName: binding.requirementName,
              source: binding.source,
              sourceRef: binding.sourceRef ?? null,
              literalValue: binding.literalValue ?? null,
              expression: binding.expression ?? null,
              status: 'bound',
            }),
          )
        }
        savedCount++
      }

      await queryRunner.commitTransaction()

      // Detect stale after save
      const staleMap = await detectStaleBindings(ds, templateId)
      const stale = Array.from(staleMap.entries()).map(([slot, reason]) => `${slot}: ${reason}`)

      return { saved: savedCount, stale }
    } catch (err: any) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  },

  /**
   * DELETE /api/templates/:id/bindings/:bindingId
   * Remove a single binding (unbind slot).
   */
  async remove(templateId: number, bindingId: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(TemplateBindingSchema)
    const binding: any = await repo.findOne({ where: { id: bindingId, templateId } })
    if (!binding) throw httpError(404, 'Binding not found')
    await repo.remove(binding)
    return { message: 'Binding removed' }
  },

  /**
   * POST /api/templates/:id/bindings/preview
   * Resolve bindings against a sample context (no persistence).
   */
  async preview(templateId: number, data: PreviewBindingsInput) {
    const ds = await getDataSource()
    const template = await ds.getRepository(TemplateSchema).findOne({ where: { id: templateId } })
    if (!template) throw httpError(404, 'Template not found')

    const bindings: any[] = await ds
      .getRepository(TemplateBindingSchema)
      .find({ where: { templateId } })

    const systemCtx = buildSystemContext()
    const evalContext = {
      ...data.sampleContext,
      system: systemCtx,
    }

    const slots = await Promise.all(
      bindings.map(async (b: any) => {
        let resolvedValue: unknown = null
        let error: string | undefined

        try {
          // REQ-002/AC-003: loop-item refs resolve per collection item.
          // `sampleContext.items` (array) yields one value per row; a single
          // `sampleContext.item` object resolves one row.
          if (isItemScopedRef(b.sourceRef) && (b.source === 'global_table' || b.source === 'administration')) {
            const field = itemFieldOf(b.sourceRef ?? '')
            const ctx: any = data.sampleContext ?? {}
            if (field === null) {
              resolvedValue = Array.isArray(ctx.items) ? ctx.items : (ctx.item ?? null)
            } else if (Array.isArray(ctx.items)) {
              resolvedValue = ctx.items.map((row: any) =>
                row && typeof row === 'object' ? (row[field] ?? null) : null,
              )
            } else if (ctx.item && typeof ctx.item === 'object') {
              resolvedValue = ctx.item[field] ?? null
            } else {
              resolvedValue = null
            }
          } else {
            switch (b.source) {
              case 'administration':
                resolvedValue = data.sampleContext[b.sourceRef ?? ''] ?? null
                break
              case 'global_table': {
                // Format: "tableName.columnName" — resolve from sampleContext.data
                const parts = (b.sourceRef ?? '').split('.')
                const tableName = parts[0]
                const columnName = parts[1]
                const tableData = (data.sampleContext as any)?.data?.[tableName]
                if (tableData && typeof tableData === 'object') {
                  resolvedValue = tableData[columnName] ?? null
                }
                break
              }
              case 'manual':
                resolvedValue = b.literalValue ?? null
                break
              case 'expression': {
                const result = evaluate(b.expression ?? '', evalContext)
                if (result.error) {
                  error = result.error
                } else {
                  resolvedValue = result.value
                }
                break
              }
              case 'system':
                resolvedValue = systemCtx[b.sourceRef ?? ''] ?? null
                break
            }
          }
        } catch (e: any) {
          error = e.message ?? 'Resolution failed'
        }

        return {
          placementId: b.placementId,
          requirementName: b.requirementName,
          source: b.source,
          resolvedValue,
          error,
        }
      }),
    )

    return { slots }
  },

  /**
   * Mark bindings as stale when a column is deleted (BR-006 hook).
   * Called by GlobalTableColumnService when a column is removed.
   */
  async markStaleForColumn(tableId: number, columnName: string) {
    const ds = await getDataSource()
    const table = await ds.getRepository(GlobalTableSchema).findOne({ where: { id: tableId } })
    if (!table) return

    const bindings: any[] = await ds
      .getRepository(TemplateBindingSchema)
      .createQueryBuilder('b')
      .where("b.source = 'global_table'")
      .getMany()

    const stalePrefix = `${table.name}.${columnName}`.toLowerCase()
    for (const b of bindings) {
      if (b.sourceRef && b.sourceRef.toLowerCase().startsWith(stalePrefix)) {
        b.status = 'stale'
        await ds.getRepository(TemplateBindingSchema).save(b)
      }
    }
  },

  /**
   * Mark bindings as stale when a requirement is removed from a component (BR-006 hook).
   */
  async markStaleForRequirement(componentId: number, requirementName: string) {
    const ds = await getDataSource()
    const bindings: any[] = await ds
      .getRepository(TemplateBindingSchema)
      .createQueryBuilder('b')
      .where('b."componentId" = :cid', { cid: componentId })
      .andWhere('LOWER(b."requirementName") = LOWER(:name)', { name: requirementName })
      .getMany()

    for (const b of bindings) {
      b.status = 'stale'
      await ds.getRepository(TemplateBindingSchema).save(b)
    }
  },

  /**
   * Embed bindings snapshot for publish (Task 14/15 integration).
   * Returns the bindings array as a JSON-serializable object keyed by placementId.
   */
  async snapshotForPublish(templateId: number): Promise<Record<string, unknown[]>> {
    const ds = await getDataSource()
    const bindings: any[] = await ds
      .getRepository(TemplateBindingSchema)
      .find({ where: { templateId } })

    const grouped: Record<string, unknown[]> = {}
    for (const b of bindings) {
      if (!grouped[b.placementId]) grouped[b.placementId] = []
      grouped[b.placementId].push({
        requirementName: b.requirementName,
        source: b.source,
        sourceRef: b.sourceRef,
        literalValue: b.literalValue,
        expression: b.expression,
      })
    }
    return grouped
  },

  /**
   * Count unbound slots for a template (REQ-006): every requirement slot of
   * every draft-tree placement minus slots bound either in the tree attrs or
   * in this store (stale rows do not count as bound).
   */
  async countUnbound(templateId: number): Promise<number> {
    const ds = await getDataSource()
    const template: any = await ds.getRepository(TemplateSchema).findOne({ where: { id: templateId } })
    if (!template) throw httpError(404, 'Template not found')
    const nodes = draftNodesOf(template.content)
    if (!nodes) return 0
    const states = await TemplateBindingsService.slotStates(templateId)
    let unbound = 0
    for (const p of collectPlacements(nodes)) {
      if (typeof p.componentId !== 'number') continue
      const reqs = await resolvePlacementRequirements(ds, p.componentId, p.componentVersion)
      const treeBindings = (p as { bindings?: Record<string, unknown> }).bindings ?? {}
      for (const r of reqs) {
        if (states.get(slotKeyOf(p.nodeId, r.name)) !== 'bound' && !isSlotBound(treeBindings[r.name])) {
          unbound++
        }
      }
    }
    return unbound
  },
}
