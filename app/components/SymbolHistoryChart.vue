<template>
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
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, watch, ref } from 'vue'
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
} from 'chart.js'
import type { SymbolHistory } from '~/types/api'

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

const props = defineProps<{ history: SymbolHistory | undefined }>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const dataPoints = computed(() => props.history?.dataPoints ?? [])
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
        tooltip: {
          callbacks: {
            label: ctx => `Value: ${ctx.parsed.y}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { maxTicksLimit: 6, color: colors.tick, font: { size: 11 } },
          grid: { color: colors.grid },
        },
        y: {
          ticks: { color: colors.tick, font: { size: 11 } },
          grid: { color: colors.grid },
        },
      },
    },
  })
}

// Reactively update the chart as new poll data arrives
watch(
  dataPoints,
  (points) => {
    if (points.length < 2) return

    if (!chartInstance) {
      nextTick(createChart)
      return
    }

    // Update data in-place — no destroy/recreate, no animation flash
    chartInstance.data.labels = points.map(p => p.formattedTime)
    chartInstance.data.datasets[0]!.data = points.map(p => p.value)
    chartInstance.update('none')
  },
  { deep: true },
)

onMounted(() => {
  if (hasEnoughData.value) createChart()
})

// Critical: canvas holds a WebGL/2D context that leaks without explicit cleanup
onUnmounted(() => {
  chartInstance?.destroy()
  chartInstance = null
})
</script>
