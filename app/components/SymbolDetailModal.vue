<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 transition-opacity"
        aria-hidden="true"
        @click="emit('close')"
      />

      <!-- Panel container -->
      <div class="relative flex min-h-full items-center justify-center p-4">
        <div
          ref="panelRef"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          class="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl dark:bg-gray-800"
          @click.stop
        >
          <!-- ── Header ─────────────────────────────────────────────────────── -->
          <div class="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2
              id="modal-title"
              class="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {{ symbolName }}
            </h2>
            <button
              ref="closeBtnRef"
              aria-label="Close"
              class="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              @click="emit('close')"
            >
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          <!-- ── Scrollable body ─────────────────────────────────────────────── -->
          <div class="flex-1 space-y-6 overflow-y-auto px-6 py-5">

            <!-- Current value card -->
            <section>
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p class="text-3xl font-bold tabular-nums text-gray-900 dark:text-white">
                    {{ value !== undefined ? value.stVal : '—' }}
                    <span class="ml-1 text-lg font-normal text-gray-500 dark:text-gray-400">{{ units }}</span>
                  </p>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Device timestamp: <span class="font-mono">{{ value ? formatTimestamp(value.t) : '—' }}</span>
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Last received: {{ value ? formatFullTimestamp(value.lastUpdated) : '—' }}
                    <span v-if="value" class="text-gray-400 dark:text-gray-500">({{ formatRelativeTime(value.lastUpdated) }})</span>
                  </p>
                </div>

                <div class="flex flex-col items-end gap-2">
                  <StatusBadge :status="symbolStatus" />
                  <QualityBadge :validity="validity" />
                  <span
                    v-if="range !== 'normal'"
                    class="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                  >
                    Range: {{ range }}
                  </span>
                </div>
              </div>
            </section>

            <!-- History chart -->
            <section>
              <h3 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Value History (5 min)
              </h3>
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
                <SymbolHistoryChart :history="history" />
              </div>
            </section>

            <!-- Metadata -->
            <section>
              <h3 class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Metadata
              </h3>
              <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div v-if="description">
                  <dt class="text-gray-500 dark:text-gray-400">Description</dt>
                  <dd class="font-medium text-gray-900 dark:text-white">{{ description }}</dd>
                </div>
                <div>
                  <dt class="text-gray-500 dark:text-gray-400">Type</dt>
                  <dd class="font-medium text-gray-900 dark:text-white">{{ symbolMeta?.type ?? '—' }} (16-bit Integer)</dd>
                </div>
                <div>
                  <dt class="text-gray-500 dark:text-gray-400">Units</dt>
                  <dd class="font-medium text-gray-900 dark:text-white">{{ units || '—' }}</dd>
                </div>
                <div>
                  <dt class="text-gray-500 dark:text-gray-400">Multiplier</dt>
                  <dd class="font-medium text-gray-900 dark:text-white">{{ multiplier }}</dd>
                </div>
                <div>
                  <dt class="text-gray-500 dark:text-gray-400">Range</dt>
                  <dd class="font-medium capitalize text-gray-900 dark:text-white">{{ range }}</dd>
                </div>
              </dl>
            </section>

            <!-- Quality details -->
            <section>
              <h3 class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Quality Details
              </h3>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <QualityIndicator
                  :ok="validity === 'good'"
                  :label="validity === 'good' ? 'Valid data' : `Quality: ${validity}`"
                />
                <QualityIndicator
                  :ok="true"
                  :label="`Source: ${qSource}`"
                />
                <QualityIndicator
                  :ok="!operatorBlocked"
                  :label="operatorBlocked ? 'Operator blocked' : 'Not blocked'"
                />
                <QualityIndicator
                  :ok="!testMode"
                  :label="testMode ? 'Test mode active' : 'Live (not test)'"
                />
                <QualityIndicator
                  :ok="!clockFailure"
                  :label="clockFailure ? 'Clock failure' : 'No clock failure'"
                />
                <QualityIndicator
                  :ok="!clockNotSynchronized"
                  :label="clockNotSynchronized ? 'Clock unsynchronized' : 'Clock synchronized'"
                />
              </div>

              <!-- Active detail qualifiers (only shown when any flag is true) -->
              <div v-if="activeDetailFlags.length > 0" class="mt-3">
                <p class="mb-1 text-xs font-medium text-red-600 dark:text-red-400">Active fault flags:</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="flag in activeDetailFlags"
                    :key="flag"
                    class="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  >
                    {{ flag }}
                  </span>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<!-- Inline sub-component to avoid a separate file for a simple indicator -->
