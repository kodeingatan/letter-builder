import { describe, it, expect } from 'vitest'
import { isSynchronizeEnabled, shouldEmitStartupWarn } from '../../../server/utils/startup-check'
// Canonical single-source-of-truth types (Task 24): every name below is
// declared exactly once in `shared/` — server modules import (never
// re-export) them, so Nuxt auto-import registers each name exactly once.
import {
  COMPOSITION_KINDS,
  type CompositionKind,
  type CompositionNode,
  type TreeIssue,
  type UnboundSlot,
} from '../../../shared/types/template'
import type { RenderWarning, RenderWarningCode } from '../../../shared/types/render'
import type { StepField, StepIssue } from '../../../shared/types/administration'
import * as compositionTree from '../../../server/utils/composition-tree'

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

describe('single-source-of-truth composition types (Task 24, REQ-002)', () => {
  it('exposes the eight wiki node kinds', () => {
    expect([...COMPOSITION_KINDS].sort()).toEqual(
      ['component', 'condition', 'data-token', 'image', 'loop', 'page-break', 'table', 'text'].sort(),
    )
  })

  it('server utils import the registry without re-exporting it', () => {
    // Regression guard for the Nuxt `Duplicated imports` warn: exactly one
    // export site per name across the auto-imported dirs.
    expect('COMPOSITION_KINDS' in compositionTree).toBe(false)
  })

  it('composition shapes are structurally complete', () => {
    const kind: CompositionKind = 'loop'
    const node: CompositionNode = { id: 'n1', kind, attrs: {}, children: [] }
    const issue: TreeIssue = { path: 'nodes.0', message: 'bad' }
    const slot: UnboundSlot = { nodeId: 'n1', componentId: 2, requirement: 'title', type: 'text' }
    expect(node.children).toHaveLength(0)
    expect(issue.path).toBe('nodes.0')
    expect(slot.requirement).toBe('title')
  })

  it('render warning shapes are structurally complete', () => {
    const code: RenderWarningCode = 'MISSING_DATA'
    const warning: RenderWarning = { code, nodeId: null, message: 'missing' }
    expect(warning.code).toBe('MISSING_DATA')
  })

  it('step shapes keep the loose wire contract (BR-004)', () => {
    const strict: StepField = { name: 'nama', label: 'Nama', type: 'text', required: true }
    // Server-loose payload (no `required`, open `type`) stays assignable.
    const loose: StepField = { name: 'x', label: 'X', type: 'custom' }
    const issue: StepIssue = { index: 0, stepName: 'S1', message: 'bad' }
    expect(strict.required).toBe(true)
    expect(loose.name).toBe('x')
    expect(issue.stepName).toBe('S1')
  })
})
