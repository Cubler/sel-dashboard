<template>
  <div class="flex items-center gap-2 text-sm">
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
    <span
      v-if="status.lastConnection"
      class="text-gray-400 dark:text-gray-500"
    >
      · Last updated: {{ relativeTime }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { ConnectionStatus } from '~/types/api'
import { formatRelativeTime } from '~/utils/dateHelpers'

const props = defineProps<{ status: ConnectionStatus }>()

// Tick every second so the relative time string stays live
const tick = ref(0)
let timer: ReturnType<typeof setInterval>

onMounted(() => { timer = setInterval(() => { tick.value++ }, 1_000) })
onUnmounted(() => clearInterval(timer))

const relativeTime = computed(() => {
  void tick.value // re-evaluate each second
  return formatRelativeTime(props.status.lastConnection)
})
</script>
