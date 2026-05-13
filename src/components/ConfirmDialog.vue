<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <div
        class="fixed inset-0 bg-black/50 transition-opacity"
        aria-hidden="true"
      />
      <div class="relative flex min-h-full items-center justify-center p-4">
        <div
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          class="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800"
          @click.stop
        >
          <h2 :id="titleId" class="text-base font-semibold text-gray-900 dark:text-white">
            {{ title }}
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ message }}</p>
          <div class="mt-5 flex justify-end gap-3">
            <button
              class="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="emit('cancel')"
            >
              Cancel
            </button>
            <button
              class="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              @click="emit('confirm')"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  message: string
  confirmLabel?: string
}>(), { confirmLabel: 'Confirm' })

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const titleId = computed(() => `confirm-dialog-title-${Math.random().toString(36).slice(2)}`)
</script>
