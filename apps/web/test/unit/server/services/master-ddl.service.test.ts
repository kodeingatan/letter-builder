import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DataSource } from 'typeorm'
import { MasterDdlService, COLUMN_SQL_TYPES, MAX_COLUMNS_PER_TABLE } from '../../../../server/services/master-ddl.service'
import { isMasterPhysicalTable, filterManagedTables } from '../../../../server/utils/migration-status'

describe('master-ddl.service — sanitizeSlug (BR-001)', () => {
  it('accepts valid slugs and normalizes case', () => {
    expect(MasterDdlService.sanitizeSlug('pegawai')).toBe('pegawai')
    expect(MasterDdlService.sanitizeSlug('Pegawai_2024')).toBe('pegawai_2024')
  })

  it('rejects illegal format', () => {
    for (const bad of ['1pegawai', 'pe-gawai', 'a', 'x'.repeat(62), 'pegawai;DROP', '']) {
      expect(() => MasterDdlService.sanitizeSlug(bad)).toThrow()
    }
  })

  it('rejects reserved names and prefixes', () => {
    for (const bad of ['users', 'roles', 'migrations', 'master_tables', 'mst_pegawai', 'sqlite_x', 'master_x']) {
      expect(() => MasterDdlService.sanitizeSlug(bad)).toThrow()
    }
  })

  it('rejects SQL keywords', () => {
    expect(() => MasterDdlService.sanitizeSlug('select')).toThrow()
    expect(() => MasterDdlService.sanitizeSlug('table')).toThrow()
  })
})

describe('master-ddl.service — columns & type map (FR-001, INV-002)', () => {
  it('maps all 13 column types to SQL', () => {
    expect(Object.keys(COLUMN_SQL_TYPES)).toHaveLength(13)
    expect(COLUMN_SQL_TYPES.number).toBe('REAL')
    expect(COLUMN_SQL_TYPES.relation_single).toBe('INTEGER')
    expect(COLUMN_SQL_TYPES.text).toBe('TEXT')
  })

  it('rejects reserved column names', () => {
    for (const bad of ['id', 'created_at', 'updated_at', 'select', 'A B']) {
      expect(() => MasterDdlService.sanitizeColumnName(bad)).toThrow()
    }
  })

  it('physical table naming + drift-ignore predicate (BR-006)', () => {
    expect(MasterDdlService.physicalTableName('pegawai')).toBe('mst_pegawai')
    expect(MasterDdlService.isMasterPhysicalTable('mst_pegawai')).toBe(true)
    expect(MasterDdlService.isMasterPhysicalTable('users')).toBe(false)
    expect(isMasterPhysicalTable('mst_x')).toBe(true)
    expect(filterManagedTables(['users', 'mst_pegawai', 'master_tables'])).toEqual(['users', 'master_tables'])
  })
})

describe('master-ddl.service — DDL ops on :memory: sqlite (FR-002)', () => {
  let ds: DataSource
  beforeAll(async () => {
    ds = new DataSource({ type: 'better-sqlite3', database: ':memory:' })
    await ds.initialize()
  })
  afterAll(async () => { await ds.destroy() })

  it('creates mst_pegawai with typed columns', async () => {
    await MasterDdlService.createTable(ds, 'pegawai', [
      { name: 'nama', type: 'text' },
      { name: 'gaji', type: 'number' },
      { name: 'jabatan_id', type: 'relation_single' },
    ])
    expect(await MasterDdlService.tableExists(ds, 'pegawai')).toBe(true)
    expect(await MasterDdlService.listPhysicalColumns(ds, 'pegawai')).toEqual(
      expect.arrayContaining(['id', 'nama', 'gaji', 'jabatan_id', 'created_at', 'updated_at']),
    )
  })

  it('rejects duplicate physical table and duplicate/empty columns', async () => {
    await expect(MasterDdlService.createTable(ds, 'pegawai', [{ name: 'x', type: 'text' }])).rejects.toThrow(/already exists/)
    await expect(MasterDdlService.createTable(ds, 'kosong', [])).rejects.toThrow(/at least 1 column/)
    await expect(MasterDdlService.createTable(ds, 'dupe', [
      { name: 'nama', type: 'text' }, { name: 'nama', type: 'text' },
    ])).rejects.toThrow(/Duplicate column/)
    expect(MAX_COLUMNS_PER_TABLE).toBe(100)
  })

  it('adds a column (non-destructive alter)', async () => {
    await MasterDdlService.addColumn(ds, 'pegawai', { name: 'nip', type: 'text' })
    expect(await MasterDdlService.listPhysicalColumns(ds, 'pegawai')).toContain('nip')
    await expect(MasterDdlService.addColumn(ds, 'pegawai', { name: 'nip', type: 'text' })).rejects.toThrow(/already exists/)
  })

  it('rebuilds dropping a column with backup (BR-005)', async () => {
    // Backup needs a file-backed database — use a temp file (cleaned up after).
    const tmpDb = `/tmp/ddl-backup-test-${Date.now()}.sqlite`
    const fileDs = new DataSource({ type: 'better-sqlite3', database: tmpDb })
    await fileDs.initialize()
    try {
      await MasterDdlService.createTable(fileDs, 'arsip', [
        { name: 'nama', type: 'text' },
        { name: 'lama', type: 'text' },
      ])
      await fileDs.query(`INSERT INTO "mst_arsip" ("nama", "lama") VALUES ('Afdal', 'x')`)
      const { backupPath } = await MasterDdlService.rebuildTable(fileDs, 'arsip', [
        { name: 'nama', type: 'text' },
      ])
      expect(backupPath).toContain('master-arsip-')
      const cols = await MasterDdlService.listPhysicalColumns(fileDs, 'arsip')
      expect(cols).toContain('nama')
      expect(cols).not.toContain('lama')
      const rows = await fileDs.query(`SELECT * FROM "mst_arsip"`)
      expect(rows[0].nama).toBe('Afdal')
      const { unlink } = await import('node:fs/promises')
      await unlink(backupPath).catch(() => {})
    } finally {
      await fileDs.destroy()
      const { unlink } = await import('node:fs/promises')
      await unlink(tmpDb).catch(() => {})
    }
  })

  it('backup without a database file fails with an actionable error', async () => {
    const prev = process.env.DB_PATH
    process.env.DB_PATH = '/tmp/definitely-missing-db-xyz.sqlite'
    try {
      await expect(MasterDdlService.backupDatabase(ds, 'pegawai')).rejects.toThrow(/Backup failed/)
    } finally {
      if (prev === undefined) delete process.env.DB_PATH
      else process.env.DB_PATH = prev
    }
  })
})
