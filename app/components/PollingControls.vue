<template>
  <div class="flex items-center gap-2">
    <button
      :class="isPolling
        ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
        : 'bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500'"
      class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      @click="isPolling ? $emit('stop') : $emit('start')"
    >
      {{ isPolling ? 'Stop Polling' : 'Start Polling' }}
    </button>

    <select
      :value="interval"
      aria-label="Polling interval"
      class="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
      @change="$emit('change-interval', Number(($event.target as HTMLSelectElement).value))"
    >
      <option :value="1000">1s</option>
      <option :value="2000">2s</option>
      <option :value="5000">5s</option>
      <option :value="10000">10s</option>
    </select>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isPolling: boolean
  interval: number
}>()

defineEmits<{
  start: []
  stop: []
  'change-interval': [ms: number]
}>()
</script>
