import { getDataSource } from '~~/server/utils/db'
import {
  AdministrationRunSchema,
  type RunStepDataMap,
} from '~~/server/entities/administration-run.entity'
import {
  AdministrationSchema,
  AdministrationStepSchema,
} from '~~/server/entities/administration.entity'
import { TemplateSchema } from '~~/server/entities/template.entity'
import { TemplateBindingSchema } from '~~/server/entities/template-binding.entity'
import { GlobalTableRowSchema } from '~~/server/entities/global-table-row.entity'
import { GlobalTableSchema } from '~~/server/entities/global-table.entity'
import { UserSchema } from '~~/server/entities/user.entity'
import {
  buildStepSkeletons,
  parseResolvedPins,
  parseStepDataMap,
  resolvePins,
  validateAllSteps,
  validateStepFieldValues,
  type RunnerStep,
} from '~~/server/utils/run-helpers'
import { parseStepFields } from '~~/server/utils/administration-helpers'
import { matchUrlPattern } from '~~/server/utils/url-matcher'
import type { RunsQueryInput, StepSaveInput } from '~~/server/dto/runs.dto'

function httpError(statusCode: number, message: string, data?: unknown): Error {
  return Object.assign(new Error(message), { statusCode, data })
}

const sortableFields = ['id', 'administrationId', 'status', 'startedAt', 'completedAt', 'createdAt', 'updatedAt']

function toRunnerSteps(rows: any[]): RunnerStep[] {
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    order: s.order,
    templateId: s.templateId,
    templateVersion: s.templateVersion,
    fields: parseStepFields(s.fields),
  }))
}

