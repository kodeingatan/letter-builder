import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const file = join(process.cwd(), 'app/components/features/dashboard/DashboardHero.vue')
const content = readFileSync(file, 'utf8')

describe('DashboardHero — UT-01 / FR-001 / AC-001 / EC-01', () => {
  it('declares eyebrow/title/subtitle/stats/primaryLabel/secondaryLabel props', () => {
    expect(content).toContain('eyebrow?: string')
    expect(content).toContain('title: string')
    expect(content).toContain('subtitle?: string')
    expect(content).toContain('stats?: HeroStat[]')
    expect(content).toContain('primaryLabel?: string')
    expect(content).toContain('secondaryLabel?: string')
  })

  it('emits primary/secondary CTA events', () => {
    expect(content).toContain("(e: 'primary')")
    expect(content).toContain("(e: 'secondary')")
  })

  it('renders hero band #213183 with xl16 radius', () => {
    expect(content).toContain('#213183')
    expect(content).toContain('border-radius: 16px')
  })

  it('renders stats list (users/roles/permissions/guards)', () => {
    expect(content).toContain('dashboard-hero-stats')
    expect(content).toContain('v-for="s in stats"')
  })

  it('supports default slot for extra content', () => {
    expect(content).toContain('<slot />')
  })
})
