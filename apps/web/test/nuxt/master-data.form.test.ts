import { describe, it, expect, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createPinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { NMessageProvider } from 'naive-ui'
import MasterRowForm from '~/components/features/master-data/MasterRowForm.vue'
import MasterTableForm from '~/components/features/master-data/MasterTableForm.vue'

const plugins = { global: { plugins: [createPinia()] } }

/** mountSuspended harness: NMessageProvider (useMessage) + props passthrough. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withProvider(component: any) {
  return defineComponent({
    inheritAttrs: false,
    setup(_, { attrs }) {
      return () => h(NMessageProvider, null, { default: () => h(component, attrs) })
    },
  })
}

async function mountWithProvider(component: never, props: Record<string, unknown>) {
  return mountSuspended(withProvider(component) as never, { props, ...plugins } as never)
}

// NModal teleports to document.body — clear between tests for isolation.
afterEach(() => {
  document.body.innerHTML = ''
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function visibleText(wrapper: any): string {
  return wrapper.text() || document.body.textContent || ''
}

const schema13 = {
  slug: 'pegawai',
  display_name: 'Pegawai',
  columns: [
    { name: 'nama', display_name: 'Nama', type: 'text', config: null, is_required: true, is_orderable: true, is_searchable: true },
    { name: 'bio', display_name: 'Bio', type: 'richtext', config: null, is_required: false, is_orderable: false, is_searchable: false },
    { name: 'lahir', display_name: 'Tanggal Lahir', type: 'date', config: { format: 'm-d-Y' }, is_required: false, is_orderable: false, is_searchable: false },
    { name: 'masuk', display_name: 'Masuk', type: 'datetime', config: null, is_required: false, is_orderable: false, is_searchable: false },
    { name: 'apel', display_name: 'Apel', type: 'time', config: null, is_required: false, is_orderable: false, is_searchable: false },
    { name: 'foto', display_name: 'Foto', type: 'image', config: null, is_required: false, is_orderable: false, is_searchable: false },
    { name: 'status_kepegawaian', display_name: 'Status', type: 'select', config: { options: ['PNS', 'PPPK'] }, is_required: false, is_orderable: false, is_searchable: false },
    { name: 'keahlian', display_name: 'Keahlian', type: 'select_multiple', config: { options: ['A', 'B'] }, is_required: false, is_orderable: false, is_searchable: false },
    { name: 'jabatan_id', display_name: 'Jabatan', type: 'relation_single', config: { target_slug: 'jabatan' }, is_required: false, is_orderable: false, is_searchable: false },
    { name: 'atasan_ids', display_name: 'Atasan', type: 'relation_multiple', config: { target_slug: 'pegawai' }, is_required: false, is_orderable: false, is_searchable: false },
    { name: 'gaji', display_name: 'Gaji', type: 'number', config: { currency: true }, is_required: false, is_orderable: true, is_searchable: false },
    { name: 'gaji_flat', display_name: 'Gaji Flat', type: 'number', config: null, is_required: false, is_orderable: false, is_searchable: false },
    { name: 'total_info', display_name: 'Info Total', type: 'readonly_operation_text', config: { expression: '"Total: "++gaji' }, is_required: false, is_orderable: false, is_searchable: false },
  ],
} as never

describe('MasterRowForm — 13 input types (NT-01, FR-004, AC-003/004)', () => {
  it('renders all 13 column labels', async () => {
    const wrapper = await mountWithProvider(MasterRowForm as never, { visible: true, mode: 'create', slug: 'pegawai', schema: schema13, row: null })
    const text = document.body.textContent ?? wrapper.text()
    for (const label of ['Nama', 'Bio', 'Tanggal Lahir', 'Masuk', 'Apel', 'Foto', 'Status', 'Keahlian', 'Jabatan', 'Atasan', 'Gaji', 'Gaji Flat', 'Info Total']) {
      expect(text).toContain(label)
    }
  })

  it('marks required columns and shows relation picker triggers', async () => {
    const wrapper = await mountWithProvider(MasterRowForm as never, { visible: true, mode: 'create', slug: 'pegawai', schema: schema13, row: null })
    expect(document.body.textContent ?? '').toContain('Nama')
    const pickButtons = Array.from(document.body.querySelectorAll('button'))
      .map((b) => b.textContent ?? '')
      .filter((t) => t === 'Pilih')
    expect(pickButtons.length).toBe(2) // relation_single + relation_multiple
    expect(document.body.textContent ?? '').toContain('Unggah Gambar')
  })

  it('shows operation preview placeholder and IDR input', async () => {
    const wrapper = await mountWithProvider(MasterRowForm as never, { visible: true, mode: 'create', slug: 'pegawai', schema: schema13, row: null })
    expect(document.body.textContent ?? '').toContain('Gaji')
    expect(document.body.querySelector('input[placeholder="Terkomputasi otomatis"]')).toBeTruthy()
    expect(document.body.textContent ?? '').toContain('Simpan')
    expect(document.body.textContent ?? '').toContain('Batal')
  })

  it('shows warning when schema is missing (loading state)', async () => {
    const wrapper = await mountWithProvider(MasterRowForm as never, { visible: true, mode: 'create', slug: 'pegawai', schema: null, row: null })
    expect(document.body.textContent ?? '').toContain('Skema tabel belum dimuat')
  })
})

describe('MasterTableForm — definition builder (NT-01, FR-001)', () => {
  it('renders builder fields and type options', async () => {
    const wrapper = await mountWithProvider(MasterTableForm as never, { mode: 'create' })
    const text = visibleText(wrapper)
    expect(text).toContain('Nama internal')
    expect(text).toContain('Nama tampilan')
    expect(text).toContain('Kolom (1)')
    expect(text).toContain('Buat Tabel + DDL')
  })
})
