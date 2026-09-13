import { copyFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { DataSource } from 'typeorm'
import type { MasterColumnType } from '../../shared/types/master-data'

/**
 * Safe DDL service for Master Data physical tables (Task 06).
 *
 * - Every identifier is allowlisted (`[a-z][a-z0-9_]{1,60}`) and double-quoted;
 *   values always go through bound parameters — never string-interpolated.
 * - Destructive alters (drop/rename column) rebuild via
 *   `CREATE new → COPY → DROP` after a full `db.sqlite` backup (BR-005).
 * - `mst_*` tables are runtime artifacts: never entities, never migrations,
 *   ignored by drift detection (BR-006).
 */

export const MST_PREFIX = 'mst_'
export const MAX_COLUMNS_PER_TABLE = 100

const RESERVED_TABLE_NAMES = new Set([
  'users', 'roles', 'permissions', 'permission_methods', 'permission_urls',
  'guards', 'guard_urls', 'activity_logs', 'settings', 'migrations',
  'master_tables', 'master_table_columns',
])

const RESERVED_COLUMN_NAMES = new Set(['id', 'created_at', 'updated_at'])

const SQLITE_KEYWORDS = new Set(
  'abort,action,add,after,all,alter,always,analyze,and,as,asc,attach,autoincrement,before,begin,between,by,cascade,case,cast,check,collate,column,commit,conflict,constraint,create,cross,current,current_date,current_time,current_timestamp,database,default,deferrable,deferred,delete,desc,detach,distinct,do,drop,each,else,end,escape,except,exclude,exclusive,exists,explain,fail,filter,first,follow,for,foreign,from,full,generated,glob,group,groups,having,if,ignore,immediate,in,index,indexed,initially,insert,intersect,into,is,isnull,join,key,last,like,limit,match,materialized,maybe,no,not,nothing,notify,null,nulls,of,offset,on,open,or,order,others,over,partition,plan,pragma,precede,preceding,primary,query,raise,range,recursive,references,regexp,reindex,release,rename,replace,restrict,returning,right,rollback,row,rows,savepoint,schema,select,set,table,temp,temporary,then,ties,to,transaction,trigger,unbounded,union,unique,update,using,vacuum,values,view,virtual,when,where,window,with,without'.split(','),
)

export const COLUMN_SQL_TYPES: Record<MasterColumnType, string> = {
  text: 'TEXT',
  richtext: 'TEXT',
  date: 'TEXT',
  datetime: 'TEXT',
  time: 'TEXT',
  image: 'TEXT',
  select: 'TEXT',
  select_multiple: 'TEXT',
  relation_single: 'INTEGER',
  relation_multiple: 'TEXT',
  number: 'REAL',
  hidden_operation_text: 'TEXT',
  readonly_operation_text: 'TEXT',
}

export interface DdlColumn {
  name: string
  type: MasterColumnType
}

function fail(message: string): never {
  // Validation failures map to 400 in routes via `statusCode` (not 500).
  throw Object.assign(new Error(message), { statusCode: 400 })
}

export const MasterDdlService = {
  /** Validate a table slug (BR-001). Returns the normalized slug. */
  sanitizeSlug(raw: string): string {
    const slug = raw.trim().toLowerCase()
    if (!/^[a-z][a-z0-9_]{1,60}$/.test(slug)) fail(`Invalid slug "${raw}": must match [a-z][a-z0-9_]{1,60}`)
    if (RESERVED_TABLE_NAMES.has(slug)) fail(`Slug "${slug}" is reserved`)
    if (slug.startsWith(MST_PREFIX) || slug.startsWith('sqlite_') || slug.startsWith('master_')) {
      fail(`Slug "${slug}" uses a reserved prefix (mst_, sqlite_, master_)`)
    }
    if (SQLITE_KEYWORDS.has(slug)) fail(`Slug "${slug}" is a SQL keyword`)
    return slug
  },

  /** Validate a column name (BR-002). */
  sanitizeColumnName(raw: string): string {
    const name = raw.trim().toLowerCase()
    if (!/^[a-z][a-z0-9_]{1,60}$/.test(name)) fail(`Invalid column name "${raw}"`)
    if (RESERVED_COLUMN_NAMES.has(name)) fail(`Column name "${name}" is reserved`)
    if (SQLITE_KEYWORDS.has(name)) fail(`Column name "${name}" is a SQL keyword`)
    return name
  },

  physicalTableName(slug: string): string {
    return `${MST_PREFIX}${MasterDdlService.sanitizeSlug(slug)}`
  },

  /** Quote an already-sanitized identifier. */
  quote(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`
  },

  /** True for runtime tables managed outside entities/migrations (BR-006). */
  isMasterPhysicalTable(tableName: string): boolean {
    return tableName.startsWith(MST_PREFIX)
  },

  async tableExists(ds: DataSource, slug: string): Promise<boolean> {
    const table = MasterDdlService.physicalTableName(slug)
    const rows = await ds.query(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`, [table])
    return rows.length > 0
  },

  async listPhysicalColumns(ds: DataSource, slug: string): Promise<string[]> {
    const table = MasterDdlService.physicalTableName(slug)
    const rows = await ds.query(`PRAGMA table_info(${MasterDdlService.quote(table)})`) as Array<{ name: string }>
    return rows.map((row) => row.name)
  },

  async createTable(ds: DataSource, slug: string, columns: DdlColumn[]): Promise<void> {
    if (columns.length === 0) fail('Table must have at least 1 column (BR-002)')
    if (columns.length > MAX_COLUMNS_PER_TABLE) fail(`Too many columns (max ${MAX_COLUMNS_PER_TABLE}, EC-01)`)
    const table = MasterDdlService.physicalTableName(slug)
    if (await MasterDdlService.tableExists(ds, slug)) fail(`Physical table "${table}" already exists`)
    const seen = new Set<string>()
    const defs = columns.map((col) => {
      const name = MasterDdlService.sanitizeColumnName(col.name)
      if (seen.has(name)) fail(`Duplicate column "${name}" (BR-002)`)
      seen.add(name)
      const sqlType = COLUMN_SQL_TYPES[col.type] ?? fail(`Unknown column type "${col.type}" (INV-002)`)
      return `${MasterDdlService.quote(name)} ${sqlType}`
    })
    await ds.query(
      `CREATE TABLE ${MasterDdlService.quote(table)} (` +
      `"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, ` +
      defs.join(', ') +
      `, "created_at" TEXT NOT NULL DEFAULT (datetime('now')), "updated_at" TEXT NOT NULL DEFAULT (datetime('now')))`,
    )
  },

  async addColumn(ds: DataSource, slug: string, column: DdlColumn): Promise<void> {
    const table = MasterDdlService.physicalTableName(slug)
    const name = MasterDdlService.sanitizeColumnName(column.name)
    const existing = await MasterDdlService.listPhysicalColumns(ds, slug)
    if (existing.includes(name)) fail(`Column "${name}" already exists`)
    const sqlType = COLUMN_SQL_TYPES[column.type] ?? fail(`Unknown column type "${column.type}"`)
    await ds.query(`ALTER TABLE ${MasterDdlService.quote(table)} ADD COLUMN ${MasterDdlService.quote(name)} ${sqlType}`)
  },

  /**
   * Rebuild a table without the dropped columns / with renamed columns.
   * Always backs up `db.sqlite` first (BR-005).
   */
  async rebuildTable(
    ds: DataSource,
    slug: string,
    keepColumns: Array<{ name: string; type: MasterColumnType }>,
    renameMap: Record<string, string> = {},
  ): Promise<{ backupPath: string }> {
    const table = MasterDdlService.physicalTableName(slug)
    const backupPath = await MasterDdlService.backupDatabase(ds, slug)
    const tmpTable = `${table}__rebuild_${Date.now()}`
    const seen = new Set<string>()
    const defs: string[] = []
    const copyPairs: Array<[string, string]> = []
    for (const col of keepColumns) {
      const name = MasterDdlService.sanitizeColumnName(col.name)
      if (seen.has(name)) fail(`Duplicate column "${name}"`)
      seen.add(name)
      const sqlType = COLUMN_SQL_TYPES[col.type] ?? fail(`Unknown column type "${col.type}"`)
      defs.push(`${MasterDdlService.quote(name)} ${sqlType}`)
      const sourceName = Object.entries(renameMap).find(([, target]) => target === name)?.[0] ?? name
      copyPairs.push([MasterDdlService.sanitizeColumnName(sourceName), name])
    }
    const q = MasterDdlService.quote
    await ds.query(`CREATE TABLE ${q(tmpTable)} ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, ${defs.join(', ')}, "created_at" TEXT, "updated_at" TEXT)`)
    try {
      const cols = ['id', ...copyPairs.map(([from]) => from)]
      const targets = ['id', ...copyPairs.map(([, to]) => to)]
      await ds.query(
        `INSERT INTO ${q(tmpTable)} (${targets.map(q).join(', ')}) SELECT ${cols.map(q).join(', ')} FROM ${q(table)}`,
      )
      await ds.query(`DROP TABLE ${q(table)}`)
      await ds.query(`ALTER TABLE ${q(tmpTable)} RENAME TO ${q(table)}`)
    } catch (error) {
      await ds.query(`DROP TABLE IF EXISTS ${q(tmpTable)}`)
      throw error
    }
    return { backupPath }
  },

  async dropTable(ds: DataSource, slug: string): Promise<{ backupPath: string }> {
    const table = MasterDdlService.physicalTableName(slug)
    const backupPath = await MasterDdlService.backupDatabase(ds, slug)
    await ds.query(`DROP TABLE IF EXISTS ${MasterDdlService.quote(table)}`)
    return { backupPath }
  },

  /** Full database-file copy before any destructive DDL (BR-005). */
  async backupDatabase(ds: DataSource, slug: string): Promise<string> {
    const configured = (ds.options as { database?: unknown }).database
    const source = typeof configured === 'string' && configured !== ':memory:'
      ? configured
      : (process.env.DB_PATH ?? 'db.sqlite')
    if (source === ':memory:') {
      throw Object.assign(new Error('Cannot backup an in-memory database'), { statusCode: 500 })
    }
    const sourcePath = source.startsWith('/') ? source : join(process.cwd(), source)
    const dir = join(process.cwd(), 'storage', 'backups')
    await mkdir(dir, { recursive: true })
    const backupPath = join(dir, `master-${slug}-${Date.now()}.sqlite`)
    try {
      await copyFile(sourcePath, backupPath)
    } catch {
      throw Object.assign(
        new Error(`Backup failed: database file not found at ${sourcePath}`),
        { statusCode: 500 },
      )
    }
    return backupPath
  },
}
