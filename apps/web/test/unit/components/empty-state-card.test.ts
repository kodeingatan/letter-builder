import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const file = join(process.cwd(), 'app/components/common/EmptyStateCard/EmptyStateCard.vue')
const content = readFileSync(file, 'utf8')

describe('EmptyStateCard — UT-01 / FR-004 / AC-004', () => {
  it('declares title/description/ctaLabel props', () => {
    expect(content).toContain('title?: string')
    expect(content).toContain('description?: string')
    expect(content).toContain('ctaLabel?: string')
  })

  it("defaults title to 'Belum ada data'", () => {
    expect(content).toContain("title: 'Belum ada data'")
  })

  it('emits cta when CTA button clicked (no dead-end)', () => {
    expect(content).toContain("(e: 'cta')")
    expect(content).toContain("@click=\"emit('cta')\"")
  })

  it('renders pill CTA via direct naive-ui imports', () => {
    expect(content).toContain("import { NEmpty, NButton } from 'naive-ui'")
    expect(content).toContain('round')
  })

  it('hides CTA when ctaLabel undefined (logs pages)', () => {
    expect(content).toContain('v-if="ctaLabel"')
  })
})
