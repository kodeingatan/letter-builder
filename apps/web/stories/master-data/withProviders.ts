import { h } from 'vue'
import { createPinia } from 'pinia'
import { NMessageProvider } from 'naive-ui'
import { setup } from '@storybook/vue3-vite'

/**
 * Shared Storybook helpers for Master Data stories (Task 06).
 *
 * - Registers Pinia globally (stores are inert until an action runs).
 * - Stubs `globalThis.$fetch` for `/api/master-data/*` + `/api/settings/upload`
 *   so List/Form/Picker stories render deterministic demo data without a backend.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
setup((app: any) => {
  app.use(createPinia())
})

const DEMO_COLUMNS = [
  { name: 'nama', display_name: 'Nama', type: 'text', config: null, is_required: true, is_orderable: true, is_searchable: true },
  { name: 'gaji', display_name: 'Gaji', type: 'number', config: { currency: true }, is_required: false, is_orderable: true, is_searchable: false },
  { name: 'total_info', display_name: 'Info Total', type: 'readonly_operation_text', config: { expression: '"Total: "++gaji' }, is_required: false, is_orderable: false, is_searchable: false },
]

const DEMO_TABLES = [
  { id: 1, name: 'pegawai', display_name: 'Pegawai', slug: 'pegawai', description: 'Data pegawai', status: 'ACTIVE', columns: DEMO_COLUMNS, createdAt: '', updatedAt: '' },
  { id: 2, name: 'jabatan', display_name: 'Jabatan', slug: 'jabatan', description: 'Data jabatan', status: 'ACTIVE', columns: [], createdAt: '', updatedAt: '' },
]

const DEMO_ROWS = [
  { id: 1, nama: 'Afdal', gaji: 2000000, total_info: 'Total: 2000000', created_at: '', updated_at: '' },
  { id: 2, nama: 'Budi', gaji: 1500000, total_info: 'Total: 1500000', created_at: '', updated_at: '' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalFetch = (globalThis as any).$fetch

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).$fetch = async (url: string, opts: any = {}) => {
  if (url === '/api/master-data') {
    if ((opts.method ?? 'GET') === 'POST') {
      return { id: 3, ...(opts.body ?? {}), slug: 'pegawai_baru', status: 'ACTIVE', columns: [], createdAt: '', updatedAt: '' }
    }
    return { data: DEMO_TABLES, total: 2, page: 1, limit: 20, totalPages: 1 }
  }
  const schemaMatch = url.match(/^\/api\/master-data\/([^/]+)\/schema$/)
  if (schemaMatch) {
    return { slug: schemaMatch[1], display_name: 'Pegawai', columns: DEMO_COLUMNS }
  }
  const rowsMatch = url.match(/^\/api\/master-data\/([^/]+)\/rows(\/\d+)?$/)
  if (rowsMatch) {
    if ((opts.method ?? 'GET') === 'POST' || opts.method === 'PUT') {
      return { id: 3, ...(opts.body ?? {}), total_info: 'Total: demo', created_at: '', updated_at: '' }
    }
    return { data: DEMO_ROWS, total: 2, page: 1, limit: 20, totalPages: 1 }
  }
  const tableMatch = url.match(/^\/api\/master-data\/([^/]+)$/)
  if (tableMatch) return DEMO_TABLES[0]
  if (url === '/api/settings/upload') return '/api/storage/general/demo.png'
  if (originalFetch) return originalFetch(url, opts)
  throw new Error(`Unmocked $fetch: ${url}`)
}

/** Wrap a story vnode in NMessageProvider (components call useMessage()). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withMessageProvider = (node: any) => h(NMessageProvider, null, { default: () => node })
