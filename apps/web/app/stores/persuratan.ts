import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  DocComponent, DocTemplate, Administration, Document,
  CreateDocComponent, CreateDocTemplate, CreateAdministration, RunWizardInput,
} from '~/shared/types/persuratan'
import type { PaginatedResponse } from '~/shared/types/api'
import { useAuthStore } from '~/stores/auth'
import { getErrorMessage } from '~/utils/error'

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore().token}` }
}

async function getList<T>(url: string, params?: Record<string, unknown>) {
  return $fetch<PaginatedResponse<T>>(url, { params: params as never, headers: authHeaders() })
}

export const usePersuratanStore = defineStore('persuratan', () => {
  const components = ref<DocComponent[]>([])
  const templates = ref<DocTemplate[]>([])
  const administrations = ref<Administration[]>([])
  const runs = ref<Document[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchComponents(search?: string) {
    loading.value = true
    try {
      const res = await getList<DocComponent>('/api/doc-components', search ? { search } : undefined)
      components.value = res.data
      return res
    } catch (e) {
      error.value = getErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createComponent(data: CreateDocComponent) {
    return $fetch<DocComponent>('/api/doc-components', { method: 'POST', body: data, headers: authHeaders() })
  }

  async function updateComponent(id: number, data: Partial<CreateDocComponent>) {
    return $fetch<DocComponent>(`/api/doc-components/${id}`, { method: 'PUT', body: data, headers: authHeaders() })
  }

  async function removeComponent(id: number) {
    await $fetch(`/api/doc-components/${id}`, { method: 'DELETE', headers: authHeaders() })
    await fetchComponents()
  }

  async function fetchTemplates(search?: string) {
    loading.value = true
    try {
      const res = await getList<DocTemplate>('/api/doc-templates', search ? { search } : undefined)
      templates.value = res.data
      return res
    } catch (e) {
      error.value = getErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchTemplate(id: number) {
    return $fetch<DocTemplate>(`/api/doc-templates/${id}`, { headers: authHeaders() })
  }

  async function createTemplate(data: CreateDocTemplate) {
    return $fetch<DocTemplate>('/api/doc-templates', { method: 'POST', body: data, headers: authHeaders() })
  }

  async function updateTemplate(id: number, data: Record<string, unknown>) {
    return $fetch<DocTemplate>(`/api/doc-templates/${id}`, { method: 'PUT', body: data, headers: authHeaders() })
  }

  async function removeTemplate(id: number) {
    await $fetch(`/api/doc-templates/${id}`, { method: 'DELETE', headers: authHeaders() })
    await fetchTemplates()
  }

  async function fetchFormSchema(id: number) {
    return $fetch<{ template_id: number; version: number; requirements: Array<{ path: string; scoped: boolean }>; scoped: string[] }>(
      `/api/doc-templates/${id}/form`, { headers: authHeaders() },
    )
  }

  async function previewTemplatePdf(id: number, data: Record<string, unknown>) {
    return $fetch<{ url: string }>(`/api/doc-templates/${id}/preview-pdf`, {
      method: 'POST', body: { data }, headers: authHeaders(),
    })
  }

  async function fetchAdministrations(search?: string) {
    loading.value = true
    try {
      const res = await getList<Administration>('/api/administrations', search ? { search } : undefined)
      administrations.value = res.data
      return res
    } catch (e) {
      error.value = getErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchAdministration(id: number) {
    return $fetch<Administration>(`/api/administrations/${id}`, { headers: authHeaders() })
  }

  async function createAdministration(data: CreateAdministration) {
    return $fetch<Administration>('/api/administrations', { method: 'POST', body: data, headers: authHeaders() })
  }

  async function updateAdministration(id: number, data: Record<string, unknown>) {
    return $fetch<Administration>(`/api/administrations/${id}`, { method: 'PUT', body: data, headers: authHeaders() })
  }

  async function removeAdministration(id: number) {
    await $fetch(`/api/administrations/${id}`, { method: 'DELETE', headers: authHeaders() })
    await fetchAdministrations()
  }

  async function fetchRuns(adminId: number) {
    const res = await getList<Document>(`/api/administrations/${adminId}/runs`)
    runs.value = res.data
    return res
  }

  async function executeRun(adminId: number, input: RunWizardInput) {
    return $fetch<{ document: Document; html: string; warnings: string[]; pdfError: string | null }>(
      `/api/administrations/${adminId}/runs`, { method: 'POST', body: input, headers: authHeaders() },
    )
  }

  async function cancelRun(id: number) {
    return $fetch<Document>(`/api/documents/${id}`, { method: 'DELETE', headers: authHeaders() })
  }

  return {
    components, templates, administrations, runs, loading, error,
    fetchComponents, createComponent, updateComponent, removeComponent,
    fetchTemplates, fetchTemplate, createTemplate, updateTemplate, removeTemplate,
    fetchFormSchema, previewTemplatePdf,
    fetchAdministrations, fetchAdministration, createAdministration, updateAdministration, removeAdministration,
    fetchRuns, executeRun, cancelRun,
  }
})
