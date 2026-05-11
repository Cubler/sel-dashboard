<template>
  <div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">

    <!-- App bar -->
    <header class="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
          Industrial Data Monitor
        </h1>
        <UserMenu />
      </div>
    </header>

    <!-- Connection status bar -->
    <div class="border-b border-gray-200 bg-gray-100 px-4 py-2 dark:border-gray-700 dark:bg-gray-800/60">
      <div class="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-3 text-sm">
          <ConnectionIndicator :status="connectionStatus" />
          <span class="text-gray-300 dark:text-gray-600">|</span>
          <span class="text-gray-600 dark:text-gray-400">User: {{ username }}</span>
          <span v-if="serverUrl" class="text-gray-600 dark:text-gray-400">
            Server: {{ displayServer }}
          </span>
        </div>

        <div class="flex items-center gap-2 text-sm">
          <button
            class="rounded px-2 py-1 text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-700"
            :disabled="isLoading"
            @click="fetchAllValues()"
          >
            Refresh
          </button>
          <button
            class="rounded px-2 py-1 font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-900/20"
            @click="handleLogout"
          >
            Logout
          </button>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <main class="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-5">

      <!-- Fetch error banner -->
      <div
        v-if="fetchError"
        role="alert"
        class="mb-4 flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
      >
        <span>{{ fetchError.message }}</span>
        <button class="shrink-0 font-medium underline" @click="dismissError">Dismiss</button>
      </div>

      <!-- Loading spinner -->
      <div
        v-if="isLoading"
        role="status"
        aria-label="Loading symbols"
        class="flex justify-center py-16"
      >
        <svg class="h-8 w-8 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>

      <template v-else>
        <!-- Polling controls -->
        <div class="mb-4 flex items-center justify-end gap-2">
          <button
            :class="isPolling
              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
              : 'bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500'"
            class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="isPolling ? stop() : start()"
          >
            {{ isPolling ? 'Stop Polling' : 'Start Polling' }}
          </button>
          <select
            :value="pollingInterval"
            aria-label="Polling interval"
            class="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
            @change="handleIntervalChange(Number(($event.target as HTMLSelectElement).value))"
          >
            <option :value="1000">1s</option>
            <option :value="2000">2s</option>
            <option :value="5000">5s</option>
            <option :value="10000">10s</option>
          </select>
        </div>

        <!-- Symbol table -->
        <SymbolTable
          :symbols="symbols"
          :symbol-values="symbolValues"
          @select="selectedSymbol = $event"
        />
      </template>
    </main>

    <SymbolDetailModal
      v-if="selectedSymbol"
      :symbol-name="selectedSymbol"
      :symbols="symbols"
      :symbol-values="symbolValues"
      :symbol-history="symbolHistory"
      @close="selectedSymbol = null"
    />

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePreferencesStore } from '~/stores/preferences'
import { useSymbolPolling } from '~/composables/useSymbolPolling'
import { usePolling } from '~/composables/usePolling'
import type { PollingInterval } from '~/types/api'

const {
  username, serverUrl, symbols, symbolValues, symbolHistory,
  connectionStatus, isLoading, fetchError, pollingInterval,
  fetchSymbols, fetchAllValues, clearData, logout,
} = useSymbolPolling()

const prefs = usePreferencesStore()
const router = useRouter()

const selectedSymbol = ref<string | null>(null)

const displayServer = computed(() => {
  try { return new URL(serverUrl.value).hostname }
  catch { return serverUrl.value }
})

function dismissError() {
  fetchError.value = null
}

// ── Polling ───────────────────────────────────────────────────────────────────

const { isPolling, start, stop } = usePolling(fetchAllValues, pollingInterval)

function handleIntervalChange(ms: number) {
  pollingInterval.value = ms as PollingInterval
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  await fetchSymbols()
  if (symbols.value.length > 0) {
    await fetchAllValues()
    if (prefs.autoStartPolling) start()
  }
})

// ── Auth ──────────────────────────────────────────────────────────────────────

function handleLogout() {
  stop()
  clearData()
  logout()
  router.push('/login')
}
</script>
