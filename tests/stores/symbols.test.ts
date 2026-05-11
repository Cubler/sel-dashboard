import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Symbol, SymbolValue } from '~/types/api'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockGetSymbols, mockGetSymbolValue } = vi.hoisted(() => ({
  mockGetSymbols: vi.fn(),
  mockGetSymbolValue: vi.fn(),
}))

vi.mock('~/services/apiService', () => ({
  apiService: {
    getSymbols: mockGetSymbols,
    getSymbolValue: mockGetSymbolValue,
    authenticate: vi.fn(),
    isTokenValid: vi.fn(() => true),
    clearToken: vi.fn(),
    setToken: vi.fn(),
  },
}))

vi.mock('~/services/storageService', () => ({
  storageService: {
    getToken: vi.fn(() => null),
    getTokenExpiry: vi.fn(() => null),
    getUsername: vi.fn(() => null),
    getServerUrl: vi.fn(() => null),
    setToken: vi.fn(),
    setTokenExpiry: vi.fn(),
    clearAuth: vi.fn(),
  },
}))

// ── Import after mocks ─────────────────────────────────────────────────────────

import { useSymbolsStore } from '~/stores/symbols'

// ── Helpers ────────────────────────────────────────────────────────────────────

const MOCK_SYMBOLS: Symbol[] = [
  { name: 'AnalogDeadband', type: 'INS', description: 'Deadband' },
  { name: 'MotorSpeed', type: 'INS', description: 'Speed' },
]

function makeValue(name: string, stVal = 42): SymbolValue {
  return {
    symbolName: name,
    stVal,
    t: new Date().toISOString(),
    lastUpdated: new Date(),
    rawData: { units: 'mV', q: { validity: 'good' } },
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useSymbolsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  // ── fetchSymbols ────────────────────────────────────────────────────────────

  describe('fetchSymbols', () => {
    it('populates the symbols array on success', async () => {
      mockGetSymbols.mockResolvedValue(MOCK_SYMBOLS)
      const store = useSymbolsStore()

      await store.fetchSymbols()

      expect(store.symbols).toEqual(MOCK_SYMBOLS)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('sets error and clears loading on failure', async () => {
      const err = { message: 'Network error', timestamp: new Date() }
      mockGetSymbols.mockRejectedValue(err)
      const store = useSymbolsStore()

      await store.fetchSymbols()

      expect(store.symbols).toHaveLength(0)
      expect(store.error).toEqual(err)
      expect(store.isLoading).toBe(false)
    })
  })

  // ── fetchAllValues ──────────────────────────────────────────────────────────

  describe('fetchAllValues', () => {
    it('updates symbolValues map for each symbol', async () => {
      mockGetSymbols.mockResolvedValue(MOCK_SYMBOLS)
      mockGetSymbolValue
        .mockResolvedValueOnce(makeValue('AnalogDeadband', 42))
        .mockResolvedValueOnce(makeValue('MotorSpeed', 1750))

      const store = useSymbolsStore()
      await store.fetchSymbols()
      await store.fetchAllValues()

      expect(store.symbolValues.get('AnalogDeadband')?.stVal).toBe(42)
      expect(store.symbolValues.get('MotorSpeed')?.stVal).toBe(1750)
    })

    it('sets isConnected true when at least one symbol succeeds', async () => {
      mockGetSymbols.mockResolvedValue(MOCK_SYMBOLS)
      mockGetSymbolValue
        .mockResolvedValueOnce(makeValue('AnalogDeadband'))
        .mockRejectedValueOnce(new Error('timeout'))

      const store = useSymbolsStore()
      await store.fetchSymbols()
      await store.fetchAllValues()

      expect(store.connectionStatus.isConnected).toBe(true)
    })

    it('sets isConnected false when all symbols fail', async () => {
      mockGetSymbols.mockResolvedValue(MOCK_SYMBOLS)
      mockGetSymbolValue.mockRejectedValue(new Error('all fail'))

      const store = useSymbolsStore()
      await store.fetchSymbols()
      await store.fetchAllValues()

      expect(store.connectionStatus.isConnected).toBe(false)
    })

    it('does nothing when symbols list is empty', async () => {
      const store = useSymbolsStore()
      await store.fetchAllValues()
      expect(mockGetSymbolValue).not.toHaveBeenCalled()
    })

    it('updates lastUpdated timestamp after polling', async () => {
      mockGetSymbols.mockResolvedValue([MOCK_SYMBOLS[0]!])
      mockGetSymbolValue.mockResolvedValue(makeValue('AnalogDeadband'))
      const store = useSymbolsStore()
      await store.fetchSymbols()

      expect(store.lastUpdated).toBeNull()
      await store.fetchAllValues()
      expect(store.lastUpdated).toBeInstanceOf(Date)
    })
  })

  // ── addToHistory ────────────────────────────────────────────────────────────

  describe('addToHistory', () => {
    it('creates a new history entry for a symbol', () => {
      const store = useSymbolsStore()
      const now = new Date()
      store.addToHistory('TestSymbol', 42, now)

      const history = store.symbolHistory.get('TestSymbol')
      expect(history).toBeDefined()
      expect(history?.dataPoints).toHaveLength(1)
      expect(history?.dataPoints[0]?.value).toBe(42)
    })

    it('accumulates multiple data points', () => {
      const store = useSymbolsStore()
      const now = new Date()
      store.addToHistory('TestSymbol', 10, now)
      store.addToHistory('TestSymbol', 20, now)
      store.addToHistory('TestSymbol', 30, now)

      expect(store.symbolHistory.get('TestSymbol')?.dataPoints).toHaveLength(3)
    })

    it('caps history at MAX_HISTORY_POINTS (50)', () => {
      const store = useSymbolsStore()
      const now = new Date()
      for (let i = 0; i < 55; i++) {
        store.addToHistory('TestSymbol', i, now)
      }
      const points = store.symbolHistory.get('TestSymbol')?.dataPoints
      expect(points!.length).toBeLessThanOrEqual(50)
    })
  })

  // ── clearData ───────────────────────────────────────────────────────────────

  describe('clearData', () => {
    it('resets all state to initial values', async () => {
      mockGetSymbols.mockResolvedValue(MOCK_SYMBOLS)
      mockGetSymbolValue.mockResolvedValue(makeValue('AnalogDeadband'))

      const store = useSymbolsStore()
      await store.fetchSymbols()
      await store.fetchAllValues()

      store.clearData()

      expect(store.symbols).toHaveLength(0)
      expect(store.symbolValues.size).toBe(0)
      expect(store.symbolHistory.size).toBe(0)
      expect(store.lastUpdated).toBeNull()
      expect(store.connectionStatus.isConnected).toBe(false)
    })
  })
})
