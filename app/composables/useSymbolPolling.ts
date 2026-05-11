import { reactive, ref } from 'vue'
import { apiService } from '~/services/apiService'
import type {
  ApiError,
  AuthCredentials,
  ConnectionStatus,
  PollingInterval,
  Symbol,
  SymbolHistory,
  SymbolHistoryPoint,
  SymbolValue,
} from '~/types/api'

const MAX_HISTORY_POINTS = 50
const MAX_HISTORY_MS = 5 * 60 * 1_000

// Module-level shared state — all callers share the same refs (singleton pattern)
const isAuthenticated = ref(false)
const username = ref('')
const serverUrl = ref('')
const authError = ref<ApiError | null>(null)
const authLoading = ref(false)

const symbols = ref<Symbol[]>([])
const symbolValues = reactive(new Map<string, SymbolValue>())
const symbolHistory = reactive(new Map<string, SymbolHistory>())
const isLoading = ref(false)
const fetchError = ref<ApiError | null>(null)
const lastUpdated = ref<Date | null>(null)
const connectionStatus = ref<ConnectionStatus>({ isConnected: false })
const pollingInterval = ref<PollingInterval>(2000)

export function useSymbolPolling() {
  function init(): void {
    if (apiService.isTokenValid()) {
      isAuthenticated.value = true
      username.value = localStorage.getItem('sel:username') ?? ''
      serverUrl.value = localStorage.getItem('sel:serverUrl') ?? ''
    }
  }

  async function login(credentials: AuthCredentials): Promise<boolean> {
    authLoading.value = true
    authError.value = null
    try {
      await apiService.authenticate(credentials)
      isAuthenticated.value = true
      username.value = credentials.username
      serverUrl.value = credentials.serverUrl
      return true
    }
    catch (err) {
      authError.value = err as ApiError
      return false
    }
    finally {
      authLoading.value = false
    }
  }

  function logout(): void {
    apiService.clearToken()
    isAuthenticated.value = false
    username.value = ''
    serverUrl.value = ''
    authError.value = null
  }

  async function fetchSymbols(): Promise<void> {
    isLoading.value = true
    fetchError.value = null
    try {
      symbols.value = await apiService.getSymbols({ sort: 'asc', limit: 50 })
    }
    catch (err) {
      fetchError.value = err as ApiError
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchAllValues(): Promise<void> {
    if (symbols.value.length === 0) return

    const results = await Promise.allSettled(
      symbols.value.map(s => apiService.getSymbolValue(s.name)),
    )

    const now = new Date()
    let successCount = 0

    results.forEach((result, i) => {
      const symbolName = symbols.value[i]!.name
      if (result.status === 'fulfilled') {
        symbolValues.set(symbolName, result.value)
        addToHistory(symbolName, result.value.stVal, now)
        successCount++
      }
    })

    lastUpdated.value = now
    connectionStatus.value = { isConnected: successCount > 0, lastConnection: now }
  }

  function addToHistory(symbolName: string, value: number, timestamp: Date): void {
    const existing: SymbolHistory = symbolHistory.get(symbolName) ?? {
      symbolName,
      dataPoints: [],
      maxPoints: MAX_HISTORY_POINTS,
    }

    const cutoff = Date.now() - MAX_HISTORY_MS
    const dataPoints: SymbolHistoryPoint[] = existing.dataPoints.filter(
      p => p.timestamp.getTime() > cutoff,
    )

    dataPoints.push({ value, timestamp, formattedTime: timestamp.toLocaleTimeString() })

    if (dataPoints.length > MAX_HISTORY_POINTS) {
      dataPoints.splice(0, dataPoints.length - MAX_HISTORY_POINTS)
    }

    symbolHistory.set(symbolName, { ...existing, dataPoints })
  }

  function clearData(): void {
    symbols.value = []
    symbolValues.clear()
    symbolHistory.clear()
    lastUpdated.value = null
    fetchError.value = null
    connectionStatus.value = { isConnected: false }
  }

  return {
    isAuthenticated,
    username,
    serverUrl,
    authError,
    authLoading,
    symbols,
    symbolValues,
    symbolHistory,
    isLoading,
    fetchError,
    lastUpdated,
    connectionStatus,
    pollingInterval,
    init,
    login,
    logout,
    fetchSymbols,
    fetchAllValues,
    clearData,
  }
}
