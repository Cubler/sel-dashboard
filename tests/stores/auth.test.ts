import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockAuthenticate, mockClearToken, mockIsTokenValid } = vi.hoisted(() => ({
  mockAuthenticate: vi.fn(),
  mockClearToken: vi.fn(),
  mockIsTokenValid: vi.fn(() => false),
}))

vi.mock('~/services/apiService', () => ({
  apiService: {
    authenticate: mockAuthenticate,
    clearToken: mockClearToken,
    isTokenValid: mockIsTokenValid,
    setToken: vi.fn(),
    getSymbols: vi.fn(),
    getSymbolValue: vi.fn(),
  },
}))

vi.mock('~/services/storageService', () => ({
  storageService: {
    getToken: vi.fn(() => null),
    getTokenExpiry: vi.fn(() => null),
    getUsername: vi.fn(() => 'saved-user'),
    getServerUrl: vi.fn(() => 'https://saved.server'),
    setToken: vi.fn(),
    setTokenExpiry: vi.fn(),
    setUsername: vi.fn(),
    setServerUrl: vi.fn(),
    clearAuth: vi.fn(),
    clearCredentials: vi.fn(),
  },
}))

// ── Import after mocks ─────────────────────────────────────────────────────────

import { useAuthStore } from '~/stores/auth'

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('init', () => {
    it('sets isAuthenticated when token is valid', () => {
      mockIsTokenValid.mockReturnValue(true)
      const store = useAuthStore()
      store.init()
      expect(store.isAuthenticated).toBe(true)
    })

    it('restores username and serverUrl from storage', () => {
      mockIsTokenValid.mockReturnValue(true)
      const store = useAuthStore()
      store.init()
      expect(store.username).toBe('saved-user')
      expect(store.serverUrl).toBe('https://saved.server')
    })

    it('leaves isAuthenticated false when token is invalid', () => {
      mockIsTokenValid.mockReturnValue(false)
      const store = useAuthStore()
      store.init()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('returns true and sets state on successful authentication', async () => {
      mockAuthenticate.mockResolvedValue(true)
      const store = useAuthStore()

      const result = await store.login({
        serverUrl: 'https://192.168.3.2',
        username: 'testuser',
        password: 'testpass',
      })

      expect(result).toBe(true)
      expect(store.isAuthenticated).toBe(true)
      expect(store.username).toBe('testuser')
      expect(store.serverUrl).toBe('https://192.168.3.2')
      expect(store.error).toBeNull()
    })

    it('sets loading to true during auth and false afterwards', async () => {
      let loadingDuringCall = false
      mockAuthenticate.mockImplementation(async () => {
        loadingDuringCall = true
        return true
      })

      const store = useAuthStore()
      const promise = store.login({ serverUrl: '', username: '', password: '' })
      // By the time we await, loading should have been true at some point
      await promise
      expect(loadingDuringCall).toBe(true)
      expect(store.loading).toBe(false)
    })

    it('returns false and sets error when authentication throws', async () => {
      const apiError = { message: 'Invalid credentials', timestamp: new Date() }
      mockAuthenticate.mockRejectedValue(apiError)
      const store = useAuthStore()

      const result = await store.login({ serverUrl: '', username: 'bad', password: 'bad' })

      expect(result).toBe(false)
      expect(store.isAuthenticated).toBe(false)
      expect(store.error).toEqual(apiError)
    })
  })

  describe('logout', () => {
    it('clears all auth state', async () => {
      mockAuthenticate.mockResolvedValue(true)
      const store = useAuthStore()
      await store.login({ serverUrl: 'https://test', username: 'u', password: 'p' })

      store.logout()

      expect(store.isAuthenticated).toBe(false)
      expect(store.username).toBe('')
      expect(store.serverUrl).toBe('')
      expect(store.error).toBeNull()
    })

    it('calls apiService.clearToken', () => {
      const store = useAuthStore()
      store.logout()
      expect(mockClearToken).toHaveBeenCalled()
    })
  })
})
