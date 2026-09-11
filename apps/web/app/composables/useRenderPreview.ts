import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import type { RenderPreviewPayload, RenderPreviewResponse, RenderWarning } from '~/shared/types/render'

function authHeaders() {
  return { Authorization: `Bearer ${useAuthStore().token}` }
}

/**
 * Shared preview caller for `POST /api/render/preview` .
 * Host panes (Tasks 13/15/16/18/19) debounce their own invocations;
 * this composable only tracks loading / html / warnings / error state
 * consumed by `DocumentPreview`.
 */
export function useRenderPreview() {
  const html = ref<string | null>(null)
  const warnings = ref<RenderWarning[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | null = null

  async function preview(payload: RenderPreviewPayload) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<RenderPreviewResponse>('/api/render/preview', {
        method: 'POST',
        body: payload,
        headers: authHeaders(),
      })
      html.value = response.html
      warnings.value = response.warnings ?? []
      return response
    } catch (e: any) {
      error.value = e.data?.message || 'Failed to render preview'
      html.value = null
      warnings.value = []
      throw e
    } finally {
      loading.value = false
    }
  }

  /** Debounced preview (callers pass 300–500ms; mirrors DataTable search). */
  function previewDebounced(payload: RenderPreviewPayload, waitMs = 400) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      void preview(payload)
    }, waitMs)
  }

  function reset() {
    html.value = null
    warnings.value = []
    error.value = null
    loading.value = false
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return { html, warnings, loading, error, preview, previewDebounced, reset }
}