<script lang="ts">
import { defineComponent, h } from 'vue'
const QualityIndicator = defineComponent({
  props: { ok: Boolean, label: String },
  setup(props) {
    return () => h('div', { class: 'flex items-center gap-1.5' }, [
      h('span', {
        class: props.ok
          ? 'h-4 w-4 shrink-0 rounded-full bg-green-500 flex items-center justify-center'
          : 'h-4 w-4 shrink-0 rounded-full bg-red-500 flex items-center justify-center',
        'aria-hidden': 'true',
      }, [
        h('svg', { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 20 20', fill: 'white', class: 'h-2.5 w-2.5' }, [
          props.ok
            ? h('path', { 'fill-rule': 'evenodd', d: 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z', 'clip-rule': 'evenodd' })
            : h('path', { 'fill-rule': 'evenodd', d: 'M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z', 'clip-rule': 'evenodd' }),
        ]),
      ]),
      h('span', { class: 'text-gray-700 dark:text-gray-300' }, props.label),
    ])
  },
})
export { QualityIndicator }
</script>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import type { QualityValidity, Symbol, SymbolHistory, SymbolValue } from '~/types/api'
import { getSymbolStatus } from '~/utils/qualityHelpers'
import { formatTimestamp, formatRelativeTime, formatFullTimestamp } from '~/utils/dateHelpers'

const props = defineProps<{
  symbolName: string
  symbols: Symbol[]
  symbolValues: Map<string, SymbolValue>
  symbolHistory: Map<string, SymbolHistory>
}>()

const emit = defineEmits<{ close: [] }>()

// ── Data access ───────────────────────────────────────────────────────────────

const symbolMeta = computed(() => props.symbols.find(s => s.name === props.symbolName))
const value = computed(() => props.symbolValues.get(props.symbolName))
const history = computed(() => props.symbolHistory.get(props.symbolName))
const symbolStatus = computed(() => getSymbolStatus(value.value?.lastUpdated))

function raw<T>(path: string[]): T | undefined {
  let cursor: unknown = value.value?.rawData
  for (const key of path) {
    if (typeof cursor !== 'object' || cursor === null) return undefined
    cursor = (cursor as Record<string, unknown>)[key]
  }
  return cursor as T | undefined
}

const units = computed(() => raw<string>(['units']) ?? '')
const range = computed(() => raw<string>(['range']) ?? 'normal')
const multiplier = computed(() => raw<number>(['multiplier']) ?? 1.0)
const description = computed(() => raw<string>(['d']) ?? symbolMeta.value?.description ?? '')
const validity = computed(() => raw<QualityValidity>(['q', 'validity']) ?? 'invalid')
const qSource = computed(() => raw<string>(['q', 'source']) ?? 'unknown')
const operatorBlocked = computed(() => raw<boolean>(['q', 'operatorBlocked']) ?? false)
const testMode = computed(() => raw<boolean>(['q', 'test']) ?? false)
const clockNotSynchronized = computed(() => raw<boolean>(['t', 'clockNotSynchronized']) ?? false)
const clockFailure = computed(() => raw<boolean>(['t', 'clockFailure']) ?? false)

interface DetailQual {
  overflow: boolean; outOfRange: boolean; badReference: boolean; oscillatory: boolean
  failure: boolean; oldData: boolean; inconsistent: boolean; inaccurate: boolean
}

const DETAIL_QUAL_LABELS: Record<keyof DetailQual, string> = {
  overflow: 'Overflow', outOfRange: 'Out of range', badReference: 'Bad reference',
  oscillatory: 'Oscillatory', failure: 'Failure', oldData: 'Old data',
  inconsistent: 'Inconsistent', inaccurate: 'Inaccurate',
}

const activeDetailFlags = computed<string[]>(() => {
  const dq = raw<DetailQual>(['q', 'detailQual'])
  if (!dq) return []
  return (Object.entries(dq) as [keyof DetailQual, boolean][])
    .filter(([, v]) => v)
    .map(([k]) => DETAIL_QUAL_LABELS[k])
})

// ── Focus management ──────────────────────────────────────────────────────────

const panelRef = ref<HTMLElement | null>(null)
const closeBtnRef = ref<HTMLElement | null>(null)
const previousFocus = ref<HTMLElement | null>(null)

onMounted(() => {
  previousFocus.value = document.activeElement as HTMLElement
  nextTick(() => closeBtnRef.value?.focus())
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  previousFocus.value?.focus()
})

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') { emit('close'); return }
  if (e.key !== 'Tab') return

  const focusable = Array.from(
    panelRef.value?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  )
  if (focusable.length === 0) return

  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!

  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus() }
  }
  else {
    if (document.activeElement === last) { e.preventDefault(); first.focus() }
  }
}
</script>
