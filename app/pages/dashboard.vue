<template>
  <div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">

    <!-- App bar -->
    <header class="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
          Industrial Data Monitor
        </h1>
        <!-- Phase 7: UserMenu / Settings here -->
      </div>
    </header>

    <!-- Connection status bar -->
    <div class="border-b border-gray-200 bg-gray-100 px-4 py-2 dark:border-gray-700 dark:bg-gray-800/60">
      <div class="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-3 text-sm">
          <ConnectionIndicator
            :status="store.connectionStatus"
            :last-updated="store.lastUpdated"
          />
          <span class="text-gray-300 dark:text-gray-600">|</span>
          <span class="text-gray-600 dark:text-gray-400">User: {{ auth.username }}</span>
          <span v-if="auth.serverUrl" class="text-gray-600 dark:text-gray-400">
            Server: {{ displayServer }}
          </span>
        </div>

        <div class="flex items-center gap-2 text-sm">
          <button
            class="rounded px-2 py-1 text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-700"
            :disabled="store.isLoading"
            @click="store.fetchAllValues()"
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
        v-if="store.error"
        role="alert"
        class="mb-4 flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
      >
        <span>{{ store.error.message }}</span>
        <button
          class="shrink-0 font-medium underline"
          @click="store.error = null"
        >Dismiss</button>
      </div>

      <!-- Initial loading skeleton -->
      <div
        v-if="store.isLoading"
        class="flex items-center justify-center py-24 text-gray-400 dark:text-gray-500"
        role="status"
        aria-live="polite"
      >
        <svg class="mr-3 h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Loading symbols…
      </div>

      <template v-else>
        <!-- Polling controls row -->
        <div class="mb-4 flex items-center justify-end">
          <PollingControls
            :is-polling="isPolling"
            :interval="store.pollingInterval"
            @start="handleStartPolling"
            @stop="handleStopPolling"
            @change-interval="handleIntervalChange"
          />
        </div>

        <!-- Symbol table -->
        <SymbolTable
          :symbols="store.symbols"
          :symbol-values="store.symbolValues"
          @select="selectedSymbol = $event"
        />
      </template>
    </main>

    <!-- Phase 6: SymbolDetailView modal will be inserted here -->
    <Teleport to="body">
      <div v-if="selectedSymbol" aria-hidden="true" />
      <!-- SymbolDetailView :symbol-name="selectedSymbol" @close="selectedSymbol = null" -->
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import { useSymbolsStore } from '~/stores/symbols'
import { usePolling } from '~/composables/usePolling'
import type { PollingInterval } from '~/types/api'

const auth = useAuthStore()
const store = useSymbolsStore()
const router = useRouter()

const selectedSymbol = ref<string | null>(null)

const displayServer = computed(() => {
  try { return new URL(auth.serverUrl).hostname }
  catch { return auth.serverUrl }
})

// ── Polling ───────────────────────────────────────────────────────────────────

// storeToRefs keeps pollingInterval reactive so usePolling's watch can restart on change
const { pollingInterval } = storeToRefs(store)
const { isPolling, start, stop } = usePolling(store.fetchAllValues, pollingInterval)

function handleStartPolling() {
  start()
}

function handleStopPolling() {
  stop()
}

function handleIntervalChange(ms: number) {
  store.pollingInterval = ms as PollingInterval
  // The watch inside usePolling restarts the timer automatically
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  await store.fetchSymbols()
  if (store.symbols.length > 0) {
    await store.fetchAllValues() // populate values before first interval fires
    start()
  }
})

// ── Auth ──────────────────────────────────────────────────────────────────────

function handleLogout() {
  stop()
  store.clearData()
  auth.logout()
  router.push('/login')
}
</script>
