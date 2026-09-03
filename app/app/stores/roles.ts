import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Role, QueryRole } from '~/shared/types/role'
import type { PaginatedResponse } from '~/shared/types/api'
import { useAuthStore } from '~/stores/auth'

export const useRolesStore = defineStore('roles', () => {
  const roles = ref<Role[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)
  const search = ref('')
  const sortBy = ref('id')
  const sortOrder = ref<'ASC' | 'DESC'>('DESC')
  const searchField = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(params?: Partial<QueryRole>) {
    loading.value = true
    error.value = null
    try {
      const query: QueryRole = {
        page: params?.page ?? page.value,
        limit: params?.limit ?? limit.value,
        search: params?.search ?? (search.value || undefined),
        searchField: params?.searchField ?? (searchField.value || undefined),
        sortBy: params?.sortBy ?? sortBy.value,
        sortOrder: params?.sortOrder ?? sortOrder.value,
      }
      const response = await $fetch<PaginatedResponse<Role>>('/api/roles', {
        params: query as any,
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      roles.value = response.data
      total.value = response.total
      page.value = response.page
      limit.value = response.limit
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch roles'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(data: Partial<Role>) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<Role>('/api/roles', {
        method: 'POST',
        body: data,
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to create role'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, data: Partial<Role>) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<Role>(`/api/roles/${id}`, {
        method: 'PUT',
        body: data,
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to update role'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    loading.value = true
    error.value = null
    try {
      await $fetch(`/api/roles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      await fetchAll()
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to delete role'
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
  function setSearchField(field: string) { searchField.value = field; page.value = 1 }
  function resetFilters() {
    page.value = 1; search.value = ''; sortBy.value = 'id'
    sortOrder.value = 'DESC'; searchField.value = ''
  }

  return {
    roles, total, page, limit, search, sortBy, sortOrder, searchField, loading, error,
    fetchAll, create, update, remove,
    setPage, setLimit, setSearch, setSort, setSearchField, resetFilters,
  }
})
