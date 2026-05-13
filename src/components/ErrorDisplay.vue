<template>
  <div
    v-if="message"
    role="alert"
    class="mb-4 flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
  >
    <span>{{ message }}</span>
    <button
      class="shrink-0 font-medium underline focus:outline-none focus:ring-2 focus:ring-red-500"
      @click="emit('dismiss')"
    >
      Dismiss
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message?: string | null }>()
const emit = defineEmits<{ dismiss: [] }>()
</script>
