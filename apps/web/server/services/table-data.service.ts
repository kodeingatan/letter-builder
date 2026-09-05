import { getDataSource } from '~~/server/utils/db'
import { GlobalTableSchema } from '~~/server/entities/global-table.entity'
import { GlobalTableColumnSchema, type GlobalTableColumn } from '~~/server/entities/global-table-column.entity'
import { GlobalTableRowSchema } from '~~/server/entities/global-table-row.entity'
import { PermissionSchema } from '~~/server/entities/permission.entity'
import { PermissionMethodSchema } from '~~/server/entities/permission-method.entity'
import { PermissionUrlSchema } from '~~/server/entities/permission-url.entity'
import { RoleSchema } from '~~/server/entities/role.entity'
import { ActivityLogsService } from '~~/server/services/activity-logs.service'
import { getComputedColumnsForTable, recomputeRow } from '~~/server/services/computed-field.service'
import { parseRelationConfig } from '~~/server/services/relation.service'
import { validateRowValues, coerceCsvCell } from '~~/server/utils/dynamic-schema'
import type { TableDataQueryInput } from '~~/server/dto/table-data.dto'

function httpError(statusCode: number, message: string, data?: unknown): Error {
  return Object.assign(new Error(message), { statusCode, data })
}

export interface TableRowObject {
  id: number
  createdAt: Date
  updatedAt: Date
  [columnName: string]: unknown
  _display?: Record<string, string>
}

