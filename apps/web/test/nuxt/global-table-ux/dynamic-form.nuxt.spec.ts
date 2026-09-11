import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('GlobalTable UX — DynamicForm upload + computed live (AC-004, GAP-16/17)', () => {
  const p = join(process.cwd(), 'app/components/features/table-data/DynamicForm.vue')
  const c = readFileSync(p, 'utf8')

  it('upload is NButton primary ghost + NIcon Upload + NImage 64 + no text-blue', () => {
    expect(c).not.toContain('text-blue-500')
    expect(c).toContain('type="primary"')
    expect(c).toContain('ghost')
    expect(c).toContain('<Upload')
    expect(c).toContain('NImage')
    expect(c).toContain('width="64"')
    expect(c).toContain('Upload image')
  })

  it('computed live uses debounce 200ms and POST /api/expressions/evaluate with chips', () => {
    expect(c).toContain('computedLive')
    expect(c).toContain('200')
    expect(c).toContain('/api/expressions/evaluate')
    expect(c).toContain('parseDeps')
    expect(c).toContain('NTag')
    expect(c).toContain('Uji ekspresi')
    expect(c).toContain('/api/expressions/validate')
  })

  it('hidden-computed filtered and readonly shows disabled live placeholder', () => {
    expect(c).toContain("type !== 'hidden-computed'")
    expect(c).toContain('readonly-computed')
    expect(c).toContain('Computed live')
    expect(c).toContain('disabled')
    expect(c).toContain('background:#F9FAFB')
  })

  it('has NAlert for computed errors and loading upload state', () => {
    expect(c).toContain('NAlert')
    expect(c).toContain('computedErrors')
    expect(c).toContain('uploading')
    expect(c).toContain('NSpin')
  })
})
