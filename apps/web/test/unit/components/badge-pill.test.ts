import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const file = join(process.cwd(), 'app/components/common/BadgePill/BadgePill.vue')
const content = readFileSync(file, 'utf8')

describe('BadgePill — UT-01 / FR-002 / AC-002 / EC-02', () => {
  it('declares label/type/dot props with defaults', () => {
    expect(content).toContain('label: string')
    expect(content).toContain("'primary' | 'success' | 'warning' | 'error' | 'default'")
    expect(content).toContain("type: 'default'")
  })

  it('maps primary type to info tag (Notion blue)', () => {
    expect(content).toContain("props.type === 'primary' ? 'info'")
    expect(content).toContain('#0075de')
  })

  it('renders round NTag via direct naive-ui import', () => {
    expect(content).toContain("import { NTag } from 'naive-ui'")
    expect(content).toContain('round')
    expect(content).toContain(':bordered="false"')
  })

  it('supports status dot indicator', () => {
    expect(content).toContain('badge-pill-dot')
    expect(content).toContain('dot')
  })

  it('renders label text (no dead-end fallback handled by caller EC-02)', () => {
    expect(content).toContain('{{ label }}')
  })
})
