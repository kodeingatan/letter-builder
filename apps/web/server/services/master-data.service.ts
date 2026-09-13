import { getDataSource } from '../utils/db'
import type { DataSource } from 'typeorm'
import { MasterTableSchema } from '../entities/master-table.entity'
import { MasterTableColumnSchema } from '../entities/master-table-column.entity'
import { MasterDdlService } from './master-ddl.service'
import { ExpressionService } from './expression.service'
import { OPERATION_COLUMN_TYPES } from '../dto/master-data.dto'
import type {
  CreateMasterTableInput,
  UpdateMasterTableInput,
  QueryMasterTableInput,
  QueryMasterRowInput,
} from '../dto/master-data.dto'

/**
 * Master Data service (Task 06): meta CRUD + physical `mst_*` rows.
 *
 * Plain object, same pattern as UsersService. Definitions live in
 * `master_tables`/`master_table_columns`; rows are dynamic `mst_*`
 * tables accessed via parameterized raw SQL (identifiers pre-sanitized).
 */

interface ColumnDef {
  id: number
  table_id: number
  name: string
  display_name: string
  type: string
  config_json: string | null
  default_value: string | null
  is_required: boolean
  is_orderable: boolean
  is_searchable: boolean
  sort_order: number
}

interface TableDef {
  id: number
  name: string
  display_name: string
  slug: string
  description: string | null
  status: string
  columns: ColumnDef[]
}

function toColumnDef(row: Record<string, unknown>): ColumnDef {
  return {
    id: row.id as number,
    table_id: row.tableId as number,
    name: row.name as string,
    display_name: row.displayName as string,
    type: row.type as string,
    config_json: (row.configJson ?? null) as string | null,
    default_value: (row.defaultValue ?? null) as string | null,
    is_required: Boolean(row.isRequired),
    is_orderable: Boolean(row.isOrderable),
    is_searchable: Boolean(row.isSearchable),
    sort_order: row.sortOrder as number,
  }
}

function parseConfig(column: ColumnDef): Record<string, unknown> {
  if (!column.config_json) return {}
  try {
    return JSON.parse(column.config_json) as Record<string, unknown>
  } catch {
    return {}
  }
}

function isOperationType(type: string): boolean {
  return (OPERATION_COLUMN_TYPES as string[]).includes(type)
}

