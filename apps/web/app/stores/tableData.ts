import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TableBrowseResponse, TableRow, ImportSummary } from '~/shared/types/table-data'
import { useAuthStore } from '~/stores/auth'

/**
 * Generic per-table row store (Task 12). State is keyed by tableName so
 * multiple DynamicTablePages can coexist; the active table is tracked
 * via `activeTable`.
 */
export const useTableDataStore = defineStore('tableData', () => {
  const activeTable = ref('')
  const tableMeta = ref<{ id: number; name: string; displayName: string } | null>(null)
  const columns = ref<TableBrowseResponse['columns']>([])
  const rows = ref<TableRow[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)
  const search = ref('')
  const searchField = ref('')
  const sortBy = ref('id')
  const sortOrder = ref<'ASC' | 'DESC'>('DESC')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const emptySchema = ref(false)

  function authHeaders() {
    return { Authorization: `Bearer ${useAuthStore().token}` }
  }

  async function fetchAll(tableName: string, params?: { page?: number; limit?: number; search?: string; searchField?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
    activeTable.value = tableName
    loading.value = true
    error.value = null
    emptySchema.value = false
    try {
      const query: Record<string, any> = {
        page: params?.page ?? page.value,
        limit: params?.limit ?? limit.value,
        search: params?.search ?? (search.value || undefined),
        searchField: params?.searchField ?? (searchField.value || undefined),
        sortBy: params?.sortBy ?? sortBy.value,
        sortOrder: params?.sortOrder ?? sortOrder.value,
      }
      const response = await $fetch<TableBrowseResponse>(`/api/data/${tableName}`, {
        params: query,
        headers: authHeaders(),
      })
      tableMeta.value = response.table
      columns.value = response.columns
      rows.value = response.data
      total.value = response.total
      page.value = response.page
      limit.value = response.limit
      emptySchema.value = response.columns.length === 0
      return response
    } catch (e: any) {
      if (e.data?.data?.code === 'EMPTY_SCHEMA' || e.statusCode === 422) {
        // Keep browse usable; page shows "define columns first" empty state
      }
      error.value = e.data?.message || 'Failed to fetch rows'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(tableName: string, rowId: number) {
    return $fetch<TableRow>(`/api/data/${tableName}/${rowId}`, { headers: authHeaders() })
  }

  async function create(tableName: string, payload: Record<string, any>) {
    const created = await $fetch<TableRow>(`/api/data/${tableName}`, {
      method: 'POST',
      body: payload,
      headers: authHeaders(),
    })
    await fetchAll(tableName)
    return created
  }

  async function update(tableName: string, rowId: number, payload: Record<string, any>) {
    const updated = await $fetch<TableRow>(`/api/data/${tableName}/${rowId}`, {
      method: 'PUT',
      body: payload,
      headers: authHeaders(),
    })
    await fetchAll(tableName)
    return updated
  }

  async function remove(tableName: string, rowId: number) {
    await $fetch(`/api/data/${tableName}/${rowId}`, { method: 'DELETE', headers: authHeaders() })
    await fetchAll(tableName)
  }

  async function exportCsv(tableName: string): Promise<Blob> {
    const response = await fetch(`/api/data/${tableName}/export?format=csv`, {
      headers: { Authorization: `Bearer ${useAuthStore().token}` },
    })
    if (!response.ok) throw new Error('Export failed')
    return response.blob()
  }

  async function importCsv(tableName: string, file: File): Promise<ImportSummary> {
    const form = new FormData()
    form.append('file', file)
    const summary = await $fetch<ImportSummary>(`/api/data/${tableName}/import`, {
      method: 'POST',
      body: form,
      headers: authHeaders(),
    })
    await fetchAll(tableName)
    return summary
  }

  function setPage(p: number) { page.value = p }
  function setLimit(l: number) { limit.value = l; page.value = 1 }
  function setSearch(s: string) { search.value = s; page.value = 1 }
  function setSearchField(f: string) { searchField.value = f; page.value = 1 }
  function setSort(field: string) {
    if (sortBy.value === field) {
      sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
    } else {
      sortBy.value = field
      sortOrder.value = 'ASC'
    }
    page.value = 1
  }
  function resetFilters() {
    page.value = 1
    search.value = ''
    searchField.value = ''
    sortBy.value = 'id'
    sortOrder.value = 'DESC'
  }

  return {
    activeTable, tableMeta, columns, rows, total, page, limit,
    search, searchField, sortBy, sortOrder, loading, error, emptySchema,
    fetchAll, fetchOne, create, update, remove, exportCsv, importCsv,
    setPage, setLimit, setSearch, setSearchField, setSort, resetFilters,
  }
})
