import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  AdministrationRunDetail,
  AdministrationRunListItem,
  CompleteRunResult,
  QueryRuns,
  StepSavePayload,
  StepSaveResult,
} from '~/shared/types/run'
import type { PaginatedResponse } from '~/shared/types/api'
import { useAuthStore } from '~/stores/auth'

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore().token}` }
}

export const useRunsStore = defineStore('runs', () => {
  const runs = ref<AdministrationRunListItem[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)
  const search = ref('')
  const searchField = ref('')
  const sortBy = ref('id')
  const sortOrder = ref<'ASC' | 'DESC'>('DESC')
  const status = ref<string>('')
  const scope = ref<'mine' | 'all'>('mine')
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMine(params?: Partial<QueryRuns>) {
    loading.value = true
    error.value = null
    try {
      const query: QueryRuns = {
        page: params?.page ?? page.value,
        limit: params?.limit ?? limit.value,
        search: params?.search ?? (search.value || undefined),
        searchField: params?.searchField ?? (searchField.value || undefined),
        sortBy: params?.sortBy ?? sortBy.value,
        sortOrder: params?.sortOrder ?? sortOrder.value,
        status: params?.status ?? (status.value ? (status.value as QueryRuns['status']) : undefined),
        scope: params?.scope ?? scope.value,
      }
      const response = await $fetch<PaginatedResponse<AdministrationRunListItem>>('/api/runs/mine', {
        params: query as any,
        headers: authHeaders(),
      })
      runs.value = response.data
      total.value = response.total
      page.value = response.page
      limit.value = response.limit
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch runs'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(runId: number) {
    loading.value = true
    error.value = null
    try {
      return await $fetch<AdministrationRunDetail>(`/api/runs/${runId}`, { headers: authHeaders() })
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch run'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function start(administrationId: number) {
    loading.value = true
    error.value = null
    try {
      return await $fetch<AdministrationRunDetail>(`/api/administrations/${administrationId}/runs`, {
        method: 'POST',
        headers: authHeaders(),
      })
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to start run'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function saveStep(runId: number, stepId: number, payload: StepSavePayload) {
    error.value = null
    try {
      return await $fetch<StepSaveResult>(`/api/runs/${runId}/steps/${stepId}`, {
        method: 'PATCH',
        body: payload,
        headers: authHeaders(),
      })
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to save step'
      throw e
    }
  }

  async function complete(runId: number) {
    loading.value = true
    error.value = null
    try {
      return await $fetch<CompleteRunResult>(`/api/runs/${runId}/complete`, {
        method: 'POST',
        headers: authHeaders(),
      })
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to complete run'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function cancel(runId: number) {
    loading.value = true
    error.value = null
    try {
      return await $fetch(`/api/runs/${runId}/cancel`, {
        method: 'POST',
        headers: authHeaders(),
      })
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to cancel run'
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
  function setStatus(s: string) { status.value = s; page.value = 1 }
  function setScope(s: 'mine' | 'all') { scope.value = s; page.value = 1 }
  function resetFilters() {
    page.value = 1
    search.value = ''
    searchField.value = ''
    sortBy.value = 'id'
    sortOrder.value = 'DESC'
    status.value = ''
    scope.value = 'mine'
  }

  return {
    runs, total, page, limit, search, searchField, sortBy, sortOrder, status, scope, loading, error,
    fetchMine, fetchOne, start, saveStep, complete, cancel,
    setPage, setLimit, setSearch, setSearchField, setSort, setStatus, setScope, resetFilters,
  }
})
