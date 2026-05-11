<template>
  <div class="flex items-center gap-2 text-sm">
    <!-- Animated dot -->
    <span class="relative flex h-2.5 w-2.5 shrink-0">
      <span
        v-if="status.isConnected"
        class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
      />
      <span
        :class="status.isConnected ? 'bg-green-500' : 'bg-red-500'"
        class="relative inline-flex h-2.5 w-2.5 rounded-full"
      />
    </span>

    <span :class="status.isConnected ? 'text-gray-700 dark:text-gray-300' : 'text-red-600 dark:text-red-400'">
      {{ status.isConnected ? 'Connected' : 'Disconnected' }}
    </span>

    <span v-if="relativeTime" class="text-gray-400 dark:text-gray-500">
      · {{ relativeTime }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { ConnectionStatus } from '~/types/api'

const props = defineProps<{
  status: ConnectionStatus
  lastUpdated: Date | null
}>()

// Tick every second so the relative time stays live without prop changes
const now = ref(Date.now())
let clockTimer: ReturnType<typeof setInterval>
onMounted(() => { clockTimer = setInterval(() => { now.value = Date.now() }, 1_000) })
onUnmounted(() => clearInterval(clockTimer))

const relativeTime = computed(() => {
  if (!props.lastUpdated) return null
  const seconds = Math.floor((now.value - props.lastUpdated.getTime()) / 1_000)
  if (seconds < 2) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  return `${Math.floor(seconds / 60)}m ago`
})
</script>
