import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { DataSource } from 'typeorm'

let testDs: DataSource
vi.mock('../../../../server/utils/db', () => ({
  getDataSource: () => Promise.resolve(testDs),
}))

import { MasterDataService } from '../../../../server/services/master-data.service'
import { MasterTableSchema } from '../../../../server/entities/master-table.entity'
import { MasterTableColumnSchema } from '../../../../server/entities/master-table-column.entity'

describe('master-data.service — duplicate + refs + whitelist + column 409 (UT-03)', () => {
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

  it('rejects duplicate slug 409 BR-001', async () => {
    await MasterDataService.createTable({
      name: 'jabatan',
      display_name: 'Jabatan',
      columns: [{ name: 'nama', display_name: 'Nama', type: 'text', is_required: true }],
    } as never)
    await expect(MasterDataService.createTable({
      name: 'jabatan',
      display_name: 'Jabatan Dupe',
      columns: [{ name: 'nama', display_name: 'Nama', type: 'text' }],
    } as never)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('blocks delete of referenced table 409 with references', async () => {
    await MasterDataService.createTable({
      name: 'pegawai',
      display_name: 'Pegawai',
      columns: [
        { name: 'nama', display_name: 'Nama', type: 'text', is_required: true },
        { name: 'gaji', display_name: 'Gaji', type: 'number', is_orderable: true },
      ],
    } as never)
    await MasterDataService.createTable({
      name: 'sk',
      display_name: 'SK',
      columns: [{ name: 'pegawai_id', display_name: 'Pegawai', type: 'relation_single', config: { target_slug: 'pegawai' } }],
    } as never)
    await expect(MasterDataService.removeTable('pegawai')).rejects.toMatchObject({ statusCode: 409, data: { references: expect.arrayContaining(['sk:pegawai_id']) } })
    const refs = await MasterDataService.findReferences('pegawai')
    expect(refs).toContain('sk:pegawai_id')
  })

  it('column remove 409 when still referenced display_column', async () => {
    // add display_column reference
    await MasterDataService.createTable({
      name: 'unit',
      display_name: 'Unit',
      columns: [{ name: 'nama', display_name: 'Nama', type: 'text' }],
    } as never)
    // sk already has pegawai_id targeting pegawai — add unit relation with display_column
    await testDs.getRepository(MasterTableColumnSchema).save(
      testDs.getRepository(MasterTableColumnSchema).create({
        tableId: (await testDs.getRepository(MasterTableSchema).findOne({ where: { slug: 'sk' } }) as any).id,
        name: 'unit_id',
        displayName: 'Unit',
        type: 'relation_single',
        configJson: JSON.stringify({ target_slug: 'unit', display_column: 'nama' }),
        defaultValue: null,
        isRequired: false,
        isOrderable: false,
        isSearchable: false,
        sortOrder: 10,
      }),
    )
    await expect(MasterDataService.updateTable('unit', {
      columns: [], // try to remove all columns — should trigger column reference check for 'nama'
    } as never)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('whitelist searchable/orderable 400 BR-006', async () => {
    await expect(MasterDataService.findAllRows('pegawai', { page: 1, limit: 20, search: 'x', searchField: 'gaji', sortBy: 'id', sortOrder: 'DESC' })).rejects.toMatchObject({ statusCode: 400 })
    await expect(MasterDataService.findAllRows('pegawai', { page: 1, limit: 20, sortBy: 'nama', sortOrder: 'DESC' })).rejects.toMatchObject({ statusCode: 400 }) // nama not orderable? actually in pegawai above gaji orderable but nama not — need check: skapa: pegawai nama not orderable, so should 400. But our pegawai nama not flagged orderable, so expect 400.
  })

  it('404 for unknown slug', async () => {
    await expect(MasterDataService.getDefinition('unknown_slug_xyz')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('getSchema returns columns', async () => {
    const schema = await MasterDataService.getSchema('pegawai')
    expect(schema.slug).toBe('pegawai')
    expect(schema.columns.length).toBeGreaterThan(0)
  })
})
