import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NavigationProjection } from '~/shared/types/navigation'
import { useAuthStore } from '~/stores/auth'

/**
 * Task 21 — Generated Menu projection store.
 * Poll-on-route-change freshness (no websockets v1): the layout refetches
 * on every route change; the refresh button forces a refetch. Keeps the
 * last-good projection on fetch errors so the sidebar never blanks.
 */
export const useNavigationStore = defineStore('navigation', () => {
  const projection = ref<NavigationProjection | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchedAt = ref<number | null>(null)

  const dataEntries = computed(() => projection.value?.data ?? [])
  const persuratanEntries = computed(() => projection.value?.persuratan ?? [])
  const hasData = computed(() => dataEntries.value.length > 0)
  const hasPersuratan = computed(() => persuratanEntries.value.length > 0)

  async function fetch(force = false) {
    if (loading.value && !force) return projection.value
    loading.value = true
    if (force) error.value = null
    try {
      const response = await $fetch<NavigationProjection>('/api/navigation', {
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      projection.value = response
      lastFetchedAt.value = Date.now()
      error.value = null
      return response
    } catch (e: any) {
      // Fallback to last-good cached projection + warning (REQ states).
      if (!projection.value) {
        error.value = e.data?.message || 'Failed to load navigation'
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    return fetch(true)
  }

  function reset() {
    projection.value = null
    error.value = null
    lastFetchedAt.value = null
  }

  return {
    projection,
    loading,
    error,
    lastFetchedAt,
    dataEntries,
    persuratanEntries,
    hasData,
    hasPersuratan,
    fetch,
    refresh,
    reset,
  }
})
