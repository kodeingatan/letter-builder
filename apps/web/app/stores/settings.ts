import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

interface Setting {
  id: number
  key: string
  value: string
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Record<string, string>>({})

  const appName = computed(() => settings.value['app_name'] || 'Admin Panel')
  const appDescription = computed(() => settings.value['app_description'] || '')
  const appFavicon = computed(() => settings.value['app_favicon'] || '')
  const loginBgGradient = computed(() => settings.value['login_bg_gradient'] || '#1e40af,#3b82f6,#6366f1')
  const loginBgImage = computed(() => settings.value['login_bg_image'] || '')
  const loading = ref(false)

  function getGradientColors(): string[] {
    return loginBgGradient.value.split(',').map(c => c.trim())
  }

  function getMimeType(url: string): string {
    const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() ?? ''
    const mimeMap: Record<string, string> = {
      svg: 'image/svg+xml',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      ico: 'image/x-icon',
    }
    return mimeMap[ext] ?? 'image/svg+xml'
  }

  function updateHtmlMeta() {
    if (import.meta.client) {
      if (appName.value) document.title = appName.value
      if (appFavicon.value) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
        if (!link) {
          link = document.createElement('link')
          link.rel = 'icon'
          document.head.appendChild(link)
        }
        link.href = appFavicon.value
        link.type = getMimeType(appFavicon.value)
      }
    }
  }

  async function fetchSettings(): Promise<Record<string, string> | null> {
    loading.value = true
    try {
      const response = await $fetch<Setting[]>('/api/settings')
      const map: Record<string, string> = {}
      response.forEach((s) => { map[s.key] = s.value })
      settings.value = map
      updateHtmlMeta()
      return map
    } catch {
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateSettings(items: { key: string; value: string }[]) {
    loading.value = true
    try {
      const response = await $fetch<Setting[]>('/api/settings', {
        method: 'PUT',
        body: { settings: items },
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      const map: Record<string, string> = {}
      response.forEach((s) => { map[s.key] = s.value })
      settings.value = map
      updateHtmlMeta()
      return response
    } finally {
      loading.value = false
    }
  }

  async function uploadFile(file: File): Promise<string | null> {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await $fetch<string>('/api/settings/upload', {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${useAuthStore().token}` },
      })
      return response
    } catch {
      return null
    }
  }

  return { settings, appName, appDescription, appFavicon, loginBgGradient, loginBgImage, loading, getGradientColors, updateHtmlMeta, fetchSettings, updateSettings, uploadFile }
})
