import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const healthPath = join(process.cwd(), 'server/api/health/index.get.ts')
const content = readFileSync(healthPath, 'utf8')

describe('health endpoint — Task 02 FR-002 / AC-002 (no render-guard)', () => {
  it('does not import render-guard or activeRenderCount', () => {
    expect(content).not.toContain('render-guard')
    expect(content).not.toContain('activeRenderCount')
  })

  it('imports only allowed modules (h3 + node built-ins + db)', () => {
    expect(content).toContain("from 'h3'")
    expect(content).toContain("from 'node:fs/promises'")
    expect(content).toContain("from 'node:path'")
    expect(content).toContain("from '~~/server/utils/db'")
    // no other server/utils imports
    expect(content).not.toContain('~~/server/utils/render-guard')
  })

  it('response shape has no renderer field (RBAC-Only)', () => {
    // content should contain status, db, storage, version but not renderer as key
    expect(content).toContain('status')
    expect(content).toContain('db')
    expect(content).toContain('storage')
    expect(content).toContain('version')
    // ensure no renderer property in return object
    // look for renderer as word bounded
    expect(content).not.toMatch(/\brenderer\b/)
  })

  it('is public ops probe without auth', () => {
    expect(content).toContain('Public ops probe')
    expect(content).toContain('RBAC-Only')
    // handler should not contain requireAuth / requireApiAccess
    expect(content).not.toContain('requireAuth')
    expect(content).not.toContain('requireApiAccess')
  })
})

describe('health endpoint — Task 02 FR-007 / AC-003 (runtime shape via file contract)', () => {
  it('file defines healthy/degraded logic for db + storage', () => {
    expect(content).toContain("'healthy'")
    expect(content).toContain("'degraded'")
    expect(content).toContain("SELECT 1")
    expect(content).toContain("access(")
    expect(content).toContain("constants.W_OK")
  })

  it('security-limits comment is corrected (no live path)', () => {
    const secPath = join(process.cwd(), 'server/utils/security-limits.ts')
    const secContent = readFileSync(secPath, 'utf8')
    expect(secContent).not.toContain('live in `server/utils/render-guard.ts`')
    expect(secContent).not.toContain('live in server/utils/render-guard.ts')
    expect(secContent).not.toContain('TableDataService.importCsv')
    // must contain removed in Task 01 tag per BR-003
    expect(secContent).toContain('removed in Task 01')
    expect(secContent).toContain('MAX_CSV_IMPORT_ROWS')
    expect(secContent).toContain('checkExpressionRateLimit')
  })
})