function parseValues(raw: string): Record<string, any> {
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function toRowObject(entity: any): TableRowObject {
  const values = parseValues(entity.values)
  return { id: entity.id, createdAt: entity.createdAt, updatedAt: entity.updatedAt, ...values }
}

export const TableDataService = {
  async resolveTable(tableName: string) {
    const ds = await getDataSource()
    const table = await ds.getRepository(GlobalTableSchema).findOne({ where: { name: tableName } })
    if (!table) throw httpError(404, `Unknown table "${tableName}"`)
    return table as { id: number; name: string; displayName: string }
  },

  async getColumns(tableId: number): Promise<GlobalTableColumn[]> {
    const ds = await getDataSource()
    return ds.getRepository(GlobalTableColumnSchema).find({
      where: { globalTableId: tableId },
      order: { position: 'ASC' },
    })
  },

  async resolveDisplayLabels(
    columns: GlobalTableColumn[],
    rows: TableRowObject[],
  ): Promise<TableRowObject[]> {
    const relationCols = columns.filter(
      (c) => c.type === 'select-table-relation' || c.type === 'select-table-relation-multiple',
    )
    if (!relationCols.length || !rows.length) return rows

    const ds = await getDataSource()
    const rowRepo = ds.getRepository(GlobalTableRowSchema)

    for (const col of relationCols) {
      const config = await parseRelationConfig(col.relationConfig)
      const displayCols = config?.displayColumns ?? []
      const separator = config?.separator ?? ' - '
      if (!col.relationTableId || !displayCols.length) continue

      const ids = new Set<number>()
      for (const row of rows) {
        const v = (row as Record<string, any>)[col.name]
        if (Array.isArray(v)) v.forEach((x) => Number.isInteger(Number(x)) && ids.add(Number(x)))
        else if (v !== null && v !== undefined && Number.isInteger(Number(v))) ids.add(Number(v))
      }
      const labelById = new Map<number, string>()
      if (ids.size) {
        const targets = await rowRepo
          .createQueryBuilder('r')
          .where('r.globalTableId = :tid', { tid: col.relationTableId })
          .getMany()
        for (const t of targets as any[]) {
          if (!ids.has(t.id)) continue
          const vals = parseValues(t.values)
          labelById.set(
            t.id,
            displayCols.map((dc) => String(vals[dc] ?? '')).join(separator),
          )
        }
      }
      for (const row of rows) {
        const v = (row as Record<string, any>)[col.name]
        const label = Array.isArray(v)
          ? v.map((x) => labelById.get(Number(x)) ?? `#${x}`).join(separator)
          : v === null || v === undefined
            ? ''
            : (labelById.get(Number(v)) ?? `#${v}`)
        row._display = { ...(row._display ?? {}), [col.name]: label }
      }
    }
    return rows
  },

  async assertRelationTargets(columns: GlobalTableColumn[], values: Record<string, any>) {
    const ds = await getDataSource()
    const rowRepo = ds.getRepository(GlobalTableRowSchema)
    const errors: Record<string, string> = {}
    for (const col of columns) {
      if (col.type !== 'select-table-relation' && col.type !== 'select-table-relation-multiple') continue
      const v = values[col.name]
      if (v === null || v === undefined) continue
      const ids = Array.isArray(v) ? v.map(Number) : [Number(v)]
      for (const id of ids) {
        const count = await rowRepo.count({ where: { id, globalTableId: col.relationTableId! } })
        if (!count) {
          errors[col.name] = `Referenced row #${id} does not exist in target table`
          break
        }
      }
    }
    return errors
  },

  async findAll(tableName: string, query: TableDataQueryInput) {
    const table = await this.resolveTable(tableName)
    const columns = await this.getColumns(table.id)
    const ds = await getDataSource()
    const entities = await ds.getRepository(GlobalTableRowSchema).find({
      where: { globalTableId: table.id },
      order: { id: 'DESC' },
    })
    let rows = entities.map(toRowObject)

    const searchable = columns.filter((c) => c.searchable)
    if (query.search) {
      const needle = query.search.toLowerCase()
      const fieldCol = query.searchField ? columns.find((c) => c.name === query.searchField) : undefined
      if (fieldCol && fieldCol.searchable) {
        rows = rows.filter((r) => String((r as Record<string, any>)[fieldCol.name] ?? '').toLowerCase().includes(needle))
      } else {
        rows = rows.filter((r) =>
          searchable.some((c) => String((r as Record<string, any>)[c.name] ?? '').toLowerCase().includes(needle)),
        )
      }
    }
    if (query.searchField && !query.search) {
      // field-specific empty search = no-op
    }

    const sortBy = query.sortBy || 'id'
    if (sortBy !== 'id' && sortBy !== 'createdAt' && sortBy !== 'updatedAt') {
      const col = columns.find((c) => c.name === sortBy)
      if (!col || !col.orderable) {
        throw httpError(422, `Column "${sortBy}" is not orderable`, { code: 'NOT_ORDERABLE' })
      }
      rows = [...rows].sort((a, b) => {
        const av = (a as Record<string, any>)[sortBy]
        const bv = (b as Record<string, any>)[sortBy]
        if (av === bv) return 0
        if (av === null || av === undefined) return query.sortOrder === 'ASC' ? -1 : 1
        if (bv === null || bv === undefined) return query.sortOrder === 'ASC' ? 1 : -1
        if (typeof av === 'number' && typeof bv === 'number') {
          return query.sortOrder === 'ASC' ? av - bv : bv - av
        }
        const cmp = String(av).localeCompare(String(bv))
        return query.sortOrder === 'ASC' ? cmp : -cmp
      })
    } else {
      rows = [...rows].sort((a, b) =>
        query.sortOrder === 'ASC' ? a.id - b.id : b.id - a.id,
      )
    }

    const total = rows.length
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const paged = rows.slice((page - 1) * limit, page * limit)
    await this.resolveDisplayLabels(columns, paged)

    return {
      data: paged,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      table: { id: table.id, name: table.name, displayName: (table as any).displayName },
      columns: columns.map((c: any) => ({
        id: c.id, name: c.name, displayName: c.displayName, type: c.type,
        required: c.required, searchable: c.searchable, orderable: c.orderable,
        position: c.position, options: c.options, format: c.format,
        expression: c.expression, relationTableId: c.relationTableId,
        relationConfig: c.relationConfig,
      })),
    }
  },

  async findOne(tableName: string, rowId: number) {
    const table = await this.resolveTable(tableName)
    const columns = await this.getColumns(table.id)
    const ds = await getDataSource()
    const entity = await ds.getRepository(GlobalTableRowSchema).findOne({
      where: { id: rowId, globalTableId: table.id },
    })
    if (!entity) throw httpError(404, `Row #${rowId} not found in table "${tableName}"`)
    const [row] = await this.resolveDisplayLabels(columns, [toRowObject(entity)])
    return row
  },

  async create(tableName: string, payload: Record<string, any>, userId?: number) {
    const table = await this.resolveTable(tableName)
    const columns = await this.getColumns(table.id)
    if (!columns.length) throw httpError(422, 'Define columns first', { code: 'EMPTY_SCHEMA' })

    const validation = validateRowValues(columns, payload ?? {})
    if (!validation.valid) throw httpError(422, 'Validation failed', { errors: validation.errors })

    const relErrors = await this.assertRelationTargets(columns, validation.values)
    if (Object.keys(relErrors).length) throw httpError(422, 'Validation failed', { errors: relErrors })

    const computed = await getComputedColumnsForTable(table.id)
    const { values } = recomputeRow(computed, validation.values)

    const ds = await getDataSource()
    const repo = ds.getRepository(GlobalTableRowSchema)
    const saved = await repo.save(repo.create({ globalTableId: table.id, values: JSON.stringify(values) }))

    try {
      await ActivityLogsService.log({
        userId, action: 'create', entity: (table as any).displayName ?? table.name,
        entityId: saved.id, description: `POST /api/data/${tableName}`,
      })
    } catch {}

    const [row] = await this.resolveDisplayLabels(columns, [toRowObject(saved)])
    return { ...row, ...valuesToTopLevel(row, values) }
  },

  async update(tableName: string, rowId: number, payload: Record<string, any>, userId?: number) {
    const table = await this.resolveTable(tableName)
    const columns = await this.getColumns(table.id)
    const ds = await getDataSource()
    const repo = ds.getRepository(GlobalTableRowSchema)
    const entity = await repo.findOne({ where: { id: rowId, globalTableId: table.id } })
    if (!entity) throw httpError(404, `Row #${rowId} not found in table "${tableName}"`)

    const current = parseValues((entity as any).values)
    const validation = validateRowValues(columns, { ...current, ...(payload ?? {}) })
    if (!validation.valid) throw httpError(422, 'Validation failed', { errors: validation.errors })

    const relErrors = await this.assertRelationTargets(columns, validation.values)
    if (Object.keys(relErrors).length) throw httpError(422, 'Validation failed', { errors: relErrors })

    const computed = await getComputedColumnsForTable(table.id)
    const { values } = recomputeRow(computed, validation.values)

    ;(entity as any).values = JSON.stringify(values)
    const saved = await repo.save(entity)

    try {
      await ActivityLogsService.log({
        userId, action: 'update', entity: (table as any).displayName ?? table.name,
        entityId: saved.id, description: `PUT /api/data/${tableName}/${rowId}`,
      })
    } catch {}

    const [row] = await this.resolveDisplayLabels(columns, [toRowObject(saved)])
    return { ...row, ...valuesToTopLevel(row, values) }
  },

  async remove(tableName: string, rowId: number, userId?: number) {
    const table = await this.resolveTable(tableName)
    const ds = await getDataSource()
    const repo = ds.getRepository(GlobalTableRowSchema)
    const entity = await repo.findOne({ where: { id: rowId, globalTableId: table.id } })
    if (!entity) throw httpError(404, `Row #${rowId} not found in table "${tableName}"`)

    // Task 11 rules: restrict blocks with 409; detach cascades silently
    const colRepo = ds.getRepository(GlobalTableColumnSchema)
    const referencing = await colRepo.find({ where: { relationTableId: table.id } })
    const blocking: string[] = []
    for (const col of referencing as any[]) {
      const config = await parseRelationConfig(col.relationConfig)
      const policy = config?.onTargetDelete ?? 'restrict'
      const owners = await repo.find({ where: { globalTableId: col.globalTableId } })
      const hits: any[] = []
      for (const owner of owners as any[]) {
        const vals = parseValues(owner.values)
        const v = vals[col.name]
        const refs = Array.isArray(v) ? v.map(Number) : v === null || v === undefined ? [] : [Number(v)]
        if (refs.includes(rowId)) hits.push({ owner, vals })
      }
      if (!hits.length) continue
      if (policy === 'restrict') {
        blocking.push(col.name)
      } else {
        for (const { owner, vals } of hits) {
          const v = vals[col.name]
          vals[col.name] = Array.isArray(v) ? v.filter((x: unknown) => Number(x) !== rowId) : null
          owner.values = JSON.stringify(vals)
          await repo.save(owner)
        }
      }
    }
    if (blocking.length) {
      throw httpError(409, `Row is referenced and cannot be deleted (restrict: ${blocking.join(', ')})`, {
        code: 'RESTRICT',
        columns: blocking,
      })
    }

    await repo.remove(entity)
    try {
      await ActivityLogsService.log({
        userId, action: 'delete', entity: (table as any).displayName ?? table.name,
        entityId: rowId, description: `DELETE /api/data/${tableName}/${rowId}`,
      })
    } catch {}
    return { message: 'Row deleted' }
  },

  escapeCsvCell(value: unknown): string {
    if (value === null || value === undefined) return ''
    const s = Array.isArray(value) ? value.join(';') : String(value)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  },

  parseCsv(text: string): string[][] {
    const rows: string[][] = []
    let row: string[] = []
    let cell = ''
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++ } else inQuotes = false
        } else cell += ch
      } else if (ch === '"') inQuotes = true
      else if (ch === ',') { row.push(cell); cell = '' }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
      else if (ch === '\r') { /* skip, handled by \n */ }
      else cell += ch
    }
    row.push(cell)
    rows.push(row)
    return rows.filter((r) => r.some((c) => c !== ''))
  },

  async exportCsv(tableName: string, query: TableDataQueryInput) {
    const full = await this.findAll(tableName, { ...query, page: 1, limit: 1000000 })
    const dataCols = (full.columns as any[]).filter(
      (c) => c.type !== 'hidden-computed',
    )
    const header = dataCols.map((c) => c.name)
    const lines = [header.map((h) => this.escapeCsvCell(h)).join(',')]
    for (const row of full.data) {
      lines.push(
        dataCols.map((c) => this.escapeCsvCell((row as Record<string, any>)[c.name])).join(','),
      )
    }
    return { filename: `${tableName}-export.csv`, content: lines.join('\n') }
  },

  async importCsv(tableName: string, csvText: string, userId?: number) {
    const table = await this.resolveTable(tableName)
    const columns = await this.getColumns(table.id)
    if (!columns.length) throw httpError(422, 'Define columns first', { code: 'EMPTY_SCHEMA' })
    const byName = new Map(columns.map((c) => [c.name, c]))

    const raw = this.parseCsv(csvText)
    if (!raw.length) throw httpError(422, 'CSV is empty')
    const header = raw[0].map((h) => h.trim())
    const unknown = header.filter((h) => !byName.has(h))
    if (unknown.length) throw httpError(422, `Unknown columns: ${unknown.join(', ')}`, { unknown })
    if (raw.length - 1 > 5000) throw httpError(422, 'CSV exceeds 5000 rows')

    let imported = 0
    let failed = 0
    const errors: Array<{ row: number; reason: string }> = []

    for (let i = 1; i < raw.length; i++) {
      const cells = raw[i]
      const payload: Record<string, any> = {}
      header.forEach((h, idx) => {
        const col = byName.get(h)!
        payload[h] = coerceCsvCell(col.type, cells[idx])
      })
      try {
        await this.create(tableName, payload, userId)
        imported++
      } catch (e: any) {
        failed++
        const detail = e.data?.errors ? JSON.stringify(e.data.errors) : e.message
        errors.push({ row: i + 1, reason: detail })
      }
    }

    try {
      await ActivityLogsService.log({
        userId, action: 'import', entity: (table as any).displayName ?? table.name,
        description: `POST /api/data/${tableName}/import (${imported} ok, ${failed} failed)`,
      })
    } catch {}
    return { imported, failed, errors }
  },

  async ensureTableDataPermissions(table: { id: number; name: string; displayName?: string }) {
    const ds = await getDataSource()
    const permRepo = ds.getRepository(PermissionSchema)
    const methodRepo = ds.getRepository(PermissionMethodSchema)
    const urlRepo = ds.getRepository(PermissionUrlSchema)
    const roleRepo = ds.getRepository(RoleSchema)

    const defs = [
      { suffix: 'Read', methods: ['GET'], desc: `Read rows of table "${table.name}"` },
      { suffix: 'Write', methods: ['POST', 'PUT', 'DELETE'], desc: `Write rows of table "${table.name}"` },
    ]
    for (const def of defs) {
      const permissionName = `Data:${table.name}:${def.suffix}`
      let permission = await permRepo.findOne({ where: { permissionName } })
      if (!permission) {
        permission = permRepo.create({ permissionName, description: def.desc })
        await permRepo.save(permission)
        await methodRepo.save(def.methods.map((m) => methodRepo.create({ method: m, permission })))
        await urlRepo.save(urlRepo.create({ url: `/api/data/${table.name}*`, permission }))
      }
      for (const roleName of ['Admin', 'Super Admin']) {
        const role = await roleRepo.findOne({ where: { roleName } })
        if (role && !(role as any).permissions?.some((p: any) => p.permissionName === permissionName)) {
          ;(role as any).permissions = [...((role as any).permissions ?? []), permission]
          await roleRepo.save(role)
        }
      }
    }
  },
}

function valuesToTopLevel(row: TableRowObject, values: Record<string, any>): Record<string, any> {
  // Ensure computed values are present even if toRowObject already spread them
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(values)) {
    if ((row as Record<string, any>)[k] === undefined) out[k] = v
  }
  return out
}
