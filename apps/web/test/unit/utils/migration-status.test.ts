import { describe, it, expect } from 'vitest'
import {
  computeMigrationSync,
  checkMigrationStatus,
} from '../../../server/utils/migration-status'

const BASELINE = 'Baseline1788914913928'

function stubDataSource(applied: string[] | Error, local: { name?: string }[]) {
  return {
    options: { migrations: local },
    query: async () => {
      if (applied instanceof Error) throw applied
      return applied.map((name) => ({ name }))
    },
  }
}

describe('computeMigrationSync (Task 23, pure core)', () => {
  it('in-sync when applied matches checked-in set', () => {
    const state = computeMigrationSync([BASELINE], [BASELINE])
    expect(state.inSync).toBe(true)
    expect(state.reason).toBe('in-sync')
    expect(state.pending).toEqual([])
    expect(state.unknown).toEqual([])
  })

  it('flags checked-in but unapplied migrations as pending', () => {
    const state = computeMigrationSync([], [BASELINE])
    expect(state.inSync).toBe(false)
    expect(state.reason).toBe('pending')
    expect(state.pending).toEqual([BASELINE])
    expect(state.unknown).toEqual([])
  })

  it('flags applied-but-unknown migrations as unknown', () => {
    const state = computeMigrationSync([BASELINE, 'Rogue999'], [BASELINE])
    expect(state.inSync).toBe(false)
    expect(state.reason).toBe('unknown-applied')
    expect(state.pending).toEqual([])
    expect(state.unknown).toEqual(['Rogue999'])
  })

  it('pending takes precedence when both drift directions exist', () => {
    const state = computeMigrationSync(['Rogue999'], [BASELINE])
    expect(state.inSync).toBe(false)
    expect(state.reason).toBe('pending')
    expect(state.pending).toEqual([BASELINE])
    expect(state.unknown).toEqual(['Rogue999'])
  })
})

describe('checkMigrationStatus (Task 23, DataSource wiring)', () => {
  it('in-sync after the baseline migration applied', async () => {
    const state = await checkMigrationStatus(stubDataSource([BASELINE], [{ name: BASELINE }]) as never)
    expect(state.inSync).toBe(true)
    expect(state.reason).toBe('in-sync')
  })

  it('pending when the migrations table has no rows (fresh prod file)', async () => {
    const state = await checkMigrationStatus(stubDataSource([], [{ name: BASELINE }]) as never)
    expect(state.inSync).toBe(false)
    expect(state.reason).toBe('pending')
  })

  it('unknown when the DB carries an extra applied migration', async () => {
    const state = await checkMigrationStatus(
      stubDataSource([BASELINE, 'Hotfix1'], [{ name: BASELINE }]) as never,
    )
    expect(state.inSync).toBe(false)
    expect(state.reason).toBe('unknown-applied')
    expect(state.unknown).toEqual(['Hotfix1'])
  })

  it('fails closed when the migrations bookkeeping table is absent', async () => {
    const state = await checkMigrationStatus(
      stubDataSource(new Error('no such table: migrations'), [{ name: BASELINE }]) as never,
    )
    expect(state.inSync).toBe(false)
    expect(state.reason).toBe('migrations-table-missing')
    expect(state.pending).toEqual([BASELINE])
  })

  it('reads local names from ds.options.migrations classes', async () => {
    class FakeMigration {
      name = 'Fake123'
    }
    const state = await checkMigrationStatus(
      stubDataSource(['Fake123'], [new FakeMigration()]) as never,
    )
    expect(state.inSync).toBe(true)
    expect(state.local).toEqual(['Fake123'])
  })
})
