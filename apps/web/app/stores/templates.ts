import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  DocTemplate,
  TemplateDetail,
  TemplateListItem,
  TemplateVersion,
  CreateTemplate,
  QueryTemplate,
  UpdateTemplate,
  TreeValidationResult,
} from '~/shared/types/template'
import type { PaginatedResponse } from '~/shared/types/api'
import { useAuthStore } from '~/stores/auth'

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore().token}` }
}

export const useTemplatesStore = defineStore('templates', () => {
  const templates = ref<TemplateListItem[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)
  const search = ref('')
  const searchField = ref('')
  const sortBy = ref('id')
  const sortOrder = ref<'ASC' | 'DESC'>('DESC')
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(params?: Partial<QueryTemplate>) {
    loading.value = true
    error.value = null
    try {
      const query: QueryTemplate = {
        page: params?.page ?? page.value,
        limit: params?.limit ?? limit.value,
        search: params?.search ?? (search.value || undefined),
        searchField: params?.searchField ?? (searchField.value || undefined),
        sortBy: params?.sortBy ?? sortBy.value,
        sortOrder: params?.sortOrder ?? sortOrder.value,
      }
      const response = await $fetch<PaginatedResponse<TemplateListItem>>('/api/templates', {
        params: query as any,
        headers: authHeaders(),
      })
      templates.value = response.data
      total.value = response.total
      page.value = response.page
      limit.value = response.limit
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch templates'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number) {
    loading.value = true
    error.value = null
    try {
      return await $fetch<TemplateDetail>(`/api/templates/${id}`, { headers: authHeaders() })
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch template'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchVersion(id: number, version: number) {
    try {
      return await $fetch<TemplateVersion>(`/api/templates/${id}/versions/${version}`, {
        headers: authHeaders(),
      })
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch version'
      throw e
    }
  }

  async function create(data: CreateTemplate) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<DocTemplate>(`/api/templates`, {
        method: 'POST',
        body: data,
        headers: authHeaders(),
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to create template'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, data: UpdateTemplate) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<TemplateDetail>(`/api/templates/${id}`, {
        method: 'PUT',
        body: data,
        headers: authHeaders(),
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to update template'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function publish(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<TemplateDetail>(`/api/templates/${id}/publish`, {
        method: 'POST',
        headers: authHeaders(),
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to publish template'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function rollback(id: number, version: number) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<TemplateDetail>(`/api/templates/${id}/rollback/${version}`, {
        method: 'POST',
        headers: authHeaders(),
      })
      await fetchAll()
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to roll back template'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    loading.value = true
    error.value = null
    try {
      await $fetch(`/api/templates/${id}`, { method: 'DELETE', headers: authHeaders() })
      await fetchAll()
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to delete template'
      throw e
    } finally {
      loading.value = false
    }
  }

  /** Live editor feedback  validate a candidate tree without saving. */
  async function validateTree(id: number, content: unknown) {
    try {
      return await $fetch<TreeValidationResult>(`/api/templates/${id}/validate-tree`, {
        method: 'POST',
        body: { content },
        headers: authHeaders(),
      })
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to validate tree'
      throw e
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
    templates, total, page, limit, search, searchField, sortBy, sortOrder, loading, error,
    fetchAll, fetchOne, fetchVersion, create, update, publish, rollback, remove, validateTree,
    setPage, setLimit, setSearch, setSearchField, setSort, resetFilters,
  }
})
