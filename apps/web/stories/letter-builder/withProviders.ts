import { h } from 'vue'
import { createPinia } from 'pinia'
import { NMessageProvider, NConfigProvider } from 'naive-ui'
import { setup } from '@storybook/vue3-vite'
import { themeOverrides } from '~/utils/naiveui-theme'

// Providers for LetterBuilder stories (Task 08 — FASE 1)
// - Pinia (stores inert)
// - NConfigProvider with Notion themeOverrides (#0075de, #f6f5f4, hairline, Inter)
// - NMessageProvider (useMessage())
// - $fetch stub for /api/master-data/* + /api/doc-* + preview/pdf so stories render deterministically

// eslint-disable-next-line @typescript-eslint/no-explicit-any
setup((app: any) => {
  app.use(createPinia())
})

const DEMO_COLUMNS = [
  { name: 'nama', display_name: 'Nama', type: 'text', config: null, is_required: true, is_orderable: true, is_searchable: true },
  { name: 'nip', display_name: 'NIP', type: 'text', config: null, is_required: false, is_orderable: true, is_searchable: true },
  { name: 'gaji', display_name: 'Gaji', type: 'number', config: { currency: true }, is_required: false, is_orderable: true, is_searchable: false },
  { name: 'jabatan_id', display_name: 'Jabatan', type: 'relation_single', config: { target_slug: 'jabatan', display_column: 'nama' }, is_required: false, is_orderable: false, is_searchable: false },
  { name: 'foto', display_name: 'Foto', type: 'image', config: null, is_required: false, is_orderable: false, is_searchable: false },
  { name: 'total_info', display_name: 'Info Total', type: 'readonly_operation_text', config: { expression: '"Total: "++gaji' }, is_required: false, is_orderable: false, is_searchable: false },
]

const DEMO_TABLES = [
  { id: 1, name: 'pegawai', display_name: 'Pegawai', slug: 'pegawai', description: 'Data pegawai', status: 'ACTIVE', columns: DEMO_COLUMNS, createdAt: '', updatedAt: '' },
  { id: 2, name: 'jabatan', display_name: 'Jabatan', slug: 'jabatan', description: 'Referensi jabatan', status: 'ACTIVE', columns: [{ name: 'nama', display_name: 'Nama', type: 'text', config: null, is_required: true, is_orderable: true, is_searchable: true }], createdAt: '', updatedAt: '' },
]

const DEMO_ROWS = [
  { id: 1, nama: 'Afdal', nip: '19900101', gaji: 2500000, jabatan_id: 1, foto: '', total_info: 'Total: 2500000', created_at: '', updated_at: '' },
  { id: 2, nama: 'Budi', nip: '19850506', gaji: 1800000, jabatan_id: 2, foto: '', total_info: 'Total: 1800000', created_at: '', updated_at: '' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalFetch = (globalThis as any).$fetch

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).$fetch = async (url: string, opts: any = {}) => {
  if (typeof url !== 'string') return originalFetch?.(url, opts)
  if (url.startsWith('/api/master-data')) {
    if (url === '/api/master-data' && (opts.method ?? 'GET') === 'POST') {
      return { id: 3, ...(opts.body ?? {}), slug: 'pegawai', status: 'ACTIVE', columns: [], createdAt: '', updatedAt: '' }
    }
    if (url === '/api/master-data') return { data: DEMO_TABLES, total: DEMO_TABLES.length, page: 1, limit: 20, totalPages: 1 }
    const schemaMatch = url.match(/^\/api\/master-data\/([^/]+)\/schema$/)
    if (schemaMatch) return { slug: schemaMatch[1], display_name: DEMO_TABLES[0].display_name, columns: DEMO_COLUMNS }
    const rowsMatch = url.match(/^\/api\/master-data\/([^/]+)\/rows/)
    if (rowsMatch) {
      if ((opts.method ?? 'GET') === 'POST' || opts.method === 'PUT') return { id: 3, ...(opts.body ?? {}), created_at: '', updated_at: '' }
      return { data: DEMO_ROWS, total: DEMO_ROWS.length, page: 1, limit: 20, totalPages: 1 }
    }
    const tableMatch = url.match(/^\/api\/master-data\/([^/]+)$/)
    if (tableMatch) return DEMO_TABLES.find((t) => t.slug === tableMatch[1]) ?? DEMO_TABLES[0]
  }
  if (url.startsWith('/api/doc-templates') || url.startsWith('/api/doc-components') || url.startsWith('/api/administrations')) {
    return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
  }
  if (url === '/api/settings/upload') return '/api/storage/general/demo.png'
  if (originalFetch) return originalFetch(url, opts)
  // fallback empty to avoid story crash
  return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
}

export const withProviders = (node: unknown) =>
  h(NConfigProvider, { themeOverrides } as never, {
    default: () => h(NMessageProvider, null, { default: () => node }),
  })

export const DEMO_SCHEMA = {
  slug: 'pegawai',
  display_name: 'Pegawai',
  columns: DEMO_COLUMNS,
} as never

export const DEMO_JABATAN_ROWS = [
  { id: 1, nama: 'Programmer' },
  { id: 2, nama: 'Analis' },
  { id: 3, nama: 'Kepala Dinas' },
]
