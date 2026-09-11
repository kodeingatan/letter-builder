import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DataTable from '~/components/common/DataTable/DataTable.vue'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const cols = [
  { key: 'name', title: 'Nama', sortable: true, searchable: true },
  { key: 'displayName', title: 'Tampilan', searchable: true },
]

describe('DataTable — FR-002 / AC-002 / BR-002 states', () => {
  it('shows empty NEmpty when no data and not loading', async () => {
    const wrapper = await mountSuspended(DataTable as any, {
      props: { columns: cols, data: [], loading: false, total: 0, emptyDescription: 'Belum ada data' },
    })
    expect(wrapper.text()).toContain('Belum ada data')
  })

  it('shows error NAlert with retry button when error prop set', async () => {
    const wrapper = await mountSuspended(DataTable as any, {
      props: { columns: cols, data: [], loading: false, total: 0, error: 'Gagal memuat data — network' },
    })
    expect(wrapper.text()).toContain('Gagal memuat data')
    expect(wrapper.text()).toContain('Coba lagi')
    const btn = wrapper.findAll('button').find((b) => b.text().includes('Coba lagi'))
    expect(btn).toBeTruthy()
    await btn!.trigger('click')
    expect(wrapper.emitted('retry')).toBeTruthy()
  })

  it('emits refresh when Segarkan button clicked', async () => {
    const wrapper = await mountSuspended(DataTable as any, {
      props: { columns: cols, data: [{ id: 1, name: 'a' }], loading: false, total: 1 },
    })
    const refreshBtn = wrapper.find('[aria-label="Segarkan data"]')
    expect(refreshBtn.exists()).toBe(true)
    await refreshBtn.trigger('click')
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })

  it('renders NIcon wrappers for icons via html check', async () => {
    const wrapper = await mountSuspended(DataTable as any, {
      props: { columns: cols, data: [], loading: false, total: 0 },
    })
    const html = wrapper.html()
    expect(html).toContain('n-icon')
    // ID locale placeholder checked via prop
    expect((wrapper.props() as any).searchPlaceholder).toBe('Cari...')
  })

  it('shows pagination text in ID locale Menampilkan', async () => {
    const wrapper = await mountSuspended(DataTable as any, {
      props: { columns: cols, data: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }], loading: false, total: 2, page: 1, limit: 20 },
    })
    expect(wrapper.text()).toContain('Menampilkan')
    expect(wrapper.text()).toContain('dari')
  })

  it('search placeholder defaults to Cari... (ID locale)', async () => {
    const wrapper = await mountSuspended(DataTable as any, {
      props: { columns: cols, data: [], loading: false, total: 0 },
    })
    expect((wrapper.props() as any).searchPlaceholder).toBe('Cari...')
  })

  it('has correct toolbar widths (checked via file content)', async () => {
    const appDir = join(process.cwd(), 'app')
    const content = readFileSync(join(appDir, 'components/common/DataTable/DataTable.vue'), 'utf8')
    expect(content).toContain('min-width: 320px')
    expect(content).toContain('width: 160px')
  })
})
