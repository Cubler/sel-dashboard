<template>
  <div class="rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">

    <!-- Toolbar: search + export -->
    <div class="flex items-center justify-between gap-4 border-b border-gray-200 p-4 dark:border-gray-700">
      <div class="relative max-w-sm flex-1">
        <svg
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search symbols..."
          aria-label="Search symbols"
          class="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <button
        class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        @click="handleExport"
      >
        Export CSV
      </button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th
              scope="col"
              class="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              @click="toggleSort('name')"
            >
              Symbol Name
              <span aria-hidden="true" class="ml-1">{{ sortIndicator('name') }}</span>
            </th>
            <th
              scope="col"
              class="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              @click="toggleSort('value')"
            >
              Value
              <span aria-hidden="true" class="ml-1">{{ sortIndicator('value') }}</span>
            </th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Units</th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Timestamp</th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Last Updated</th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
            <th scope="col" class="px-4 py-3"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr v-if="paginatedRows.length === 0">
            <td colspan="7" class="py-14 text-center text-sm text-gray-400 dark:text-gray-500">
              <template v-if="debouncedSearch">
                No symbols match <strong>"{{ debouncedSearch }}"</strong>
              </template>
              <template v-else>
                No symbols available
              </template>
            </td>
          </tr>

          <tr
            v-for="row in paginatedRows"
            :key="row.symbol.name"
            tabindex="0"
            class="cursor-pointer transition-colors hover:bg-gray-50 focus:bg-blue-50 focus:outline-none dark:hover:bg-gray-700/30 dark:focus:bg-blue-900/10"
            @click="$emit('select', row.symbol.name)"
            @keydown.enter.prevent="$emit('select', row.symbol.name)"
          >
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
              {{ row.symbol.name }}
            </td>
            <td class="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
              {{ row.value !== undefined ? row.value.stVal : '—' }}
            </td>
            <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
              {{ getUnits(row.value) }}
            </td>
            <td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
              {{ row.value ? formatTimestamp(row.value.t) : '—' }}
            </td>
            <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
              {{ row.value ? formatRelativeTime(row.value.lastUpdated) : '—' }}
            </td>
            <td class="px-4 py-3">
              <StatusBadge :status="getSymbolStatus(row.value?.lastUpdated)" />
            </td>
            <td class="px-4 py-3 text-right">
              <button
                class="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/20"
                @click.stop="$emit('select', row.symbol.name)"
              >
                View
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer: count + pagination + per-page -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
      <span>
        Showing {{ filteredAndSorted.length }} of {{ symbols.length }} symbols
      </span>

      <div class="flex items-center gap-1">
        <!-- Prev -->
        <button
          :disabled="currentPage === 1"
          class="rounded px-2 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-700"
          aria-label="Previous page"
          @click="currentPage--"
        >
          ←
        </button>

        <!-- Page numbers -->
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="page === currentPage
            ? 'bg-blue-600 text-white'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'"
          class="min-w-[2rem] rounded px-2 py-1 font-medium"
          @click="currentPage = page"
        >
          {{ page }}
        </button>

        <!-- Next -->
        <button
          :disabled="currentPage >= totalPages"
          class="rounded px-2 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-700"
          aria-label="Next page"
          @click="currentPage++"
        >
          →
        </button>

        <!-- Per-page selector -->
        <select
          v-model.number="pageSize"
          aria-label="Rows per page"
          class="ml-2 rounded border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
        >
          <option :value="10">10 / page</option>
          <option :value="25">25 / page</option>
          <option :value="50">50 / page</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Symbol, SymbolValue } from '~/types/api'
import { getSymbolStatus } from '~/utils/qualityHelpers'
import { formatTimestamp, formatRelativeTime } from '~/utils/dateHelpers'
import { exportSymbolsCsv } from '~/utils/csvExport'

const props = defineProps<{
  symbols: Symbol[]
  symbolValues: Map<string, SymbolValue>
}>()

defineEmits<{ select: [symbolName: string] }>()

// ── Search ────────────────────────────────────────────────────────────────────

const searchQuery = ref('')
const debouncedSearch = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(searchQuery, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = val
    currentPage.value = 1
  }, 300)
})

// ── Sort ──────────────────────────────────────────────────────────────────────

type SortColumn = 'name' | 'value'
const sortColumn = ref<SortColumn | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

function toggleSort(col: SortColumn) {
  if (sortColumn.value === col) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  }
  else {
    sortColumn.value = col
    sortDirection.value = 'asc'
  }
  currentPage.value = 1
}

function sortIndicator(col: SortColumn): string {
  if (sortColumn.value !== col) return '↕'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

// ── Computed rows ─────────────────────────────────────────────────────────────

type TableRow = { symbol: Symbol; value: SymbolValue | undefined }

const filteredAndSorted = computed<TableRow[]>(() => {
  const query = debouncedSearch.value.toLowerCase()

  let rows: TableRow[] = props.symbols
    .filter(s => s.name.toLowerCase().includes(query))
    .map(s => ({ symbol: s, value: props.symbolValues.get(s.name) }))

  if (sortColumn.value === 'name') {
    rows = rows.sort((a, b) =>
      sortDirection.value === 'asc'
        ? a.symbol.name.localeCompare(b.symbol.name)
        : b.symbol.name.localeCompare(a.symbol.name),
    )
  }
  else if (sortColumn.value === 'value') {
    rows = rows.sort((a, b) => {
      const av = a.value?.stVal ?? -Infinity
      const bv = b.value?.stVal ?? -Infinity
      return sortDirection.value === 'asc' ? av - bv : bv - av
    })
  }

  return rows
})

// ── Pagination ────────────────────────────────────────────────────────────────

const currentPage = ref(1)
const pageSize = ref(25)

const totalPages = computed(() => Math.max(1, Math.ceil(filteredAndSorted.value.length / pageSize.value)))

// Reset page when filter/sort changes and current page becomes invalid
watch(totalPages, (total) => {
  if (currentPage.value > total) currentPage.value = total
})

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredAndSorted.value.slice(start, start + pageSize.value)
})

// Show a sliding window of up to 5 page numbers around the current page
const visiblePages = computed(() => {
  const total = totalPages.value
  if (total <= 1) return []
  const halfWindow = 2
  const start = Math.max(1, Math.min(currentPage.value - halfWindow, total - halfWindow * 2))
  const end = Math.min(total, start + halfWindow * 2)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function getUnits(value: SymbolValue | undefined): string {
  return (value?.rawData?.units as string | undefined) ?? ''
}

function handleExport() {
  exportSymbolsCsv(
    filteredAndSorted.value.map(r => r.symbol),
    props.symbolValues,
  )
}
</script>
