import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  Administration,
  AdministrationDetail,
  AdministrationListItem,
  CreateAdministration,
  QueryAdministration,
  StepInput,
  UpdateAdministration,
} from '~/shared/types/administration'
import type { PaginatedResponse } from '~/shared/types/api'
import { useAuthStore } from '~/stores/auth'

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore().token}` }
}

export const useAdministrationsStore = defineStore('administrations', () => {
  const administrations = ref<AdministrationListItem[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)
  const search = ref('')
  const searchField = ref('')
  const sortBy = ref('id')
  const sortOrder = ref<'ASC' | 'DESC'>('DESC')
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(params?: Partial<QueryAdministration>) {
    loading.value = true
    error.value = null
    try {
      const query: QueryAdministration = {
        page: params?.page ?? page.value,
        limit: params?.limit ?? limit.value,
        search: params?.search ?? (search.value || undefined),
        searchField: params?.searchField ?? (searchField.value || undefined),
        sortBy: params?.sortBy ?? sortBy.value,
        sortOrder: params?.sortOrder ?? sortOrder.value,
      }
      const response = await $fetch<PaginatedResponse<AdministrationListItem>>('/api/administrations', {
        params: query as any,
        headers: authHeaders(),
      })
      administrations.value = response.data
      total.value = response.total
      page.value = response.page
      limit.value = response.limit
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch administrations'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number) {
    loading.value = true
    error.value = null
    try {
      return await $fetch<AdministrationDetail>(`/api/administrations/${id}`, { headers: authHeaders() })
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch administration'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(data: CreateAdministration) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<Administration>(`/api/administrations`, {
        method: 'POST',
        body: data,
        headers: authHeaders(),
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to create administration'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, data: UpdateAdministration) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<AdministrationDetail>(`/api/administrations/${id}`, {
        method: 'PUT',
        body: data,
        headers: authHeaders(),
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to update administration'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function saveSteps(id: number, steps: StepInput[]) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<AdministrationDetail>(`/api/administrations/${id}/steps`, {
        method: 'PUT',
        body: { steps },
        headers: authHeaders(),
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to save steps'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function publish(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<AdministrationDetail>(`/api/administrations/${id}/publish`, {
        method: 'POST',
        headers: authHeaders(),
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to publish administration'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function archive(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<AdministrationDetail>(`/api/administrations/${id}/archive`, {
        method: 'POST',
        headers: authHeaders(),
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to archive administration'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function newVersion(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<AdministrationDetail>(`/api/administrations/${id}/new-version`, {
        method: 'POST',
        headers: authHeaders(),
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to open a new version'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    loading.value = true
    error.value = null
    try {
      await $fetch(`/api/administrations/${id}`, { method: 'DELETE', headers: authHeaders() })
      await fetchAll()
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to delete administration'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateMenu(id: number, data: { menuOrder?: number | null; menuIcon?: string | null }) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<Administration>(`/api/administrations/${id}/menu`, {
        method: 'PUT',
        body: data,
        headers: authHeaders(),
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to update menu entry'
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
    administrations, total, page, limit, search, searchField, sortBy, sortOrder, loading, error,
    fetchAll, fetchOne, create, update, updateMenu, saveSteps, publish, archive, newVersion, remove,
    setPage, setLimit, setSearch, setSearchField, setSort, resetFilters,
  }
})
