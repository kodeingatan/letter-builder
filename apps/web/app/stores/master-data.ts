import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MasterTable, MasterTableSchema, MasterRow, QueryMasterTable, QueryMasterRow, CreateMasterTable } from '~/shared/types/master-data'
import type { PaginatedResponse } from '~/shared/types/api'
import { useAuthStore } from '~/stores/auth'
import { getErrorMessage } from '~/utils/error'

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore().token}` }
}

export const useMasterDataStore = defineStore('master-data', () => {
  const tables = ref<MasterTable[]>([])
  const tablesTotal = ref(0)
  const tablesPage = ref(1)
  const tablesLimit = ref(20)
  const currentTable = ref<MasterTable | null>(null)
  const currentSchema = ref<MasterTableSchema | null>(null)
  const rows = ref<MasterRow[]>([])
  const rowsTotal = ref(0)
  const rowsPage = ref(1)
  const rowsLimit = ref(20)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTables(params?: Partial<QueryMasterTable>) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<PaginatedResponse<MasterTable>>('/api/master-data', {
        params: { page: params?.page ?? tablesPage.value, limit: params?.limit ?? tablesLimit.value, ...(params?.search ? { search: params.search } : {}) } as any,
        headers: authHeaders(),
      })
      tables.value = response.data
      tablesTotal.value = response.total
      tablesPage.value = response.page
      tablesLimit.value = response.limit
      return response
    } catch (e) {
      error.value = getErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchTable(slug: string) {
    loading.value = true
    error.value = null
    try {
      currentTable.value = await $fetch<MasterTable>(`/api/master-data/${slug}`, { headers: authHeaders() })
      return currentTable.value
    } catch (e) {
      error.value = getErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchSchema(slug: string) {
    const schema = await $fetch<MasterTableSchema>(`/api/master-data/${slug}/schema`, { headers: authHeaders() })
    currentSchema.value = schema
    return schema
  }

  async function fetchRows(slug: string, params?: Partial<QueryMasterRow>) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<PaginatedResponse<MasterRow>>(`/api/master-data/${slug}/rows`, {
        params: {
          page: params?.page ?? rowsPage.value,
          limit: params?.limit ?? rowsLimit.value,
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.searchField ? { searchField: params.searchField } : {}),
          ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
          ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}),
        } as any,
        headers: authHeaders(),
      })
      rows.value = response.data
      rowsTotal.value = response.total
      rowsPage.value = response.page
      rowsLimit.value = response.limit
      return response
    } catch (e) {
      error.value = getErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createTable(data: CreateMasterTable) {
    const table = await $fetch<MasterTable>('/api/master-data', { method: 'POST', body: data, headers: authHeaders() })
    await fetchTables()
    return table
  }

  async function updateTable(slug: string, data: Partial<CreateMasterTable> & { status?: string }) {
    const table = await $fetch<MasterTable>(`/api/master-data/${slug}`, { method: 'PUT', body: data, headers: authHeaders() })
    currentTable.value = table
    return table
  }

  async function removeTable(slug: string) {
    await $fetch(`/api/master-data/${slug}`, { method: 'DELETE', headers: authHeaders() })
    await fetchTables()
  }

  async function createRow(slug: string, data: Record<string, unknown>) {
    const row = await $fetch<MasterRow>(`/api/master-data/${slug}/rows`, { method: 'POST', body: data, headers: authHeaders() })
    await fetchRows(slug)
    return row
  }

  async function updateRow(slug: string, id: number, data: Record<string, unknown>) {
    const row = await $fetch<MasterRow>(`/api/master-data/${slug}/rows/${id}`, { method: 'PUT', body: data, headers: authHeaders() })
    await fetchRows(slug)
    return row
  }

  async function removeRow(slug: string, id: number) {
    await $fetch(`/api/master-data/${slug}/rows/${id}`, { method: 'DELETE', headers: authHeaders() })
    await fetchRows(slug)
  }

  return {
    tables, tablesTotal, tablesPage, tablesLimit,
    currentTable, currentSchema, rows, rowsTotal, rowsPage, rowsLimit,
    loading, error,
    fetchTables, fetchTable, fetchSchema, fetchRows,
    createTable, updateTable, removeTable, createRow, updateRow, removeRow,
  }
})
