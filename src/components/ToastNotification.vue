<template>
  <Teleport to="body">
    <div
      aria-live="polite"
      aria-atomic="false"
      class="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          role="status"
          class="pointer-events-auto flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg"
          :class="{
            'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300': toast.type === 'success',
            'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300': toast.type === 'error',
            'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300': toast.type === 'info',
          }"
        >
          <span class="text-sm">{{ toast.message }}</span>
          <button
            aria-label="Dismiss notification"
            class="ml-auto shrink-0 opacity-60 hover:opacity-100 focus:outline-none"
            @click="dismiss(toast.id)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
</style>