export const MasterDataService = {
  async getDefinition(slug: string): Promise<TableDef> {
    const ds = await getDataSource()
    const table = await ds.getRepository(MasterTableSchema).findOne({ where: { slug } })
    if (!table) {
      const error = new Error(`Master table "${slug}" not found`) as Error & { statusCode?: number }
      error.statusCode = 404
      throw error
    }
    const columns = await ds.getRepository(MasterTableColumnSchema).find({
      where: { tableId: (table as unknown as { id: number }).id },
      order: { sortOrder: 'ASC' },
    })
    const row = table as unknown as Record<string, unknown>
    return {
      id: row.id as number,
      name: row.name as string,
      display_name: row.displayName as string,
      slug: row.slug as string,
      description: (row.description ?? null) as string | null,
      status: row.status as string,
      columns: (columns as unknown as Array<Record<string, unknown>>).map(toColumnDef),
    }
  },

  /** List definitions with standard pagination (Step 1). */
  async findAllTables(query: QueryMasterTableInput) {
    const ds = await getDataSource()
    const repo = ds.getRepository(MasterTableSchema)
    const where = query.search
      ? '(t.name LIKE :search OR t.displayName LIKE :search OR t.slug LIKE :search)'
      : undefined
    const params = query.search ? { search: `%${query.search}%` } : {}
    const sortable = new Set(['id', 'name', 'displayName', 'slug', 'status', 'createdAt', 'updatedAt'])
    const sortBy = sortable.has(query.sortBy) ? query.sortBy : 'id'
    // Count without the columns join (join would inflate the total).
    const countQb = repo.createQueryBuilder('t')
    if (where) countQb.where(where, params)
    const total = await countQb.getCount()
    const listQb = repo.createQueryBuilder('t').leftJoinAndSelect('t.columns', 'c')
    if (where) listQb.where(where, params)
    listQb.orderBy(`t.${sortBy}`, query.sortOrder)
    const data = await listQb.skip((query.page - 1) * query.limit).take(query.limit).getMany()
    return { data, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) }
  },

  /** Create definition + physical DDL (Step 2, AC-001). */
  async createTable(input: CreateMasterTableInput) {
    const ds = await getDataSource()
    const slug = MasterDdlService.sanitizeSlug(input.slug ?? input.name.replace(/[^a-z0-9_]/gi, '_'))
    const existing = await ds.getRepository(MasterTableSchema).findOne({ where: { slug } })
    if (existing) {
      const error = new Error(`Slug "${slug}" already exists`) as Error & { statusCode?: number }
      error.statusCode = 409
      throw error
    }
    const repo = ds.getRepository(MasterTableSchema)
    const saved = await repo.save(
      repo.create({
        name: input.name,
        displayName: input.display_name,
        slug,
        description: input.description ?? null,
        status: 'ACTIVE',
      }),
    )
    const tableId = (saved as unknown as { id: number }).id
    const colRepo = ds.getRepository(MasterTableColumnSchema)
    const columns = input.columns.map((col, index) =>
      colRepo.create({
        tableId,
        name: MasterDdlService.sanitizeColumnName(col.name),
        displayName: col.display_name,
        type: col.type,
        configJson: col.config !== undefined ? JSON.stringify(col.config) : null,
        defaultValue: col.default_value ?? null,
        isRequired: col.is_required ?? false,
        isOrderable: col.is_orderable ?? false,
        isSearchable: col.is_searchable ?? false,
        sortOrder: col.sort_order ?? index,
      }),
    )
    try {
      await colRepo.save(columns)
      await MasterDdlService.createTable(
        ds,
        slug,
        input.columns.map((col) => ({ name: col.name, type: col.type })),
      )
    } catch (error) {
      // Roll back meta rows when DDL fails — no half-created tables.
      await colRepo.createQueryBuilder().delete().where('tableId = :tableId', { tableId }).execute()
      await repo.createQueryBuilder().delete().where('id = :tableId', { tableId }).execute()
      throw error
    }
    return MasterDataService.getDefinition(slug)
  },

  /** Update definition; column diff applied via safe DDL (Step 2/6). */
  async updateTable(slug: string, input: UpdateMasterTableInput) {
    const ds = await getDataSource()
    const current = await MasterDataService.getDefinition(slug)
    const repo = ds.getRepository(MasterTableSchema)
    if (input.status) assertStatusTransition(current.status, input.status)
    await repo.createQueryBuilder()
      .update()
      .set({
        ...(input.display_name !== undefined ? { displayName: input.display_name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      })
      .where('id = :id', { id: current.id })
      .execute()
    if (input.columns !== undefined) {
      await MasterDataService.syncColumns(ds, current, input.columns)
    }
    return MasterDataService.getDefinition(slug)
  },

  /** Delete definition + DROP physical table after reference check (Step 6, AC-005). */
  async removeTable(slug: string) {
    const current = await MasterDataService.getDefinition(slug)
    const references = await MasterDataService.findReferences(slug)
    if (references.length > 0) {
      const error = new Error(
        `Table "${slug}" is still referenced: ${references.join(', ')}`,
      ) as Error & { statusCode?: number; data?: unknown }
      error.statusCode = 409
      error.data = { references }
      throw error
    }
    const ds = await getDataSource()
    const { backupPath } = await MasterDdlService.dropTable(ds, slug)
    await ds.getRepository(MasterTableSchema).createQueryBuilder().delete().where('id = :id', { id: current.id }).execute()
    return { slug, backupPath }
  },

  /** Reconcile definition columns with the physical table. */
  async syncColumns(ds: DataSource, current: TableDef, next: CreateMasterTableInput['columns']) {
    const database = ds
    const colRepo = database.getRepository(MasterTableColumnSchema)
    const currentByName = new Map(current.columns.map((c) => [c.name, c]))
    const nextNames = new Set(next.map((c) => MasterDdlService.sanitizeColumnName(c.name)))
    // Removed columns: reference check per column, then rebuild (backup inside).
    const removed = current.columns.filter((c) => !nextNames.has(c.name))
    for (const col of removed) {
      const refs = await MasterDataService.findColumnReferences(current.slug, col.name)
      if (refs.length > 0) {
        const error = new Error(`Column "${col.name}" is still referenced: ${refs.join(', ')}`) as Error & { statusCode?: number }
        error.statusCode = 409
        throw error
      }
    }
    const typeChanged = next.some((c) => {
      const name = MasterDdlService.sanitizeColumnName(c.name)
      const prev = currentByName.get(name)
      return prev !== undefined && prev.type !== c.type
    })
    if (removed.length === 0 && !typeChanged) {
      // Non-destructive path: ADD new physical columns, upsert meta in place
      // (config/display/flags changes need no DDL).
      for (const [index, col] of next.entries()) {
        const name = MasterDdlService.sanitizeColumnName(col.name)
        const meta = {
          displayName: col.display_name,
          type: col.type,
          configJson: col.config !== undefined ? JSON.stringify(col.config) : null,
          defaultValue: col.default_value ?? null,
          isRequired: col.is_required ?? false,
          isOrderable: col.is_orderable ?? false,
          isSearchable: col.is_searchable ?? false,
          sortOrder: col.sort_order ?? index,
        }
        const prev = currentByName.get(name)
        if (!prev) {
          await MasterDdlService.addColumn(database, current.slug, { name, type: col.type })
          await colRepo.save(colRepo.create({ tableId: current.id, name, ...meta }))
        } else {
          await colRepo.createQueryBuilder().update().set(meta).where('id = :id', { id: prev.id }).execute()
        }
      }
      return
    }
    // Structural change → full rebuild from the new definition (with backup).
    await MasterDdlService.rebuildTable(
      database,
      current.slug,
      next.map((c) => ({ name: c.name, type: c.type })),
    )
    await colRepo.createQueryBuilder().delete().where('tableId = :id', { id: current.id }).execute()
    await colRepo.save(next.map((col, index) => colRepo.create({
      tableId: current.id,
      name: MasterDdlService.sanitizeColumnName(col.name),
      displayName: col.display_name,
      type: col.type,
      configJson: col.config !== undefined ? JSON.stringify(col.config) : null,
      defaultValue: col.default_value ?? null,
      isRequired: col.is_required ?? false,
      isOrderable: col.is_orderable ?? false,
      isSearchable: col.is_searchable ?? false,
      sortOrder: col.sort_order ?? index,
    })))
  },

  /** Tables whose relation columns point at `slug` (BR-004). */
  async findReferences(slug: string): Promise<string[]> {
    const ds = await getDataSource()
    const rows = await ds.getRepository(MasterTableColumnSchema).find()
    const columns = (rows as unknown as Array<Record<string, unknown>>).map(toColumnDef)
    const refs: string[] = []
    for (const col of columns) {
      if (col.type !== 'relation_single' && col.type !== 'relation_multiple') continue
      const config = parseConfig(col)
      if (config.target_slug === slug) {
        const owner = await ds.getRepository(MasterTableSchema).findOne({ where: { id: col.table_id } })
        refs.push(`${(owner as unknown as { slug: string } | null)?.slug ?? '?'}:${col.name}`)
      }
    }
    return refs
  },

  async findColumnReferences(slug: string, columnName: string): Promise<string[]> {
    const refs = await MasterDataService.findReferences(slug)
    // Cross-table display_column references to this exact column.
    const ds = await getDataSource()
    const rows = await ds.getRepository(MasterTableColumnSchema).find()
    const columns = (rows as unknown as Array<Record<string, unknown>>).map(toColumnDef)
    for (const col of columns) {
      if (col.type !== 'relation_single' && col.type !== 'relation_multiple') continue
      const config = parseConfig(col)
      if (config.target_slug === slug && config.display_column === columnName) {
        const owner = await ds.getRepository(MasterTableSchema).findOne({ where: { id: col.table_id } })
        refs.push(`${(owner as unknown as { slug: string } | null)?.slug ?? '?'}:${col.name}→display`)
      }
    }
    return [...new Set(refs)]
  },

  /** Schema payload for the Task 07 builder (Step 5, AC-006). */
  async getSchema(slug: string) {
    const def = await MasterDataService.getDefinition(slug)
    return {
      slug: def.slug,
      display_name: def.display_name,
      columns: def.columns.map((col) => ({
        name: col.name,
        display_name: col.display_name,
        type: col.type,
        config: parseConfig(col),
        is_required: col.is_required,
        is_orderable: col.is_orderable,
        is_searchable: col.is_searchable,
      })),
    }
  },

  /** Browse rows: search only searchable, sort only orderable (FR-003, BR-003). */
  async findAllRows(slug: string, query: QueryMasterRowInput) {
    const def = await MasterDataService.getDefinition(slug)
    const table = MasterDdlService.physicalTableName(slug)
    const q = MasterDdlService.quote
    const searchable = def.columns.filter((c) => c.is_searchable)
    const params: unknown[] = []
    let where = ''
    if (query.search) {
      const targets = query.searchField
        ? searchable.filter((c) => c.name === query.searchField)
        : searchable
      if (query.searchField && targets.length === 0) {
        const error = new Error(`Column "${query.searchField}" is not searchable (BR-003)`) as Error & { statusCode?: number }
        error.statusCode = 400
        throw error
      }
      if (targets.length > 0) {
        where = `WHERE ${targets.map((c) => `CAST(${q(c.name)} AS TEXT) LIKE ?`).join(' OR ')}`
        for (let i = 0; i < targets.length; i++) params.push(`%${query.search}%`)
      }
    }
    let orderBy = '"id" DESC'
    if (query.sortBy && query.sortBy !== 'id') {
      const col = def.columns.find((c) => c.name === query.sortBy)
      if (!col || !col.is_orderable) {
        const error = new Error(`Column "${query.sortBy}" is not orderable (BR-003)`) as Error & { statusCode?: number }
        error.statusCode = 400
        throw error
      }
      orderBy = `${q(col.name)} ${query.sortOrder}`
    } else {
      orderBy = `"id" ${query.sortOrder}`
    }
    const ds = await getDataSource()
    const totalRows = await ds.query(`SELECT COUNT(*) AS total FROM ${q(table)} ${where}`, params) as Array<{ total: number }>
    const total = Number(totalRows[0]?.total ?? 0)
    const data = await ds.query(
      `SELECT * FROM ${q(table)} ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, query.limit, (query.page - 1) * query.limit],
    )
    return {
      data: (data as Array<Record<string, unknown>>).map((row) => decodeRow(def, row)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    }
  },

  async findOneRow(slug: string, id: number) {
    const def = await MasterDataService.getDefinition(slug)
    const table = MasterDdlService.physicalTableName(slug)
    const ds = await getDataSource()
    const rows = await ds.query(`SELECT * FROM ${MasterDdlService.quote(table)} WHERE "id" = ?`, [id])
    if (rows.length === 0) {
      const error = new Error(`Row ${id} not found`) as Error & { statusCode?: number }
      error.statusCode = 404
      throw error
    }
    return decodeRow(def, rows[0] as Record<string, unknown>)
  },

  /** Create row: validate + compute operations server-side (Step 4, DR-003). */
  async createRow(slug: string, input: Record<string, unknown>) {
    const def = await MasterDataService.getDefinition(slug)
    const values = await MasterDataService.validateAndCompute(def, input, {})
    const table = MasterDdlService.physicalTableName(slug)
    const q = MasterDdlService.quote
    const names = Object.keys(values)
    const ds = await getDataSource()
    // NOTE: TypeORM better-sqlite3 `query(INSERT)` resolves to the raw
    // `lastInsertRowid` number (not an object) — handle both shapes.
    const raw = await ds.query(
      `INSERT INTO ${q(table)} (${names.map(q).join(', ')}) VALUES (${names.map(() => '?').join(', ')})`,
      names.map((n) => values[n]),
    ) as number | { lastID?: number; lastInsertRowid?: number | bigint; insertId?: number }
    const id = typeof raw === 'number'
      ? raw
      : Number(raw?.lastInsertRowid ?? raw?.lastID ?? raw?.insertId ?? 0)
    return MasterDataService.findOneRow(slug, id)
  },

  async updateRow(slug: string, id: number, input: Record<string, unknown>) {
    const def = await MasterDataService.getDefinition(slug)
    const current = await MasterDataService.findOneRow(slug, id)
    const values = await MasterDataService.validateAndCompute(def, input, current, true)
    const names = Object.keys(values)
    if (names.length > 0) {
      const table = MasterDdlService.physicalTableName(slug)
      const q = MasterDdlService.quote
      const ds = await getDataSource()
      await ds.query(
        `UPDATE ${q(table)} SET ${names.map((n) => `${q(n)} = ?`).join(', ')}, "updated_at" = datetime('now') WHERE "id" = ?`,
        [...names.map((n) => values[n]), id],
      )
    }
    return MasterDataService.findOneRow(slug, id)
  },

  async removeRow(slug: string, id: number) {
    await MasterDataService.findOneRow(slug, id)
    const table = MasterDdlService.physicalTableName(slug)
    const ds = await getDataSource()
    await ds.query(`DELETE FROM ${MasterDdlService.quote(table)} WHERE "id" = ?`, [id])
    return { id }
  },

  /**
   * Validate input against the definition and compute operation columns
   * server-side (DR-003 — client preview never trusted).
   */
  async validateAndCompute(
    def: TableDef,
    input: Record<string, unknown>,
    base: Record<string, unknown>,
    partial = false,
  ): Promise<Record<string, unknown>> {
    const values: Record<string, unknown> = {}
    for (const col of def.columns) {
      if (isOperationType(col.type)) continue // computed below, never from input
      const hasValue = input[col.name] !== undefined
      const raw = hasValue ? input[col.name] : (partial ? undefined : (col.default_value ?? null))
      if (raw === undefined) continue // partial update: untouched
      if (col.is_required && (raw === null || raw === '' || raw === undefined)) {
        const error = new Error(`Column "${col.display_name}" is required`) as Error & { statusCode?: number }
        error.statusCode = 400
        throw error
      }
      if (raw === null || raw === '') {
        values[col.name] = null
        continue
      }
      values[col.name] = await MasterDataService.coerceValue(col, raw)
    }
    // Operations compute over the merged row (input wins, then stored base).
    const scope: Record<string, unknown> = { ...base, ...values }
    for (const col of def.columns) {
      if (!isOperationType(col.type)) continue
      const config = parseConfig(col)
      try {
        const computed = ExpressionService.evalTextOperation(String(config.expression ?? ''), {}, scope)
        values[col.name] = computed === null || computed === undefined ? null : String(computed)
      } catch (error) {
        const err = new Error(`Operation "${col.display_name}" invalid: ${(error as Error).message} (ERR-03)`) as Error & { statusCode?: number }
        err.statusCode = 400
        throw err
      }
    }
    return values
  },

  async coerceValue(col: ColumnDef, raw: unknown): Promise<unknown> {
    const config = parseConfig(col)
    switch (col.type) {
      case 'number': {
        const num = typeof raw === 'number' ? raw : Number(raw)
        if (!Number.isFinite(num)) {
          const error = new Error(`Column "${col.display_name}" must be a number`) as Error & { statusCode?: number }
          error.statusCode = 400
          throw error
        }
        return num
      }
      case 'select': {
        const options = (config.options ?? []) as string[]
        if (!options.includes(String(raw))) {
          const error = new Error(`Column "${col.display_name}" must be one of: ${options.join(', ')}`) as Error & { statusCode?: number }
          error.statusCode = 400
          throw error
        }
        return String(raw)
      }
      case 'select_multiple': {
        const options = (config.options ?? []) as string[]
        const arr = Array.isArray(raw) ? raw.map(String) : String(raw).split(',').map((s) => s.trim()).filter(Boolean)
        const invalid = arr.filter((v) => !options.includes(v))
        if (invalid.length > 0) {
          const error = new Error(`Column "${col.display_name}" has invalid options: ${invalid.join(', ')}`) as Error & { statusCode?: number }
          error.statusCode = 400
          throw error
        }
        return JSON.stringify(arr)
      }
      case 'relation_single': {
        const targetId = Number(raw)
        if (!Number.isInteger(targetId)) {
          const error = new Error(`Column "${col.display_name}" must reference a row id`) as Error & { statusCode?: number }
          error.statusCode = 400
          throw error
        }
        await MasterDataService.assertRelationTarget(config, targetId, col.display_name)
        return targetId
      }
      case 'relation_multiple': {
        const arr = Array.isArray(raw) ? raw : [raw]
        const ids = arr.map(Number)
        if (ids.some((n) => !Number.isInteger(n))) {
          const error = new Error(`Column "${col.display_name}" must reference row ids`) as Error & { statusCode?: number }
          error.statusCode = 400
          throw error
        }
        for (const targetId of ids) await MasterDataService.assertRelationTarget(config, targetId, col.display_name)
        return JSON.stringify(ids)
      }
      case 'image': {
        // Same allowlist as the renderer (DR-003): no javascript:/data-HTML URLs.
        const url = String(raw)
        if (url !== '' && !url.startsWith('https://') && !url.startsWith('/api/storage/') && !url.startsWith('data:image/')) {
          const error = new Error(`Column "${col.display_name}" must be an https://, /api/storage/ or data:image/ URL`) as Error & { statusCode?: number }
          error.statusCode = 400
          throw error
        }
        return url
      }
      default:
        return typeof raw === 'object' ? JSON.stringify(raw) : raw
    }
  },

  async assertRelationTarget(config: Record<string, unknown>, targetId: number, label: string): Promise<void> {
    const targetSlug = String(config.target_slug ?? '')
    if (!targetSlug) return
    const ds = await getDataSource()
    try {
      const table = MasterDdlService.physicalTableName(targetSlug)
      const rows = await ds.query(`SELECT "id" FROM ${MasterDdlService.quote(table)} WHERE "id" = ?`, [targetId])
      if (rows.length === 0) {
        const error = new Error(`Column "${label}" references missing row ${targetId}`) as Error & { statusCode?: number }
        error.statusCode = 400
        throw error
      }
    } catch (error) {
      if ((error as Error & { statusCode?: number }).statusCode === 400) throw error
      const err = new Error(`Column "${label}" references unknown table "${targetSlug}"`) as Error & { statusCode?: number }
      err.statusCode = 400
      throw err
    }
  },
}

function decodeRow(def: TableDef, row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row }
  for (const col of def.columns) {
    if ((col.type === 'select_multiple' || col.type === 'relation_multiple') && typeof out[col.name] === 'string') {
      try {
        out[col.name] = JSON.parse(out[col.name] as string)
      } catch {
        out[col.name] = []
      }
    }
  }
  return out
}

function assertStatusTransition(from: string, to: string): void {
  const allowed: Record<string, string[]> = { DRAFT: ['ACTIVE'], ACTIVE: ['ARCHIVED'], ARCHIVED: [] }
  if (from === to) return
  if (!(allowed[from] ?? []).includes(to)) {
    const error = new Error(`Invalid status transition ${from} → ${to}`) as Error & { statusCode?: number }
    error.statusCode = 400
    throw error
  }
}
