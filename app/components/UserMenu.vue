<template>
  <div class="relative">
    <!-- Trigger -->
    <button
      ref="triggerRef"
      aria-label="Settings"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      aria-controls="settings-panel"
      class="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
      @click="toggleMenu"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
        viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
      >
        <path
          stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <!-- Panel -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="scale-95 opacity-0"
      enter-to-class="scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="scale-100 opacity-100"
      leave-to-class="scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        id="settings-panel"
        class="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
      >
        <!-- Theme -->
        <div class="border-b border-gray-100 p-4 dark:border-gray-700">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Theme
          </p>
          <div class="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
            <button
              v-for="opt in THEME_OPTIONS"
              :key="opt.value"
              :aria-pressed="prefs.theme === opt.value"
              :class="prefs.theme === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
              class="flex-1 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              @click="prefs.theme = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Auto-start polling -->
        <div class="p-4">
          <div class="flex items-center justify-between gap-3">
            <label
              for="autostart-toggle"
              class="text-sm text-gray-700 dark:text-gray-300"
            >
              Auto-start polling
            </label>
            <button
              id="autostart-toggle"
              role="switch"
              :aria-checked="prefs.autoStartPolling"
              :class="prefs.autoStartPolling ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
              @click="prefs.autoStartPolling = !prefs.autoStartPolling"
            >
              <span
                :class="prefs.autoStartPolling ? 'translate-x-5' : 'translate-x-0.5'"
                class="pointer-events-none mt-0.5 inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200"
              />
            </button>
          </div>
          <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Start polling automatically after login
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Theme } from '~/types/api'
import { usePreferencesStore } from '~/stores/preferences'

const prefs = usePreferencesStore()
const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function handleOutsideClick(e: MouseEvent) {
  if (!triggerRef.value?.contains(e.target as Node)) {
    isOpen.value = false
  }
}

function handleEsc(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    isOpen.value = false
    triggerRef.value?.focus()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick)
  document.addEventListener('keydown', handleEsc)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleOutsideClick)
  document.removeEventListener('keydown', handleEsc)
})
</script>
