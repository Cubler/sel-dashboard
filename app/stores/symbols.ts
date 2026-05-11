import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { apiService } from '~/services/apiService'
import type {
  ApiError,
  ConnectionStatus,
  PollingInterval,
  Symbol,
  SymbolHistory,
  SymbolHistoryPoint,
  SymbolValue,
} from '~/types/api'

const MAX_HISTORY_POINTS = 50
const MAX_HISTORY_MS = 5 * 60 * 1_000 // 5-minute rolling window

export const useSymbolsStore = defineStore('symbols', () => {
  const symbols = ref<Symbol[]>([])

  // reactive(Map) lets Vue 3 track .set() / .delete() calls without reassignment
  const symbolValues = reactive(new Map<string, SymbolValue>())
  const symbolHistory = reactive(new Map<string, SymbolHistory>())

  const isLoading = ref(false)
  const error = ref<ApiError | null>(null)
  const lastUpdated = ref<Date | null>(null)
  const connectionStatus = ref<ConnectionStatus>({ isConnected: false })
  const pollingInterval = ref<PollingInterval>(2000)

  // ── Data fetching ────────────────────────────────────────────────────────────

  async function fetchSymbols(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      symbols.value = await apiService.getSymbols({ sort: 'asc', limit: 50 })
    }
    catch (err) {
      error.value = err as ApiError
    }
    finally {
      isLoading.value = false
    }
  }

  // Promise.allSettled — one failing symbol must NOT cancel the rest
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
      // Rejected: leave the previous value in the map; lastUpdated won't refresh for this symbol
    })

    lastUpdated.value = now
    connectionStatus.value = {
      isConnected: successCount > 0,
      lastConnection: now,
    }
  }

  // ── History ──────────────────────────────────────────────────────────────────

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

    dataPoints.push({
      value,
      timestamp,
      formattedTime: timestamp.toLocaleTimeString(),
    })

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
    error.value = null
    connectionStatus.value = { isConnected: false }
  }

  return {
    // State
    symbols,
    symbolValues,
    symbolHistory,
    isLoading,
    error,
    lastUpdated,
    connectionStatus,
    pollingInterval,
    // Actions
    fetchSymbols,
    fetchAllValues,
    addToHistory,
    clearData,
  }
})
