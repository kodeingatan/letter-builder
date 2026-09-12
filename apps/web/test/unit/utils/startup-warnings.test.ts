import { describe, it, expect } from 'vitest'
import { isSynchronizeEnabled, shouldEmitStartupWarn } from '../../../server/utils/startup-check'

describe('shouldEmitStartupWarn (Task 24, dev-silence gate)', () => {
  it('silences default-secret + drift warns on dev synchronize boots', () => {
    expect(shouldEmitStartupWarn('JWT_SECRET_DEFAULT', 'development', true)).toBe(false)
    expect(shouldEmitStartupWarn('MIGRATION_DRIFT', 'development', true)).toBe(false)
    expect(shouldEmitStartupWarn('JWT_SECRET_DEFAULT', 'test', true)).toBe(false)
    expect(shouldEmitStartupWarn('MIGRATION_DRIFT', 'test', true)).toBe(false)
  })

  it('keeps storage warns everywhere', () => {
    expect(shouldEmitStartupWarn('STORAGE_UNWRITABLE', 'development', true)).toBe(true)
    expect(shouldEmitStartupWarn('STORAGE_UNWRITABLE', 'production', false)).toBe(true)
  })

  it('emits everything outside dev-synchronize mode', () => {
    expect(shouldEmitStartupWarn('JWT_SECRET_DEFAULT', 'development', false)).toBe(true)
    expect(shouldEmitStartupWarn('MIGRATION_DRIFT', 'development', false)).toBe(true)
    expect(shouldEmitStartupWarn('SOME_FUTURE_WARN', 'development', true)).toBe(true)
  })

  it('emits everything in production regardless of synchronize', () => {
    for (const synchronize of [true, false]) {
      expect(shouldEmitStartupWarn('JWT_SECRET_DEFAULT', 'production', synchronize)).toBe(true)
      expect(shouldEmitStartupWarn('MIGRATION_DRIFT', 'production', synchronize)).toBe(true)
      expect(shouldEmitStartupWarn('STORAGE_UNWRITABLE', 'production', synchronize)).toBe(true)
    }
  })
})

describe('isSynchronizeEnabled (Task 24, extracted condition)', () => {
  it('defaults to true outside production', () => {
    expect(isSynchronizeEnabled({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toBe(true)
    expect(isSynchronizeEnabled({} as NodeJS.ProcessEnv)).toBe(true)
  })

  it('defaults to false in production', () => {
    expect(isSynchronizeEnabled({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toBe(false)
  })

  it('honours the DB_SYNCHRONIZE override in both directions', () => {
    expect(isSynchronizeEnabled({ NODE_ENV: 'production', DB_SYNCHRONIZE: 'true' } as NodeJS.ProcessEnv)).toBe(true)
    expect(isSynchronizeEnabled({ NODE_ENV: 'development', DB_SYNCHRONIZE: 'false' } as NodeJS.ProcessEnv)).toBe(false)
  })
})

// Composition/Render/Administration shapes removed Task 01 — RBAC-Only (dynamic types deleted)
