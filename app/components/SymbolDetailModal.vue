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
                  <!-- Status badge (inlined) -->
                  <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': symbolStatus === 'active',
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400': symbolStatus === 'stale',
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400': symbolStatus === 'inactive',
                    }"
                  >{{ symbolStatus === 'active' ? 'Active' : symbolStatus === 'stale' ? 'Stale' : 'Inactive' }}</span>

                  <!-- Quality badge (inlined) -->
                  <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': validity === 'good',
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400': validity === 'questionable',
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400': validity === 'invalid',
                    }"
                  >{{ validity === 'good' ? 'Good' : validity === 'questionable' ? 'Questionable' : 'Invalid' }}</span>

                  <span
                    v-if="range !== 'normal'"
                    class="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                  >
                    Range: {{ range }}
                  </span>
                </div>
              </div>
            </section>

            <!-- History chart (inlined) -->
            <section>
              <h3 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Value History (5 min)
              </h3>
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
                <div class="relative h-48 w-full">
                  <canvas v-show="hasEnoughData" ref="canvasRef" />
                  <div
                    v-if="!hasEnoughData"
                    class="absolute inset-0 flex flex-col items-center justify-center gap-1 text-sm text-gray-400 dark:text-gray-500"
                  >
                    <svg class="h-8 w-8 opacity-40" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    <span>Collecting data… ({{ dataPoints.length }}&thinsp;/&thinsp;2 points)</span>
                  </div>
                </div>
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
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
} from 'chart.js'
import type { QualityValidity, Symbol, SymbolHistory, SymbolValue } from '~/types/api'
import { getSymbolStatus } from '~/utils/qualityHelpers'
import { formatTimestamp, formatRelativeTime, formatFullTimestamp } from '~/utils/dateHelpers'

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

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

const rd = computed(() => value.value?.rawData as any)
const units = computed(() => (rd.value?.units as string | undefined) ?? '')
const range = computed(() => (rd.value?.range as string | undefined) ?? 'normal')
const multiplier = computed(() => (rd.value?.multiplier as number | undefined) ?? 1.0)
const description = computed(() => (rd.value?.d as string | undefined) ?? symbolMeta.value?.description ?? '')
const validity = computed(() => (rd.value?.q?.validity as QualityValidity | undefined) ?? 'invalid')
const qSource = computed(() => (rd.value?.q?.source as string | undefined) ?? 'unknown')
const operatorBlocked = computed(() => (rd.value?.q?.operatorBlocked as boolean | undefined) ?? false)
const clockNotSynchronized = computed(() => (rd.value?.t?.clockNotSynchronized as boolean | undefined) ?? false)

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
  const dq = rd.value?.q?.detailQual as DetailQual | undefined
  if (!dq) return []
  return (Object.entries(dq) as [keyof DetailQual, boolean][])
    .filter(([, v]) => v)
    .map(([k]) => DETAIL_QUAL_LABELS[k])
})

// ── Chart ─────────────────────────────────────────────────────────────────────

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const dataPoints = computed(() => history.value?.dataPoints ?? [])
const hasEnoughData = computed(() => dataPoints.value.length >= 2)

function isDarkMode(): boolean {
  return (
    document.documentElement.classList.contains('dark')
    || (!document.documentElement.classList.contains('light')
      && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
}

function chartColors() {
  const dark = isDarkMode()
  return {
    line: dark ? '#60a5fa' : '#3b82f6',
    fill: dark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)',
    grid: dark ? '#374151' : '#e5e7eb',
    tick: dark ? '#9ca3af' : '#6b7280',
  }
}

function createChart(): void {
  if (!canvasRef.value || dataPoints.value.length < 2) return
  const points = dataPoints.value
  const colors = chartColors()
  chartInstance = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels: points.map(p => p.formattedTime),
      datasets: [{
        data: points.map(p => p.value),
        borderColor: colors.line,
        backgroundColor: colors.fill,
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `Value: ${ctx.parsed.y}` } },
      },
      scales: {
        x: { ticks: { maxTicksLimit: 6, color: colors.tick, font: { size: 11 } }, grid: { color: colors.grid } },
        y: { ticks: { color: colors.tick, font: { size: 11 } }, grid: { color: colors.grid } },
      },
    },
  })
}

watch(
  dataPoints,
  (points) => {
    if (points.length < 2) return
    if (!chartInstance) { nextTick(createChart); return }
    chartInstance.data.labels = points.map(p => p.formattedTime)
    chartInstance.data.datasets[0]!.data = points.map(p => p.value)
    chartInstance.update('none')
  },
  { deep: true },
)

// ── Focus management ──────────────────────────────────────────────────────────

const panelRef = ref<HTMLElement | null>(null)
const closeBtnRef = ref<HTMLElement | null>(null)
const previousFocus = ref<HTMLElement | null>(null)

onMounted(() => {
  previousFocus.value = document.activeElement as HTMLElement
  nextTick(() => closeBtnRef.value?.focus())
  document.addEventListener('keydown', handleKeydown)
  if (hasEnoughData.value) createChart()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  previousFocus.value?.focus()
  chartInstance?.destroy()
  chartInstance = null
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
