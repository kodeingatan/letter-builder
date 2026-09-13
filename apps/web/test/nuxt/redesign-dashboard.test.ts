import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import DashboardHero from '~/components/features/dashboard/DashboardHero.vue'
import BadgePill from '~/components/common/BadgePill/BadgePill.vue'
import EmptyStateCard from '~/components/common/EmptyStateCard/EmptyStateCard.vue'

const appDir = join(process.cwd(), 'app')
const read = (p: string) => readFileSync(join(appDir, p), 'utf8')

describe('Redesign dashboard — NT-01 / Step 4 / AC-001', () => {
  it('DashboardHero renders band, headline, stats, CTAs', async () => {
    const wrapper = await mountSuspended(DashboardHero as any, {
      props: {
        eyebrow: 'Ringkasan RBAC',
        title: 'Halo, Admin!',
        subtitle: 'Berikut ringkasan akun Anda.',
        stats: [
          { label: 'Users', value: 10 },
          { label: 'Roles', value: 3 },
        ],
        primaryLabel: 'Kelola User',
        secondaryLabel: 'Lihat Log',
      },
    })
    const text = wrapper.text()
    expect(text).toContain('Halo, Admin!')
    expect(text).toContain('Users')
    expect(text).toContain('10')
    expect(text).toContain('Kelola User')
    const html = wrapper.html()
    expect(html).toContain('dashboard-hero')
  })

  it('DashboardHero emits primary/secondary on CTA click', async () => {
    const wrapper = await mountSuspended(DashboardHero as any, {
      props: { title: 'T', primaryLabel: 'A', secondaryLabel: 'B' },
    })
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')
    expect(wrapper.emitted('primary')).toBeTruthy()
    await buttons[1].trigger('click')
    expect(wrapper.emitted('secondary')).toBeTruthy()
  })

  it('BadgePill renders label with primary type (role pill)', async () => {
    const wrapper = await mountSuspended(BadgePill as any, {
      props: { label: 'admin', type: 'primary' },
    })
    expect(wrapper.text()).toContain('admin')
    expect(wrapper.html()).toContain('badge-pill')
  })

  it('EmptyStateCard renders title + CTA and emits cta', async () => {
    const wrapper = await mountSuspended(EmptyStateCard as any, {
      props: { title: 'Belum ada user', ctaLabel: '+ Buat User' },
    })
    expect(wrapper.text()).toContain('Belum ada user')
    const btn = wrapper.findAll('button').find((b) => b.text().includes('+ Buat User'))
    expect(btn).toBeTruthy()
    await btn!.trigger('click')
    expect(wrapper.emitted('cta')).toBeTruthy()
  })

  it('dashboard page wires DashboardHero (file contract)', () => {
    const dashboard = read('pages/dashboard/index.vue')
    expect(dashboard).toContain('<DashboardHero')
    expect(dashboard).toContain('@primary')
    expect(dashboard).toContain('@secondary')
  })

  it('UserTable roles column uses BadgePill with — fallback (EC-02)', () => {
    const table = read('components/features/users/UserTable.vue')
    expect(table).toContain('BadgePill')
    expect(table).toContain("'—'")
  })
})
