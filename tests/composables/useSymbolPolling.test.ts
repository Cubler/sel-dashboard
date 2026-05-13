import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    isTokenValid: vi.fn(() => false),
    authenticate: vi.fn(),
    clearToken: vi.fn(),
    getSymbols: vi.fn(() => Promise.resolve([])),
    getSymbolValue: vi.fn(),
  },
}))

vi.mock('~/services/apiService', () => ({ apiService: mockApi }))

// ── Import after mocks ─────────────────────────────────────────────────────────

import { useSymbolPolling } from '~/composables/useSymbolPolling'

// ── Shared localStorage stub ───────────────────────────────────────────────────

// Use a plain object store so tests can control individual key values
const store: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, val: string) => { store[key] = val }),
  removeItem: vi.fn((key: string) => { delete store[key] }),
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useSymbolPolling', () => {
  let polling: ReturnType<typeof useSymbolPolling>

  beforeEach(() => {
    vi.clearAllMocks()
    // Clear all stored keys
    Object.keys(store).forEach(k => delete store[k])

    polling = useSymbolPolling()

    // Reset module-level shared state between tests
    polling.isAuthenticated.value = false
    polling.username.value = ''
    polling.serverUrl.value = ''
    polling.authError.value = null
    polling.authLoading.value = false
    polling.symbols.value = []
    polling.symbolValues.clear()
    polling.symbolHistory.clear()
    polling.isLoading.value = false
    polling.fetchError.value = null
    polling.connectionStatus.value = { isConnected: false }
  })

  // ── init ───────────────────────────────────────────────────────────────────

  describe('init', () => {
    it('sets isAuthenticated when token is valid', () => {
      mockApi.isTokenValid.mockReturnValue(true)
      store['sel:username'] = 'testuser'
      store['sel:serverUrl'] = 'https://test'

      polling.init()

      expect(polling.isAuthenticated.value).toBe(true)
      expect(polling.username.value).toBe('testuser')
      expect(polling.serverUrl.value).toBe('https://test')
    })

    it('does not set isAuthenticated when token is invalid', () => {
      mockApi.isTokenValid.mockReturnValue(false)
      polling.init()
      expect(polling.isAuthenticated.value).toBe(false)
    })
  })

  // ── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('sets isAuthenticated and returns true on success', async () => {
      mockApi.authenticate.mockResolvedValue(true)

      const result = await polling.login({ serverUrl: 'https://test', username: 'u', password: 'p' })

      expect(result).toBe(true)
      expect(polling.isAuthenticated.value).toBe(true)
      expect(polling.username.value).toBe('u')
      expect(polling.serverUrl.value).toBe('https://test')
    })

    it('sets authError and returns false on failure', async () => {
      const err = { message: 'Bad credentials', timestamp: new Date() }
      mockApi.authenticate.mockRejectedValue(err)

      const result = await polling.login({ serverUrl: 'https://test', username: 'u', password: 'p' })

      expect(result).toBe(false)
      expect(polling.authError.value).toEqual(err)
      expect(polling.isAuthenticated.value).toBe(false)
    })

    it('sets authLoading to true during the request and false after', async () => {
      let loadingDuring = false
      mockApi.authenticate.mockImplementation(async () => {
        loadingDuring = polling.authLoading.value
        return true
      })

      await polling.login({ serverUrl: 'https://test', username: 'u', password: 'p' })

      expect(loadingDuring).toBe(true)
      expect(polling.authLoading.value).toBe(false)
    })

    it('clears a previous authError before each attempt', async () => {
      polling.authError.value = { message: 'old error', timestamp: new Date() }
      mockApi.authenticate.mockResolvedValue(true)

      await polling.login({ serverUrl: 'https://test', username: 'u', password: 'p' })

      expect(polling.authError.value).toBeNull()
    })
  })

  // ── logout ─────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('clears auth state and calls clearToken', () => {
      polling.isAuthenticated.value = true
      polling.username.value = 'testuser'
      polling.serverUrl.value = 'https://test'

      polling.logout()

      expect(polling.isAuthenticated.value).toBe(false)
      expect(polling.username.value).toBe('')
      expect(polling.serverUrl.value).toBe('')
      expect(mockApi.clearToken).toHaveBeenCalledOnce()
    })
  })

  // ── fetchSymbols ───────────────────────────────────────────────────────────

  describe('fetchSymbols', () => {
    it('populates symbols on success', async () => {
      const syms = [{ name: 'AnalogDeadband', type: 'INS', description: 'Test' }]
      mockApi.getSymbols.mockResolvedValue(syms)

      await polling.fetchSymbols()

      expect(polling.symbols.value).toEqual(syms)
      expect(polling.isLoading.value).toBe(false)
    })

    it('sets fetchError on failure', async () => {
      const err = { message: 'Network error', timestamp: new Date() }
      mockApi.getSymbols.mockRejectedValue(err)

      await polling.fetchSymbols()

      expect(polling.fetchError.value).toEqual(err)
      expect(polling.symbols.value).toHaveLength(0)
    })
  })

  // ── fetchAllValues ─────────────────────────────────────────────────────────

  describe('fetchAllValues', () => {
    it('does nothing when the symbol list is empty', async () => {
      await polling.fetchAllValues()
      expect(polling.connectionStatus.value.isConnected).toBe(false)
      expect(mockApi.getSymbolValue).not.toHaveBeenCalled()
    })

    it('updates symbolValues and connectionStatus after a successful poll', async () => {
      polling.symbols.value = [{ name: 'MotorSpeed', type: 'INS', description: '' }]
      const val = {
        symbolName: 'MotorSpeed',
        stVal: 1750,
        t: new Date().toISOString(),
        lastUpdated: new Date(),
        rawData: {},
      }
      mockApi.getSymbolValue.mockResolvedValue(val)

      await polling.fetchAllValues()

      expect(polling.connectionStatus.value.isConnected).toBe(true)
      expect(polling.symbolValues.get('MotorSpeed')).toEqual(val)
    })

    it('marks disconnected when all symbols fail', async () => {
      polling.symbols.value = [{ name: 'MotorSpeed', type: 'INS', description: '' }]
      mockApi.getSymbolValue.mockRejectedValue(new Error('timeout'))

      await polling.fetchAllValues()

      expect(polling.connectionStatus.value.isConnected).toBe(false)
    })

    it('stays connected when at least one symbol succeeds (partial failure)', async () => {
      polling.symbols.value = [
        { name: 'MotorSpeed', type: 'INS', description: '' },
        { name: 'FlowRate', type: 'INS', description: '' },
      ]
      const val = { symbolName: 'MotorSpeed', stVal: 1750, t: '', lastUpdated: new Date(), rawData: {} }
      mockApi.getSymbolValue
        .mockResolvedValueOnce(val)
        .mockRejectedValueOnce(new Error('timeout'))

      await polling.fetchAllValues()

      expect(polling.connectionStatus.value.isConnected).toBe(true)
    })
  })

  // ── clearData ──────────────────────────────────────────────────────────────

  describe('clearData', () => {
    it('resets all symbol state to initial values', () => {
      polling.symbols.value = [{ name: 'Test', type: 'INS', description: '' }]
      polling.fetchError.value = { message: 'err', timestamp: new Date() }
      polling.connectionStatus.value = { isConnected: true }

      polling.clearData()

      expect(polling.symbols.value).toHaveLength(0)
      expect(polling.symbolValues.size).toBe(0)
      expect(polling.symbolHistory.size).toBe(0)
      expect(polling.fetchError.value).toBeNull()
      expect(polling.connectionStatus.value.isConnected).toBe(false)
    })
  })
})
