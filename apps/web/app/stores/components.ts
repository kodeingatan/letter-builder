import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  DocComponent,
  ComponentDetail,
  ComponentListItem,
  ComponentPreviewResult,
  ComponentVersion,
  CreateComponent,
  QueryComponent,
  UpdateComponent,
} from '~/shared/types/component'
import type { PaginatedResponse } from '~/shared/types/api'
import { useAuthStore } from '~/stores/auth'

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore().token}` }
}

export const useComponentsStore = defineStore('components', () => {
  const components = ref<ComponentListItem[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)
  const search = ref('')
  const searchField = ref('')
  const sortBy = ref('id')
  const sortOrder = ref<'ASC' | 'DESC'>('DESC')
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(params?: Partial<QueryComponent>) {
    loading.value = true
    error.value = null
    try {
      const query: QueryComponent = {
        page: params?.page ?? page.value,
        limit: params?.limit ?? limit.value,
        search: params?.search ?? (search.value || undefined),
        searchField: params?.searchField ?? (searchField.value || undefined),
        sortBy: params?.sortBy ?? sortBy.value,
        sortOrder: params?.sortOrder ?? sortOrder.value,
      }
      const response = await $fetch<PaginatedResponse<ComponentListItem>>('/api/components', {
        params: query as any,
        headers: authHeaders(),
      })
      components.value = response.data
      total.value = response.total
      page.value = response.page
      limit.value = response.limit
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch components'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number) {
    loading.value = true
    error.value = null
    try {
      return await $fetch<ComponentDetail>(`/api/components/${id}`, { headers: authHeaders() })
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch component'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchVersion(id: number, version: number) {
    try {
      return await $fetch<ComponentVersion>(`/api/components/${id}/versions/${version}`, {
        headers: authHeaders(),
      })
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch version'
      throw e
    }
  }

  async function create(data: CreateComponent) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<DocComponent>(`/api/components`, {
        method: 'POST',
        body: data,
        headers: authHeaders(),
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to create component'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, data: UpdateComponent) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<DocComponent>(`/api/components/${id}`, {
        method: 'PUT',
        body: data,
        headers: authHeaders(),
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to update component'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function publish(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<ComponentDetail>(`/api/components/${id}/publish`, {
        method: 'POST',
        headers: authHeaders(),
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to publish component'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function preview(
    id: number,
    payload: { samples?: Record<string, string | number>; items?: Array<Record<string, string | number>> },
  ) {
    try {
      return await $fetch<ComponentPreviewResult>(`/api/components/${id}/preview`, {
        method: 'POST',
        body: payload,
        headers: authHeaders(),
      })
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to render preview'
      throw e
    }
  }

  async function remove(id: number) {
    loading.value = true
    error.value = null
    try {
      await $fetch(`/api/components/${id}`, { method: 'DELETE', headers: authHeaders() })
      await fetchAll()
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to delete component'
      throw e
    } finally {
      loading.value = false
    }
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
    components, total, page, limit, search, searchField, sortBy, sortOrder, loading, error,
    fetchAll, fetchOne, fetchVersion, create, update, publish, preview, remove,
    setPage, setLimit, setSearch, setSearchField, setSort, resetFilters,
  }
})