function serializeRun(run: any, steps: any[], pins: any[], dataMap: RunStepDataMap) {
  return {
    ...run,
    resolvedPins: pins,
    stepData: dataMap,
    steps,
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

async function isAdminUser(userId: number): Promise<boolean> {
  const ds = await getDataSource()
  const user: any = await ds.getRepository(UserSchema).findOne({ where: { id: userId } })
  const roles: any[] = user?.roles ?? []
  return roles.some((r) => r.roleName === 'Admin' || r.roleName === 'Super Admin')
}

async function assertRunAccess(run: any, userId: number) {
  if (run.startedBy === userId) return
  if (await isAdminUser(userId)) return
  throw httpError(403, 'You can only access your own runs')
}

/** Collect `manual`-sourced binding slots per step (Task 16 slots surface here as inputs). */
async function manualSlotsByStep(steps: any[]): Promise<Record<number, string[]>> {
  const ds = await getDataSource()
  const byStep: Record<number, string[]> = {}
  const templateToStep = new Map<number, number>()
  for (const s of steps) {
    if (s.templateId != null) templateToStep.set(s.templateId, s.id)
  }
  if (templateToStep.size === 0) return byStep
  const bindings: any[] = await ds
    .getRepository(TemplateBindingSchema)
    .createQueryBuilder('b')
    .where('b."templateId" IN (:...ids)', { ids: [...templateToStep.keys()] })
    .andWhere("b.source = 'manual'")
    .getMany()
  for (const b of bindings) {
    const stepId = templateToStep.get(b.templateId)
    if (stepId === undefined) continue
    const key = `${b.placementId}.${b.requirementName}`
    byStep[stepId] = [...(byStep[stepId] ?? []), key]
  }
  return byStep
}

/**
 * BR-003: row selections limited to rows the operator may Read.
 * A row is readable when it exists AND the operator holds a GET permission
 * covering its table (`Data:<table>:Read` auto-provisioned by Task 12, or
 * any broader GET rule such as Full Access). Returns the kept ids plus the
 * dropped (missing or unreadable) ids for the AC-005 warning.
 */
async function filterReadableRows(
  userId: number,
  rowIds: number[],
): Promise<{ kept: number[]; dropped: number[] }> {
  if (rowIds.length === 0) return { kept: [], dropped: [] }
  const ds = await getDataSource()
  const unique = [...new Set(rowIds)]
  const rows: any[] = await ds
    .getRepository(GlobalTableRowSchema)
    .createQueryBuilder('row')
    .where('row.id IN (:...ids)', { ids: unique })
    .getMany()
  const found = new Map<number, any>(rows.map((r) => [r.id, r]))
  const missing = unique.filter((id) => !found.has(id))

  const user: any = await ds.getRepository(UserSchema).findOne({ where: { id: userId } })
  const roles: any[] = user?.roles ?? []
  const tables = new Map<number, string>()
  for (const row of rows) {
    if (!tables.has(row.globalTableId)) {
      const table: any = await ds.getRepository(GlobalTableSchema).findOne({ where: { id: row.globalTableId } })
      if (table) tables.set(row.globalTableId, table.name)
    }
  }
  const readableCache = new Map<string, boolean>()
  const canReadTable = (tableName: string): boolean => {
    const cached = readableCache.get(tableName)
    if (cached !== undefined) return cached
    const ok = roles.some((role) =>
      (role.permissions ?? []).some((permission: any) => {
        const methods: string[] = (permission.methods ?? []).map((m: any) => m.method)
        const urls: string[] = (permission.urls ?? []).map((u: any) => u.url)
        const methodOk = methods.includes('*') || methods.includes('GET')
        if (!methodOk) return false
        return (
          urls.some((pattern: string) => matchUrlPattern(pattern, `/api/data/${tableName}`)) ||
          urls.some((pattern: string) => matchUrlPattern(pattern, `/api/data/${tableName}/1`))
        )
      }),
    )
    readableCache.set(tableName, ok)
    return ok
  }

  const kept: number[] = []
  const dropped: number[] = [...missing]
  for (const row of rows) {
    const tableName = tables.get(row.globalTableId)
    if (tableName && canReadTable(tableName)) kept.push(row.id)
    else dropped.push(row.id)
  }
  return { kept, dropped }
}

export const RunsService = {
  /**
   * REQ-001/BR-001/BR-005: start a run on a published administration.
   * `latest` template pins resolve + freeze now; later definition edits
   * never alter this run (BR-002 — completion derives from frozen input).
   */
  async start(administrationId: number, startedBy: number) {
    const ds = await getDataSource()
    const administration: any = await ds.getRepository(AdministrationSchema).findOne({
      where: { id: administrationId },
    })
    if (!administration) throw httpError(404, 'Administration not found')
    if (administration.status !== 'published') {
      const reason =
        administration.status === 'archived'
          ? 'This administration is archived and can no longer be run'
          : 'This administration is still a draft: publish it before running'
      throw httpError(422, reason, { code: 'NOT_RUNNABLE', status: administration.status })
    }

    const steps = await loadSteps(administrationId)
    const runnerSteps = toRunnerSteps(steps)

    const liveVersions: Record<number, number> = {}
    for (const s of steps) {
      if (s.templateId == null || liveVersions[s.templateId] !== undefined) continue
      const template: any = await ds.getRepository(TemplateSchema).findOne({ where: { id: s.templateId } })
      if (template) liveVersions[s.templateId] = template.version
    }
    const pins = resolvePins(runnerSteps, liveVersions)
    const manualSlots = await manualSlotsByStep(steps)
    const skeletons = buildStepSkeletons(runnerSteps, manualSlots)

    const repo = ds.getRepository(AdministrationRunSchema)
    const now = new Date()
    const saved: any = await repo.save(
      repo.create({
        administrationId,
        administrationVersion: administration.version,
        resolvedPins: JSON.stringify(pins),
        stepData: JSON.stringify(skeletons),
        status: 'in_progress',
        startedBy,
        startedAt: now,
      }),
    )
    return serializeRun(saved, steps.map((s) => ({ ...s, fields: parseStepFields(s.fields) })), pins, skeletons)
  },

  /** REQ-006: operator's runs (own only); admins may pass `scope=all`. */
  async findMine(query: RunsQueryInput, userId: number) {
    const ds = await getDataSource()
    if (query.scope === 'all' && !(await isAdminUser(userId))) {
      throw httpError(403, 'Only admins can list all runs')
    }
    const qb = ds.getRepository(AdministrationRunSchema).createQueryBuilder('run')
    if (query.scope !== 'all') qb.where('run.startedBy = :userId', { userId })
    else qb.where('1 = 1')
    if (query.status) qb.andWhere('run.status = :status', { status: query.status })
    if (query.search) {
      const like = `%${query.search}%`
      if (query.searchField === 'status') {
        qb.andWhere('run.status LIKE :search', { search: like })
      } else {
        // Match administration names, then include their runs alongside status hits.
        const matched: any[] = await ds
          .getRepository(AdministrationSchema)
          .createQueryBuilder('administration')
          .where('administration.name LIKE :search', { search: like })
          .getMany()
        const ids = matched.map((a) => a.id)
        if (ids.length > 0) {
          qb.andWhere('(run.status LIKE :search OR run.administrationId IN (:...ids))', {
            search: like,
            ids,
          })
        } else {
          qb.andWhere('run.status LIKE :search', { search: like })
        }
      }
    }
    if (sortableFields.includes(query.sortBy)) qb.orderBy(`run.${query.sortBy}`, query.sortOrder)

    const total = await qb.getCount()
    const rows = await qb.skip((query.page - 1) * query.limit).take(query.limit).getMany()

    const data = await Promise.all(
      rows.map(async (row: any) => {
        const administration: any = await ds.getRepository(AdministrationSchema).findOne({
          where: { id: row.administrationId },
        })
        return {
          ...row,
          resolvedPins: parseResolvedPins(row.resolvedPins),
          stepData: parseStepDataMap(row.stepData),
          administrationName: administration?.name ?? null,
        }
      }),
    )
    return { data, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) }
  },

  /** Run + workflow + per-step schemas + current data (resume support, AC-006). */
  async findOne(runId: number, userId: number) {
    const ds = await getDataSource()
    const run: any = await ds.getRepository(AdministrationRunSchema).findOne({ where: { id: runId } })
    if (!run) throw httpError(404, 'Run not found')
    await assertRunAccess(run, userId)
    const steps = await loadSteps(run.administrationId)
    const administration: any = await ds.getRepository(AdministrationSchema).findOne({
      where: { id: run.administrationId },
    })
    return {
      ...serializeRun(
        run,
        steps.map((s) => ({ ...s, fields: parseStepFields(s.fields) })),
        parseResolvedPins(run.resolvedPins),
        parseStepDataMap(run.stepData),
      ),
      administrationName: administration?.name ?? null,
      administrationStatus: administration?.status ?? null,
    }
  },

  /**
   * BR-004: idempotent partial step save (PATCH). Validates fields + row
   * readability on every save; unreadable rows are dropped with a warning
   * (AC-005) and the surviving selection persists.
   */
  async saveStep(runId: number, stepId: number, input: StepSaveInput, userId: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(AdministrationRunSchema)
    const run: any = await repo.findOne({ where: { id: runId } })
    if (!run) throw httpError(404, 'Run not found')
    await assertRunAccess(run, userId)
    if (run.status !== 'in_progress') {
      throw httpError(422, `Run is ${run.status} and is read-only`, { code: 'RUN_READ_ONLY' })
    }

    const steps = await loadSteps(run.administrationId)
    const step = steps.find((s) => s.id === stepId)
    if (!step) throw httpError(404, `Step #${stepId} does not belong to this run's administration`)
    const runnerStep = toRunnerSteps([step])[0]

    const fieldIssues = validateStepFieldValues(runnerStep, input.fields ?? {})
    if (fieldIssues.length > 0) {
      throw httpError(422, fieldIssues[0], { code: 'STEP_VALIDATION', issues: fieldIssues })
    }

    // BR-003: readability filter per row-selection key.
    const filteredSelections: Record<string, number[]> = {}
    const droppedByKey: Record<string, number[]> = {}
    for (const [key, ids] of Object.entries(input.rowSelections ?? {})) {
      const { kept, dropped } = await filterReadableRows(userId, ids)
      filteredSelections[key] = kept
      if (dropped.length > 0) droppedByKey[key] = dropped
    }

    const dataMap = parseStepDataMap(run.stepData)
    const previous = dataMap[String(stepId)] ?? { fields: {}, rowSelections: {}, manualInputs: {} }
    dataMap[String(stepId)] = {
      fields: { ...(previous.fields ?? {}), ...(input.fields ?? {}) },
      rowSelections: { ...(previous.rowSelections ?? {}), ...filteredSelections },
      manualInputs: { ...(previous.manualInputs ?? {}), ...(input.manualInputs ?? {}) },
    }

    run.stepData = JSON.stringify(dataMap)
    await repo.save(run)
    const warning =
      Object.keys(droppedByKey).length > 0
        ? `Some rows are no longer readable and were dropped: ${Object.entries(droppedByKey)
            .map(([k, ids]) => `${k} (${ids.join(', ')})`)
            .join('; ')}`
        : undefined
    return {
      ...serializeRun(
        run,
        steps.map((s) => ({ ...s, fields: parseStepFields(s.fields) })),
        parseResolvedPins(run.resolvedPins),
        dataMap,
      ),
      droppedRows: droppedByKey,
      warning,
    }
  },

  /**
   * REQ-005/BR-004: atomic validate-all → complete. A single transaction
   * flips the run to completed; no half-completed run ever produces
   * documents. Document creation itself is owned by Tasks 19/20 via
   * `createDocumentsForRun` (hook interface below) — v1 returns the frozen
   * run with an empty document list.
   */
  async complete(runId: number, userId: number) {
    const ds = await getDataSource()
    const run: any = await ds.getRepository(AdministrationRunSchema).findOne({ where: { id: runId } })
    if (!run) throw httpError(404, 'Run not found')
    await assertRunAccess(run, userId)
    if (run.status !== 'in_progress') {
      throw httpError(422, `Run is ${run.status} and cannot be completed`, { code: 'RUN_READ_ONLY' })
    }

    const steps = await loadSteps(run.administrationId)
    const dataMap = parseStepDataMap(run.stepData)
    const problems = validateAllSteps(toRunnerSteps(steps), dataMap)
    if (problems.length > 0) {
      throw httpError(422, `Step "${problems[0].stepName}": ${problems[0].issues[0]}`, {
        code: 'COMPLETE_VALIDATION',
        problems,
      })
    }

    // Re-check row readability at completion time (rows may be revoked mid-run).
    for (const [stepKey, data] of Object.entries(dataMap)) {
      for (const [selKey, ids] of Object.entries(data.rowSelections ?? {})) {
        const { kept } = await filterReadableRows(userId, ids)
        if (kept.length !== ids.length) {
          throw httpError(
            422,
            `Step #${stepKey}: some selected rows are no longer readable — re-save the step first`,
            { code: 'ROWS_REVOKED', stepId: Number(stepKey), selectionKey: selKey },
          )
        }
      }
    }

    const queryRunner = ds.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    try {
      const fresh: any = await queryRunner.manager
        .getRepository(AdministrationRunSchema)
        .findOne({ where: { id: runId } })
      if (!fresh || fresh.status !== 'in_progress') {
        throw httpError(422, 'Run is no longer completable (concurrent transition)', {
          code: 'RUN_TRANSITION_CONFLICT',
        })
      }
      fresh.status = 'completed'
      fresh.completedAt = new Date()
      await queryRunner.manager.getRepository(AdministrationRunSchema).save(fresh)
      await queryRunner.commitTransaction()

      const documentIds = await createDocumentsForRun(fresh.id)
      return { runId: fresh.id, documentIds }
    } catch (err) {
      try {
        await queryRunner.rollbackTransaction()
      } catch {}
      throw err
    } finally {
      await queryRunner.release()
    }
  },

  async cancel(runId: number, userId: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(AdministrationRunSchema)
    const run: any = await repo.findOne({ where: { id: runId } })
    if (!run) throw httpError(404, 'Run not found')
    await assertRunAccess(run, userId)
    if (run.status !== 'in_progress') {
      throw httpError(422, `Run is ${run.status} and cannot be cancelled`, { code: 'RUN_READ_ONLY' })
    }
    run.status = 'cancelled'
    await repo.save(run)
    return { runId: run.id, status: run.status }
  },
}

/**
 * Document-generation hook (Tasks 19/20): derives immutable snapshots from
 * the frozen run input (`resolvedPins` + `stepData`). Delegates to
 * DocumentsService via dynamic import (avoids a static service cycle);
 * Task 20 extends the stored bytes with real PDF output.
 */
export async function createDocumentsForRun(runId: number): Promise<number[]> {
  const ds = await getDataSource()
  if (!ds.hasMetadata('documents')) return []
  const { DocumentsService } = await import('~~/server/services/documents.service')
  return DocumentsService.issueDocumentsForRun(runId)
}
