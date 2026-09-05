import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

export interface BindingPlacementGroup {
  placementId: string
  componentId: number
  componentName: string
  bindings: BindingRow[]
  unboundCount: number
}

export interface BindingRow {
  id?: number
  placementId: string
  componentId: number
  requirementName: string
  requirementType: string
  source: string
  sourceRef: string | null
  literalValue: string | null
  expression: string | null
  status: string
  staleReason?: string
}

export interface BindingSnapshot {
  placements: BindingPlacementGroup[]
  totalBindings: number
  totalUnbound: number
}

export interface PreviewSlot {
  placementId: string
  requirementName: string
  source: string
  resolvedValue: unknown
  error?: string
}

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore().token}` }
}

export function useTemplateBindings(templateId: Ref<number>) {
  const bindings = ref<BindingSnapshot | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const previewing = ref(false)
  const error = ref<string | null>(null)
  const previewSlots = ref<PreviewSlot[]>([])

  const totalUnbound = computed(() => bindings.value?.totalUnbound ?? 0)
  const placementGroups = computed(() => bindings.value?.placements ?? [])

  async function fetchBindings() {
    if (!templateId.value) return
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<BindingSnapshot>(`/api/templates/${templateId.value}/bindings`, {
        headers: authHeaders(),
      })
      bindings.value = data
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to load bindings'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function saveBindings(bindingRows: BindingRow[]) {
    if (!templateId.value) return
    saving.value = true
    error.value = null
    try {
      const result = await $fetch<{ saved: number; stale: string[] }>(`/api/templates/${templateId.value}/bindings`, {
        method: 'PUT',
        body: { bindings: bindingRows },
        headers: authHeaders(),
      })
      await fetchBindings()
      return result
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to save bindings'
      throw e
    } finally {
      saving.value = false
    }
  }

  async function removeBinding(bindingId: number) {
    if (!templateId.value) return
    try {
      await $fetch(`/api/templates/${templateId.value}/bindings/${bindingId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      await fetchBindings()
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to remove binding'
      throw e
    }
  }

  async function previewBindings(sampleContext: Record<string, unknown> = {}) {
    if (!templateId.value) return
    previewing.value = true
    error.value = null
    try {
      const data = await $fetch<{ slots: PreviewSlot[] }>(`/api/templates/${templateId.value}/bindings/preview`, {
        method: 'POST',
        body: { sampleContext },
        headers: authHeaders(),
      })
      previewSlots.value = data.slots
      return data.slots
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to preview bindings'
      throw e
    } finally {
      previewing.value = false
    }
  }

  return {
    bindings,
    loading,
    saving,
    previewing,
    error,
    previewSlots,
    totalUnbound,
    placementGroups,
    fetchBindings,
    saveBindings,
    removeBinding,
    previewBindings,
  }
}
