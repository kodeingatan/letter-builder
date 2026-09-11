import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = fileURLToPath(new URL('../../../app', import.meta.url))

function collectFiles(dir: string, exts: string[]): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) out.push(...collectFiles(full, exts))
    else if (exts.some((e) => full.endsWith(e))) out.push(full)
  }
  return out
}

describe('BR-001 token sweep — no indigo/off-token', () => {
  it('has zero indigo hits in app (text-indigo, #6366f1, #4F46E5, purple-500)', () => {
    const files = collectFiles(appDir, ['.vue', '.ts'])
    const offenders: string[] = []
    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      if (/indigo|#6366f1|#4F46E5|purple-500/i.test(content)) {
        // Allow stories which are not app code — but app should be 0
        offenders.push(file.replace(appDir, 'app'))
      }
    }
    expect(offenders, `indigo offenders: ${offenders.join(', ')}`).toEqual([])
  })

  it('has zero from-blue-50 to-indigo-100 gradient (AuthForm token)', () => {
    const files = collectFiles(appDir, ['.vue'])
    const offenders = files.filter((f) => readFileSync(f, 'utf8').includes('from-blue-50 to-indigo-100'))
    expect(offenders).toEqual([])
  })
})

describe('FR-002 DataTable token — 320/160 via file scan', () => {
  it('DataTable.vue contains 320px search and 160px select and no 280/140', () => {
    const p = join(appDir, 'components/common/DataTable/DataTable.vue')
    const content = readFileSync(p, 'utf8')
    expect(content).toContain('min-width: 320px')
    expect(content).toContain('width: 160px')
    expect(content).not.toMatch(/min-width:\s*280px/)
    // Allow min-w-[280px] fallback for flex-wrap min — but ensure not 280 search
    // We check that 140px select does not exist outside of unrelated pages
    expect(content).not.toMatch(/style="width:\s*140px"/)
  })

  it('DataTable.vue contains Refresh Restart via NIcon and error/NAlert', () => {
    const p = join(appDir, 'components/common/DataTable/DataTable.vue')
    const content = readFileSync(p, 'utf8')
    expect(content).toContain('Restart')
    expect(content).toContain("aria-label=\"Segarkan data\"")
    expect(content).toContain('NAlert')
    expect(content).toContain("emit('retry')")
    expect(content).toContain("emit('refresh')")
    expect(content).toContain('<NIcon><Search')
    expect(content).toContain('<NIcon><Settings')
  })
})

describe('EC-03 SSR-safe useMessage', () => {
  it('all useMessage() calls are guarded by import.meta.client', () => {
    const files = collectFiles(appDir, ['.vue', '.ts'])
    const offenders: string[] = []
    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      // match const message = useMessage() without guard
      if (content.includes('const message = useMessage()')) {
        offenders.push(file.replace(appDir, 'app'))
      }
    }
    expect(offenders, `unguarded useMessage in: ${offenders.join(', ')}`).toEqual([])
  })
})

describe('GAP-UI-07 sidebar 220/72', () => {
  it('default.vue width is 220 and collapsed 72', () => {
    const p = join(appDir, 'layouts/default.vue')
    const content = readFileSync(p, 'utf8')
    expect(content).toContain(':width="220"')
    expect(content).toContain(':collapsed-width="72"')
    expect(content).not.toContain(':width="240"')
    expect(content).not.toContain('collapsed-width="64"')
  })
})
