import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref, h } from 'vue'
import { NButton, NIcon, NAlert, NEmpty, NSpin } from 'naive-ui'
import { Search, Restart, Settings, Add } from '@vicons/carbon'
import DataTable from '~/components/common/DataTable/DataTable.vue'

const meta: Meta<typeof DataTable> = {
  title: 'Foundation/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Kanonis DataTable — search 320px + select 160px + Refresh (Restart via NIcon) + error slot NAlert + retry. Token: primary #3B82F6, debounce 300ms. Referensi AC-D02.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const sampleColumns = [
  { key: 'name', title: 'Nama', sortable: true, searchable: true },
  { key: 'displayName', title: 'Nama Tampilan', searchable: true },
  { key: 'cols', title: 'Kolom', sortable: true },
  { key: 'updatedAt', title: 'Diperbarui', sortable: true },
]

const sampleData = [
  { id: 1, name: 'pegawai', displayName: 'Pegawai', cols: 8, updatedAt: '2026-09-11' },
  { id: 2, name: 'jabatan', displayName: 'Jabatan', cols: 4, updatedAt: '2026-09-10' },
  { id: 3, name: 'unit', displayName: 'Unit Kerja', cols: 5, updatedAt: '2026-09-09' },
]

const searchableFields = [
  { label: 'Semua Kolom', value: '' },
  { label: 'Nama', value: 'name' },
  { label: 'Nama Tampilan', value: 'displayName' },
]

// Helper to render icon via NIcon per spec
function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

export const Default: Story = {
  args: {
    columns: sampleColumns as any,
    data: sampleData as any,
    loading: false,
    page: 1,
    limit: 20,
    total: 3,
    searchPlaceholder: 'Cari global tables...',
    searchableFields,
    sortBy: 'id',
    sortOrder: 'DESC',
  },
  render: (args) => ({
    components: { DataTable, NButton, NIcon },
    setup() {
      const onSearch = (v: string) => console.log('search', v)
      const onRetry = () => console.log('retry')
      return { args, onSearch, onRetry, Search, Restart, Settings }
    },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:480px">
        <div style="max-width:1100px; margin:0 auto">
          <div style="font-size:11px; color:#94a3b8; letter-spacing:.05em; text-transform:uppercase; font-weight:600; margin-bottom:8px">Toolbar kanonis — Search 320px + Select 160px + Refresh (NIcon Restart) — AC-D02</div>
          <div style="background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:16px">
            <DataTable v-bind="args" @search="onSearch" />
            <!-- Error slot demo (Task 27 props: error + retry) -->
            <div style="margin-top:12px; border:1px dashed #FECACA; border-radius:6px; padding:10px; background:#FEF2F2; font-size:12px; color:#991B1B">
              <b>Slot error (rencana Task 27):</b> <code>error: string | null</code> + <code>@retry</code> → NAlert + retry tanpa reset. Lihat story Error di bawah.
            </div>
          </div>
          <div style="font-size:11px; color:#6B7280; margin-top:8px; border-left:2px solid #3B82F6; padding-left:8px">Icons via <code>h(NIcon, null, {default:()=>h(Search)})</code> — bukan bare &lt;Search/&gt;. Search min-width 320px flex-1, Select 160px fixed.</div>
        </div>
      </div>
    `,
  }),
}

export const Loading: Story = {
  args: {
    columns: sampleColumns as any,
    data: [],
    loading: true,
    page: 1,
    limit: 20,
    total: 0,
    searchPlaceholder: 'Cari...',
    searchableFields,
  },
  render: (args) => ({
    components: { DataTable, NSpin },
    setup() { return { args } },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:360px">
        <div style="max-width:900px; margin:0 auto">
          <DataTable v-bind="args" />
          <div style="font-size:11px; color:#6B7280; margin-top:8px">State loading — NSpin overlay semi-transparan di atas tabel. NEmpty tidak tampil saat loading.</div>
        </div>
      </div>
    `,
  }),
}

