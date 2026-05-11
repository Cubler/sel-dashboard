import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService } from '~/services/apiService'
import { storageService } from '~/services/storageService'
import type { ApiError, AuthCredentials } from '~/types/api'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const username = ref('')
  const serverUrl = ref('')
  const error = ref<ApiError | null>(null)
  const loading = ref(false)

  // Called by the client plugin on app start to restore a persisted session
  function init() {
    if (apiService.isTokenValid()) {
      isAuthenticated.value = true
      username.value = storageService.getUsername() ?? ''
      serverUrl.value = storageService.getServerUrl() ?? ''
    }
  }

  async function login(credentials: AuthCredentials): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await apiService.authenticate(credentials)
      isAuthenticated.value = true
      username.value = credentials.username
      serverUrl.value = credentials.serverUrl
      return true
    }
    catch (err) {
      error.value = err as ApiError
      return false
    }
    finally {
      loading.value = false
    }
  }

  function logout() {
    apiService.clearToken()
    isAuthenticated.value = false
    username.value = ''
    serverUrl.value = ''
    error.value = null
  }

  return { isAuthenticated, username, serverUrl, error, loading, init, login, logout }
})
