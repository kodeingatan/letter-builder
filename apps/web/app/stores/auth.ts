import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '~/shared/types/user'
import type { LoginPayload, RegisterPayload, AuthResponse, UpdateProfile, ChangePassword } from '~/shared/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<User | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const fullName = computed(() => user.value ? `${user.value.firstName} ${user.value.lastName}` : '')

  function setTokenCookie(t: string | null) {
    if (import.meta.client) {
      if (t) {
        document.cookie = `accessToken=${t}; path=/; max-age=86400; SameSite=Lax`
      } else {
        document.cookie = 'accessToken=; path=/; max-age=0'
      }
    }
  }

  function initFromStorage() {
    if (import.meta.client) {
      token.value = localStorage.getItem('accessToken')
      setTokenCookie(token.value)
      try {
        const raw = localStorage.getItem('user')
        user.value = raw ? JSON.parse(raw) : null
      } catch {
        user.value = null
      }
    }
  }

  function saveUserToStorage(userData: User | null) {
    if (import.meta.client) {
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData))
      } else {
        localStorage.removeItem('user')
      }
    }
  }

  async function login(payload: LoginPayload) {
    loading.value = true
    try {
      const response = await $fetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: payload,
      })
      token.value = response.accessToken
      user.value = response.user
      if (import.meta.client) {
        localStorage.setItem('accessToken', response.accessToken)
      }
      setTokenCookie(response.accessToken)
      saveUserToStorage(response.user)
      return response
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload) {
    loading.value = true
    try {
      const response = await $fetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: payload,
      })
      token.value = response.accessToken
      user.value = response.user
      if (import.meta.client) {
        localStorage.setItem('accessToken', response.accessToken)
      }
      setTokenCookie(response.accessToken)
      saveUserToStorage(response.user)
      return response
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    if (!token.value) return
    loading.value = true
    try {
      const response = await $fetch<User>('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      user.value = response
      saveUserToStorage(response)
      return response
    } catch {
      token.value = null
      user.value = null
      setTokenCookie(null)
      if (import.meta.client) {
        localStorage.removeItem('accessToken')
      }
      saveUserToStorage(null)
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    setTokenCookie(null)
    if (import.meta.client) {
      localStorage.removeItem('accessToken')
    }
    saveUserToStorage(null)
  }

  async function updateProfile(payload: UpdateProfile) {
    loading.value = true
    try {
      const response = await $fetch<User>('/api/auth/profile', {
        method: 'PATCH',
        body: payload,
        headers: { Authorization: `Bearer ${token.value}` },
      })
      user.value = response
      saveUserToStorage(response)
      return response
    } finally {
      loading.value = false
    }
  }

  async function changePassword(payload: ChangePassword) {
    loading.value = true
    try {
      await $fetch('/api/auth/password', {
        method: 'PATCH',
        body: payload,
        headers: { Authorization: `Bearer ${token.value}` },
      })
    } finally {
      loading.value = false
    }
  }

  initFromStorage()

  return { token, user, loading, isAuthenticated, fullName, login, register, fetchProfile, logout, updateProfile, changePassword, setTokenCookie }
})
