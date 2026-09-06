import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  DocumentDetail,
  DocumentListItem,
  QueryDocuments,
} from '~/shared/types/document'
import type { PaginatedResponse } from '~/shared/types/api'
import { useAuthStore } from '~/stores/auth'

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore().token}` }
}

export const useDocumentsStore = defineStore('documents', () => {
  const documents = ref<DocumentListItem[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)
  const search = ref('')
  const searchField = ref('')
  const sortBy = ref('id')
  const sortOrder = ref<'ASC' | 'DESC'>('DESC')
  const administrationId = ref<number | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(params?: Partial<QueryDocuments>) {
    loading.value = true
    error.value = null
    try {
      const query: QueryDocuments = {
        page: params?.page ?? page.value,
        limit: params?.limit ?? limit.value,
        search: params?.search ?? (search.value || undefined),
        searchField: params?.searchField ?? (searchField.value || undefined),
        sortBy: params?.sortBy ?? sortBy.value,
        sortOrder: params?.sortOrder ?? sortOrder.value,
        administrationId: params?.administrationId ?? (administrationId.value ?? undefined),
        createdBy: params?.createdBy,
        startDate: params?.startDate,
        endDate: params?.endDate,
      }
      const response = await $fetch<PaginatedResponse<DocumentListItem>>('/api/documents', {
        params: query as any,
        headers: authHeaders(),
      })
      documents.value = response.data
      total.value = response.total
      page.value = response.page
      limit.value = response.limit
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch documents'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number, metaOnly = false) {
    loading.value = true
    error.value = null
    try {
      return await $fetch<DocumentDetail>(`/api/documents/${id}`, {
        params: metaOnly ? { meta: '1' } : undefined,
        headers: authHeaders(),
      })
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to fetch document'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function reissue(id: number) {
    loading.value = true
    error.value = null
    try {
      return await $fetch<DocumentListItem>(`/api/documents/${id}/reissue`, {
        method: 'POST',
        headers: authHeaders(),
      })
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to re-issue document'
      throw e
    } finally {
      loading.value = false
    }
  }

  function htmlUrl(id: number) {
    return `/api/documents/${id}/html`
  }

  function pdfUrl(id: number) {
    return `/api/documents/${id}/pdf`
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
  function setAdministrationId(id: number | null) { administrationId.value = id; page.value = 1 }
  function resetFilters() {
    page.value = 1
    search.value = ''
    searchField.value = ''
    sortBy.value = 'id'
    sortOrder.value = 'DESC'
    administrationId.value = null
  }

  return {
    documents, total, page, limit, search, searchField, sortBy, sortOrder,
    administrationId, loading, error,
    fetchAll, fetchOne, reissue, htmlUrl, pdfUrl,
    setPage, setLimit, setSearch, setSearchField, setSort, setAdministrationId, resetFilters,
  }
})