export const Empty: Story = {
  args: {
    columns: sampleColumns as any,
    data: [],
    loading: false,
    page: 1,
    limit: 20,
    total: 0,
    searchPlaceholder: 'Cari...',
    searchableFields,
    emptyDescription: 'Belum ada Global Table',
  },
  render: (args) => ({
    components: { DataTable, NEmpty, NButton, NIcon },
    setup() { return { args, Add } },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:360px">
        <div style="max-width:900px; margin:0 auto">
          <DataTable v-bind="args" />
          <!-- CTA di empty (AC-D01) -->
          <div style="text-align:center; margin-top:12px">
            <NButton type="primary"><template #icon><NIcon><Add /></NIcon></template>Buat Global Table Pertama</NButton>
            <div style="font-size:11px; color:#6B7280; margin-top:6px">ALT-01 — tidak dead-end; ada CTA.</div>
          </div>
        </div>
      </div>
    `,
  }),
}

export const Error: Story = {
  args: {
    columns: sampleColumns as any,
    data: [],
    loading: false,
    page: 1,
    limit: 20,
    total: 0,
    searchPlaceholder: 'Cari...',
    searchableFields,
  },
  render: (args) => ({
    components: { DataTable, NAlert, NButton },
    setup() {
      const err = ref('Gagal memuat data — Kesalahan jaringan.')
      const retry = () => { err.value = ''; setTimeout(()=> err.value='', 0) }
      return { args, err, retry }
    },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:400px">
        <div style="max-width:900px; margin:0 auto">
          <NAlert v-if="err" type="error" closable @close="err=''" style="margin-bottom:12px">
            <template #header>Gagal memuat data</template>
            Kesalahan jaringan. <NButton size="small" @click="retry" style="margin-left:8px">Coba lagi</NButton>
          </NAlert>
          <DataTable v-bind="args" />
          <div style="font-size:11px; color:#6B7280; margin-top:8px; border-left:2px solid #3B82F6; padding-left:8px">ERR-01 — error NAlert full-width di atas tabel + retry tanpa reset search/sort/page (slot error kanonis Task 27).</div>
        </div>
      </div>
    `,
  }),
}

export const WithToolbarActions: Story = {
  args: {
    columns: sampleColumns as any,
    data: sampleData as any,
    loading: false,
    page: 1,
    limit: 20,
    total: 3,
    searchPlaceholder: 'Cari users...',
    searchableFields,
  },
  render: (args) => ({
    components: { DataTable, NButton, NIcon },
    setup() { return { args, Add } },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:480px">
        <div style="max-width:1100px; margin:0 auto">
          <DataTable v-bind="args">
            <template #toolbar>
              <NButton type="primary"><template #icon><NIcon><Add /></NIcon></template>Buat User</NButton>
            </template>
          </DataTable>
          <div style="font-size:11px; color:#6B7280; margin-top:8px">Toolbar slot — aksi halaman (Create, Export) di kanan, tidak mengganggu search 320px.</div>
        </div>
      </div>
    `,
  }),
}

export const RefreshWithoutReset: Story = {
  name: 'Refresh tanpa reset (AC-D02)',
  args: {
    columns: sampleColumns as any,
    data: sampleData as any,
    loading: false,
    page: 1,
    limit: 20,
    total: 3,
    searchPlaceholder: 'Cari...',
    searchableFields,
  },
  render: (args) => ({
    components: { DataTable, NButton, NIcon, NAlert },
    setup() {
      const msg = ref('')
      const onRefresh = () => { msg.value = 'Data dimuat ulang — filter dipertahankan (search/sort/page tidak direset).'; setTimeout(()=> msg.value='', 2500) }
      return { args, msg, onRefresh, Restart }
    },
    template: `
      <div style="padding:24px; background:#F9FAFB; min-height:480px">
        <div style="max-width:1100px; margin:0 auto">
          <NAlert v-if="msg" type="success" style="margin-bottom:12px">{{ msg }}</NAlert>
          <DataTable v-bind="args" />
          <div style="margin-top:12px; text-align:center">
            <NButton @click="onRefresh"><template #icon><NIcon><Restart /></NIcon></template>Simulasikan Refresh (Restart) — tanpa reset</NButton>
          </div>
          <div style="font-size:11px; color:#6B7280; margin-top:8px; border-left:2px solid #3B82F6; padding-left:8px">AC-D02 — Refresh memakai NIcon Restart, aria-label "Segarkan data", refetch tanpa reset state.</div>
        </div>
      </div>
    `,
  }),
}
