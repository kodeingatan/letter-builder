import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  GlobalTable,
  QueryGlobalTable,
  CreateGlobalTable,
  UpdateGlobalTable
} from '~/shared/types/global-table'
import type { PaginatedResponse } from '~/shared/types/api'
import { useAuthStore } from '~/stores/auth'

export const useGlobalTablesStore = defineStore('globalTables', () => {
  const tables = ref<GlobalTable[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)
  const search = ref('')
  const sortBy = ref('name')
  const sortOrder = ref<'ASC' | 'DESC'>('ASC')
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(params?: Partial<QueryGlobalTable>) {
    loading.value = true
    error.value = null
    try {
      const query: QueryGlobalTable = {
        page: params?.page ?? page.value,
        limit: params?.limit ?? limit.value,
        search: params?.search ?? (search.value || undefined),
        sortBy: params?.sortBy ?? sortBy.value,
        sortOrder: params?.sortOrder ?? sortOrder.value,
      }
      const response = await $fetch<PaginatedResponse<GlobalTable>>('/api/global-tables', {
        params: query as any,
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      tables.value = response.data
      total.value = response.total
      page.value = response.page
      limit.value = response.limit
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch tables'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<GlobalTable>(`/api/global-tables/${id}`, {
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch table'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(data: CreateGlobalTable) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<GlobalTable>('/api/global-tables', {
        method: 'POST',
        body: data,
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to create table'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, data: UpdateGlobalTable) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<GlobalTable>(`/api/global-tables/${id}`, {
        method: 'PUT',
        body: data,
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to update table'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    loading.value = true
    error.value = null
    try {
      await $fetch(`/api/global-tables/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      await fetchAll()
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to delete table'
      throw e
    } finally {
      loading.value = false
    }
  }

  function setPage(p: number) { page.value = p }
  function setLimit(l: number) { limit.value = l; page.value = 1 }
  function setSearch(s: string) { search.value = s; page.value = 1 }
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
    sortBy.value = 'name'
    sortOrder.value = 'ASC'
  }

  const tableOptions = computed(() => tables.value.map(t => ({
    label: t.displayName,
    value: t.id,
  })))

  return {
    tables, total, page, limit, search, sortBy, sortOrder, loading, error,
    fetchAll, fetchOne, create, update, remove,
    setPage, setLimit, setSearch, setSort, resetFilters,
    tableOptions,
  }
})
