import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { DataSource } from 'typeorm'

// Mock the singleton db so the service under test runs against :memory:.
let testDs: DataSource
vi.mock('../../../../server/utils/db', () => ({
  getDataSource: () => Promise.resolve(testDs),
}))

import { MasterDataService } from '../../../../server/services/master-data.service'
import { MasterTableSchema } from '../../../../server/entities/master-table.entity'
import { MasterTableColumnSchema } from '../../../../server/entities/master-table-column.entity'
import { MasterDdlService } from '../../../../server/services/master-ddl.service'

const pegawaiDef = {
  name: 'pegawai',
  display_name: 'Pegawai',
  columns: [
    { name: 'nama', display_name: 'Nama', type: 'text', is_required: true, is_searchable: true, is_orderable: true },
    { name: 'gaji', display_name: 'Gaji', type: 'number', config: { currency: true }, is_orderable: true },
    { name: 'status_kepegawaian', display_name: 'Status', type: 'select', config: { options: ['PNS', 'PPPK'] } },
    {
      name: 'total_info', display_name: 'Info Total', type: 'readonly_operation_text',
      config: { expression: '"Total: "++gaji' },
    },
  ],
} as never

describe('master-data.service — table + rows + operations (FR-003/006, AC-001/004)', () => {
  beforeAll(async () => {
    testDs = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [MasterTableSchema, MasterTableColumnSchema],
      synchronize: true,
    })
    await testDs.initialize()
  })
  afterAll(async () => { await testDs.destroy() })

  it('creates definition + physical mst_pegawai (AC-001)', async () => {
    const table = await MasterDataService.createTable(pegawaiDef)
    expect((table as { slug: string }).slug).toBe('pegawai')
    expect(await MasterDdlService.tableExists(testDs, 'pegawai')).toBe(true)
  })

  it('rejects duplicate slug with 409 (ERR-01)', async () => {
    await expect(MasterDataService.createTable(pegawaiDef)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('creates rows with server-computed operations (AC-004)', async () => {
    const row = await MasterDataService.createRow('pegawai', { nama: 'Afdal', gaji: 2000000, status_kepegawaian: 'PNS' })
    expect(row.nama).toBe('Afdal')
    expect(row.total_info).toBe('Total: 2000000')
  })

  it('client-untampered: operation input is ignored, server recomputes (DR-003)', async () => {
    const row = await MasterDataService.createRow('pegawai', { nama: 'Budi', gaji: 1000000, total_info: 'HACKED' })
    expect(row.total_info).toBe('Total: 1000000')
  })

  it('validates required/select/number (ERR-03)', async () => {
    await expect(MasterDataService.createRow('pegawai', { gaji: 5 })).rejects.toMatchObject({ statusCode: 400 })
    await expect(MasterDataService.createRow('pegawai', { nama: 'X', status_kepegawaian: 'BOGUS' })).rejects.toMatchObject({ statusCode: 400 })
    await expect(MasterDataService.createRow('pegawai', { nama: 'X', gaji: 'NaN-gaji' })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('operation errors: invalid syntax → 400, div-by-zero → null (ERR-03, BR-004)', async () => {
    await MasterDataService.createTable({
      name: 'calc', display_name: 'Calc',
      columns: [
        { name: 'aa', display_name: 'A', type: 'number' },
        { name: 'bb', display_name: 'B', type: 'number' },
        { name: 'rr', display_name: 'R', type: 'readonly_operation_text', config: { expression: 'aa ++ bb' } },
      ],
    } as never)
    const row = await MasterDataService.createRow('calc', { aa: 1, bb: 2 })
    expect(String(row.rr)).toContain('12')
    // invalid operation syntax → 400 on save (ERR-03)
    await MasterDataService.updateTable('calc', {
      columns: [
        { name: 'aa', display_name: 'A', type: 'number' },
        { name: 'bb', display_name: 'B', type: 'number' },
        { name: 'rr', display_name: 'R', type: 'readonly_operation_text', config: { expression: 'aa;b' } },
      ],
    } as never)
    await expect(MasterDataService.createRow('calc', { aa: 1, bb: 2 })).rejects.toMatchObject({ statusCode: 400 })
    // div-by-zero → null stored (BR-004), message surfaces in client preview
    await MasterDataService.updateTable('calc', {
      columns: [
        { name: 'aa', display_name: 'A', type: 'number' },
        { name: 'bb', display_name: 'B', type: 'number' },
        { name: 'rr', display_name: 'R', type: 'readonly_operation_text', config: { expression: 'aa / bb' } },
      ],
    } as never)
    const zero = await MasterDataService.createRow('calc', { aa: 1, bb: 0 })
    expect(zero.rr).toBeNull()
  })

  it('browses with search (searchable only) + sort (orderable only) (AC-002, BR-003)', async () => {
    await MasterDataService.createRow('pegawai', { nama: 'Citra', gaji: 5000000 })
    const searched = await MasterDataService.findAllRows('pegawai', { page: 1, limit: 20, search: 'afd', sortBy: 'id', sortOrder: 'DESC' })
    expect(searched.total).toBe(1)
    expect((searched.data[0] as { nama: string }).nama).toBe('Afdal')
    const sorted = await MasterDataService.findAllRows('pegawai', { page: 1, limit: 20, sortBy: 'gaji', sortOrder: 'DESC' })
    expect((sorted.data[0] as { gaji: number }).gaji).toBe(5000000)
    await expect(MasterDataService.findAllRows('pegawai', { page: 1, limit: 20, sortBy: 'status_kepegawaian', sortOrder: 'ASC' }))
      .rejects.toMatchObject({ statusCode: 400 })
    await expect(MasterDataService.findAllRows('pegawai', { page: 1, limit: 20, search: 'x', searchField: 'gaji', sortBy: 'id', sortOrder: 'DESC' }))
      .rejects.toMatchObject({ statusCode: 400 })
  })

  it('blocks delete of referenced tables with 409 (AC-005, BR-004)', async () => {
    await MasterDataService.createTable({
      name: 'sk', display_name: 'SK',
      columns: [{ name: 'pegawai_id', display_name: 'Pegawai', type: 'relation_single', config: { target_slug: 'pegawai' } }],
    } as never)
    await expect(MasterDataService.removeTable('pegawai')).rejects.toMatchObject({ statusCode: 409 })
    const refs = await MasterDataService.findReferences('pegawai')
    expect(refs).toContain('sk:pegawai_id')
  })

  it('rejects invalid status transitions (ACTIVE → DRAFT)', async () => {
    await expect(MasterDataService.updateTable('sk', { status: 'DRAFT' })).rejects.toMatchObject({ statusCode: 400 })
    const archived = await MasterDataService.updateTable('sk', { status: 'ARCHIVED' })
    expect((archived as { status: string }).status).toBe('ARCHIVED')
  })

  it('rejects non-allowlisted image URLs (XSS, DR-003)', async () => {
    await MasterDataService.createTable({
      name: 'galeri', display_name: 'Galeri',
      columns: [{ name: 'foto', display_name: 'Foto', type: 'image' }],
    } as never)
    await expect(MasterDataService.createRow('galeri', { foto: 'javascript:alert(1)' })).rejects.toMatchObject({ statusCode: 400 })
    const ok = await MasterDataService.createRow('galeri', { foto: '/api/storage/general/a.png' })
    expect(ok.foto).toBe('/api/storage/general/a.png')
  })

  it('exposes builder schema (AC-006)', async () => {
    const schema = await MasterDataService.getSchema('pegawai')
    expect(schema.slug).toBe('pegawai')
    expect(schema.columns.map((c) => c.name)).toContain('total_info')
  })
})
