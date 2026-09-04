import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GlobalTableColumn, QueryGlobalTableColumn } from '~/shared/types/global-table-column'
import type { PaginatedResponse } from '~/shared/types/api'
import { useAuthStore } from '~/stores/auth'

export const useGlobalTableColumnsStore = defineStore('globalTableColumns', () => {
  const columns = ref<GlobalTableColumn[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)
  const search = ref('')
  const searchField = ref('')
  const sortBy = ref('position')
  const sortOrder = ref<'ASC' | 'DESC'>('ASC')
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(tableId: number, params?: Partial<QueryGlobalTableColumn>) {
    loading.value = true
    error.value = null
    try {
      const query: QueryGlobalTableColumn = {
        page: params?.page ?? page.value,
        limit: params?.limit ?? limit.value,
        search: params?.search ?? (search.value || undefined),
        searchField: params?.searchField ?? (searchField.value || undefined),
        sortBy: params?.sortBy ?? sortBy.value,
        sortOrder: params?.sortOrder ?? sortOrder.value,
      }
      const response = await $fetch<PaginatedResponse<GlobalTableColumn>>(
        `/api/global-tables/${tableId}/columns`,
        {
          params: query as any,
          headers: { Authorization: `Bearer ${useAuthStore().token}` },
        }
      )
      columns.value = response.data
      total.value = response.total
      page.value = response.page
      limit.value = response.limit
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch columns'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(tableId: number, data: Partial<GlobalTableColumn>) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<GlobalTableColumn>(`/api/global-tables/${tableId}/columns`, {
        method: 'POST',
        body: data,
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      await fetchAll(tableId)
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to create column'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, data: Partial<GlobalTableColumn>) {
    loading.value = true
    error.value = null
    try {
      const columnId = data.id ?? id
      const response = await $fetch<GlobalTableColumn>(`/api/global-tables/${data.globalTableId ?? 0}/columns/${columnId}`, {
        method: 'PUT',
        body: data,
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      await fetchAll(data.globalTableId ?? 0)
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to update column'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(tableId: number, id: number) {
    loading.value = true
    error.value = null
    try {
      await $fetch(`/api/global-tables/${tableId}/columns/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      await fetchAll(tableId)
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to delete column'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function reorder(tableId: number, orderedIds: number[]) {
    loading.value = true
    error.value = null
    try {
      await $fetch(`/api/global-tables/${tableId}/columns/reorder`, {
        method: 'PUT',
        body: { orderedIds },
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      await fetchAll(tableId)
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to reorder columns'
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
    page.value = 1; search.value = ''; sortBy.value = 'position'
    sortOrder.value = 'ASC'; searchField.value = ''
  }

  return {
    columns, total, page, limit, search, searchField, sortBy, sortOrder, loading, error,
    fetchAll, create, update, remove, reorder,
    setPage, setLimit, setSearch, setSort, resetFilters,
  }
})