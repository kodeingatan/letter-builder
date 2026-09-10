import { getDataSource } from '~~/server/utils/db'
import { TemplateSchema, TemplateVersionSchema } from '~~/server/entities/template.entity'
import {
  ComponentSchema,
  ComponentDataRequirementSchema,
  ComponentVersionSchema,
} from '~~/server/entities/component.entity'
import { TemplateBindingSchema } from '~~/server/entities/template-binding.entity'
import { GlobalTableSchema } from '~~/server/entities/global-table.entity'
import { GlobalTableRowSchema } from '~~/server/entities/global-table-row.entity'
import { parseTreeInput, collectPlacements } from '~~/server/utils/composition-tree'
import { validateSnapshot } from '~~/server/utils/document-helpers'
import {
  render,
  RenderTimeoutError,
} from '~~/server/utils/rendering/pipeline'
import { htmlToPdf } from '~~/server/utils/rendering/pdf'
import type {
  BindingLike,
  ComponentSnapshotLike,
  RenderContext,
  RenderResult,
} from '~~/server/utils/rendering/types'
// Canonical render warning type (Task 24 single source of truth).
import type { RenderWarning } from '../../shared/types/render'
import { StorageService } from '~~/server/services/storage.service'

function httpError(statusCode: number, message: string, data?: unknown): Error {
  return Object.assign(new Error(message), { statusCode, data })
}

export const PREVIEW_TIMEOUT_MS = 10_000
export const ISSUANCE_TIMEOUT_MS = 30_000

