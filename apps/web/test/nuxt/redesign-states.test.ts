import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import DataTable from '~/components/common/DataTable/DataTable.vue'

const appDir = join(process.cwd(), 'app')
const read = (p: string) => readFileSync(join(appDir, p), 'utf8')

const cols = [{ key: 'name', title: 'Nama', sortable: true, searchable: true }]

describe('Redesign states — NT-02 / ALT-01 / AC-003 / AC-004', () => {
  it('DataTable empty renders EmptyStateCard with per-entity CTA', async () => {
    const wrapper = await mountSuspended(DataTable as any, {
      props: { columns: cols, data: [], loading: false, total: 0, emptyDescription: 'Belum ada user', emptyCtaLabel: '+ Buat User' },
    })
    expect(wrapper.text()).toContain('Belum ada user')
    const btn = wrapper.findAll('button').find((b) => b.text().includes('+ Buat User'))
    expect(btn).toBeTruthy()
  })

  it('DataTable empty CTA emits empty-cta (no dead-end)', async () => {
    const wrapper = await mountSuspended(DataTable as any, {
      props: { columns: cols, data: [], loading: false, total: 0, emptyCtaLabel: '+ Buat Role' },
    })
    const btn = wrapper.findAll('button').find((b) => b.text().includes('+ Buat Role'))
    expect(btn).toBeTruthy()
    await btn!.trigger('click')
    expect(wrapper.emitted('empty-cta')).toBeTruthy()
  })

  it('DataTable empty hides CTA when ctaLabel undefined (logs pages)', async () => {
    const wrapper = await mountSuspended(DataTable as any, {
      props: { columns: cols, data: [], loading: false, total: 0, emptyDescription: 'Belum ada activity log' },
    })
    expect(wrapper.text()).toContain('Belum ada activity log')
    expect(wrapper.text()).not.toContain('+ Buat')
  })

  it('DataTable loading hides empty state', async () => {
    const wrapper = await mountSuspended(DataTable as any, {
      props: { columns: cols, data: [], loading: true, total: 0, emptyCtaLabel: '+ Buat User' },
    })
    expect(wrapper.text()).not.toContain('+ Buat User')
  })

  it('DataTable error hides empty state (retry instead)', async () => {
    const wrapper = await mountSuspended(DataTable as any, {
      props: { columns: cols, data: [], loading: false, total: 0, error: 'boom', emptyCtaLabel: '+ Buat User' },
    })
    expect(wrapper.text()).not.toContain('+ Buat User')
    expect(wrapper.text()).toContain('Coba lagi')
  })

  it('all 4 FormModals carry .modal-card (AC-003)', () => {
    for (const f of [
      'components/features/users/UserFormModal.vue',
      'components/features/users/RoleFormModal.vue',
      'components/features/users/PermissionFormModal.vue',
      'components/features/users/GuardFormModal.vue',
    ]) {
      expect(read(f)).toContain('modal-card')
    }
  })

  it('entity tables wire empty CTA to create (ALT-01)', () => {
    expect(read('components/features/users/UserTable.vue')).toContain('empty-cta-label="+ Buat User"')
    expect(read('components/features/users/RoleTable.vue')).toContain('empty-cta-label="+ Buat Role"')
    expect(read('components/features/users/PermissionTable.vue')).toContain('empty-cta-label="+ Buat Permission"')
    expect(read('components/features/users/GuardTable.vue')).toContain('empty-cta-label="+ Buat Guard"')
  })

  it('logs tables use BadgePill + EmptyStateCard without CTA', () => {
    const activity = read('pages/dashboard/activity-logs.vue')
    expect(activity).toContain('BadgePill')
    expect(activity).toContain('empty-description="Belum ada activity log"')
    const system = read('pages/dashboard/system-logs.vue')
    expect(system).toContain('BadgePill')
    expect(system).toContain('empty-description="Belum ada system log"')
  })

  it('auth pages keep pill CTA + inline error (AC-005)', () => {
    const login = read('pages/login.vue')
    expect(login).toContain('round')
    expect(login).toContain('NAlert')
    expect(login).toContain("layout: 'auth'")
  })
})
