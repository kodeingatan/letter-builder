import axios from 'axios'
import { useAuthStore } from '~/stores/auth'

export function useApi() {
  const authStore = useAuthStore()

  const api = axios.create({
    baseURL: '/api',
  })

  api.interceptors.request.use((config) => {
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  })

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        authStore.logout()
        navigateTo('/login')
      }
      if (error.response?.status === 403 && import.meta.client) {
        window.dispatchEvent(
          new CustomEvent('rbac-denied', {
            detail: { message: error.response?.data?.message || 'Access denied' },
          })
        )
      }
      return Promise.reject(error)
    },
  )

  return api
}