function parseValues(raw: unknown): Record<string, any> {
  if (!raw) return {}
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

async function liveSnapshotsForPlacements(
  placements: Array<{ componentId: number; componentVersion?: number }>,
): Promise<ComponentSnapshotLike[]> {
  const ds = await getDataSource()
  const snapshots: ComponentSnapshotLike[] = []
  for (const placement of placements) {
    if (typeof placement.componentId !== 'number') continue
    const component: any = await ds.getRepository(ComponentSchema).findOne({ where: { id: placement.componentId } })
    if (!component) continue
    let snapshotRow: any = null
    if (typeof placement.componentVersion === 'number') {
      snapshotRow = await ds.getRepository(ComponentVersionSchema).findOne({
        where: { componentId: component.id, version: placement.componentVersion },
      })
    }
    let requirements: Array<{ name: string; type: string }> = []
    if (snapshotRow) {
      try {
        const parsed = JSON.parse(snapshotRow.requirements)
        if (Array.isArray(parsed)) requirements = parsed
      } catch {}
    }
    if (!requirements.length) {
      const live: any[] = await ds.getRepository(ComponentDataRequirementSchema).find({ where: { componentId: component.id } })
      requirements = live.map((r) => ({ name: r.name, type: r.type }))
    }
    snapshots.push({
      componentId: component.id,
      componentName: component.name,
      content: snapshotRow?.content ?? component.content,
      looping: snapshotRow?.looping ?? component.looping ?? false,
      requirements,
    })
  }
  return snapshots
}

function runTimed<T>(fn: () => T, timeoutMs: number): T {
  try {
    return fn()
  } catch (e: any) {
    if (e instanceof RenderTimeoutError || e?.code === 'TIMEOUT') {
      throw httpError(timeoutMs >= ISSUANCE_TIMEOUT_MS ? 503 : 408, 'Render timed out before completion', {
        code: 'TIMEOUT',
      })
    }
    throw e
  }
}

export const RenderingService = {
  /**
   * REQ-005: preview an inline tree against a sample context.
   * Designer/Operator preview path — debounced by callers.
   */
  async previewWithTree(tree: unknown, context: RenderContext): Promise<RenderResult> {
    const { nodes, error } = parseTreeInput(
      typeof tree === 'string' ? tree : { nodes: Array.isArray(tree) ? tree : (tree as { nodes?: unknown })?.nodes ?? tree },
    )
    if (error) throw httpError(422, error, { code: 'INVALID_TREE' })
    return runTimed(() => render(nodes, context ?? {}, { timeoutMs: PREVIEW_TIMEOUT_MS }), PREVIEW_TIMEOUT_MS)
  },

  /**
   * REQ-005: preview a stored template (draft tree + live bindings +
   * live component requirements) against a sample context.
   */
  async previewForTemplate(templateId: number, sampleContext: RenderContext): Promise<RenderResult> {
    const ds = await getDataSource()
    const template: any = await ds.getRepository(TemplateSchema).findOne({ where: { id: templateId } })
    if (!template) throw httpError(404, 'Template not found')
    const { nodes, error } = parseTreeInput(template.content)
    if (error || !Array.isArray(nodes)) {
      throw httpError(422, 'Template has no composition tree to preview', { code: 'INVALID_TREE' })
    }
    const placements = collectPlacements(nodes as any)
    const [snapshots, bindings] = await Promise.all([
      liveSnapshotsForPlacements(placements),
      ds.getRepository(TemplateBindingSchema).find({ where: { templateId } }) as Promise<BindingLike[]>,
    ])
    return runTimed(
      () =>
        render(nodes, sampleContext ?? {}, {
          componentSnapshots: snapshots,
          bindings,
          timeoutMs: PREVIEW_TIMEOUT_MS,
        }),
      PREVIEW_TIMEOUT_MS,
    )
  },

  /**
   * REQ-006: internal issuance render over a FROZEN snapshot
   * (`{ runInput, templateContent, componentSnapshots, bindings,
   * resolvedPins, systemContext }` + optional `tableData` frozen by
   * DocumentsService at issue time). Pure w.r.t. live tables (BR-001):
   * Global Table rows are read from `snapshot.tableData`, never re-fetched.
   *
   * Returns `{ html, pdfBuffer, warnings, timings }` with per-stage
   * timings; the caller persists the bytes (no partial document is
   * written when the render throws — BR-004).
   */
  async renderForDocument(snapshot: Record<string, any>): Promise<{
    html: string
    pdfBuffer: Buffer
    warnings: RenderWarning[]
    timings: RenderResult['timings']
  }> {
    const check = validateSnapshot(snapshot)
    if (!check.valid) {
      throw httpError(422, `Document snapshot incomplete (missing: ${check.missing.join(', ')})`, {
        code: 'SNAPSHOT_INCOMPLETE',
        missing: check.missing,
      })
    }
    const { nodes } = parseTreeInput(snapshot.templateContent)
    const runInput = (snapshot.runInput ?? {}) as Record<string, any>
    const fields = (runInput.fields ?? {}) as Record<string, any>
    const manuals = (runInput.manualInputs ?? {}) as Record<string, any>
    const tableData = (snapshot.tableData ?? {}) as Record<string, any>
    const systemContext = (snapshot.systemContext ?? {}) as Record<string, any>
    const issuedAt = typeof systemContext.issuedAt === 'string' ? systemContext.issuedAt : new Date().toISOString()

    const context: RenderContext = {
      ...fields,
      ...manuals,
      data: { ...tableData, ...fields, ...manuals },
      administration: { ...fields },
      system: { current_date: issuedAt.split('T')[0], ...systemContext },
      run: { runId: systemContext.runId ?? null, administrationId: systemContext.administrationId ?? null },
    }

    const result = runTimed(
      () =>
        render(nodes, context, {
          componentSnapshots: (snapshot.componentSnapshots ?? []) as ComponentSnapshotLike[],
          bindings: (snapshot.bindings ?? []) as BindingLike[],
          timeoutMs: ISSUANCE_TIMEOUT_MS,
        }),
      ISSUANCE_TIMEOUT_MS,
    )
    // Deterministic for identical input (fixed PDF metadata, AC-004).
    const pdfBuffer = htmlToPdf(result.html)
    // eslint-disable-next-line no-console
    console.info(
      `[RenderingService] renderForDocument warnings=${result.warnings.length} timings=${JSON.stringify(result.timings)}`,
    )
    return { html: result.html, pdfBuffer, warnings: result.warnings, timings: result.timings }
  },

  /** Persist an issuance PDF buffer under `storage/documents/`. */
  async persistPdf(buffer: Buffer, hint: string): Promise<string> {
    const safe = String(hint || 'document').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'document'
    return StorageService.saveFile('documents', { originalFilename: `${safe}.pdf`, buffer })
  },

  /**
   * Freeze selected Global Table rows into `tableData` at issue time.
   * Called by DocumentsService BEFORE rendering so the snapshot (and
   * therefore every future re-render) is stable even if live rows are
   * edited or deleted afterwards (BR-001).
   */
  async freezeTableData(
    rowSelections: Record<string, number[]>,
    loopTableNames: string[],
  ): Promise<Record<string, Array<Record<string, any>>>> {
    const ds = await getDataSource()
    const wantedIds = new Set<number>()
    for (const ids of Object.values(rowSelections ?? {})) {
      for (const id of ids ?? []) if (Number.isInteger(id)) wantedIds.add(id)
    }
    const tableData: Record<string, Array<Record<string, any>>> = {}
    if (wantedIds.size === 0 && loopTableNames.length === 0) return tableData

    const tables: any[] = await ds.getRepository(GlobalTableSchema).find()
    const tableById = new Map<number, any>(tables.map((t) => [t.id, t]))
    const tableByName = new Map<string, any>(tables.map((t) => [String(t.name).toLowerCase(), t]))

    if (wantedIds.size > 0) {
      const rows: any[] = await ds
        .getRepository(GlobalTableRowSchema)
        .createQueryBuilder('row')
        .where('row.id IN (:...ids)', { ids: [...wantedIds] })
        .getMany()
      for (const row of rows) {
        const table = tableById.get(row.globalTableId)
        if (!table) continue
        const key = String(table.name)
        tableData[key] = [...(tableData[key] ?? []), { id: row.id, ...parseValues(row.values) }]
      }
    }
    // Loop tables in `all`/`filtered` mode freeze the current full set.
    for (const name of loopTableNames) {
      const key = String(name)
      if (tableData[key] !== undefined) continue
      const table = tableByName.get(key.toLowerCase())
      if (!table) continue
      const rows: any[] = await ds.getRepository(GlobalTableRowSchema).find({ where: { globalTableId: table.id } })
      tableData[key] = rows.map((row) => ({ id: row.id, ...parseValues(row.values) }))
    }
    return tableData
  },

  /** Loop-source table names referenced by a template tree (freeze scope). */
  loopTableNamesOf(templateContent: unknown): string[] {
    const { nodes } = parseTreeInput(templateContent)
    if (!Array.isArray(nodes)) return []
    const names = new Set<string>()
    const walk = (list: any[]): void => {
      for (const node of list ?? []) {
        if (!node || typeof node !== 'object') continue
        const kind = (node as Record<string, any>).kind
        const attrs = ((node as Record<string, any>).attrs ?? {}) as Record<string, any>
        if (kind === 'loop' && attrs.source && typeof attrs.source === 'object' && typeof attrs.source.tableName === 'string') {
          names.add(attrs.source.tableName.trim())
        }
        if (Array.isArray((node as Record<string, any>).children)) walk((node as Record<string, any>).children)
      }
    }
    walk(nodes as any[])
    return [...names].filter(Boolean)
  },
}
