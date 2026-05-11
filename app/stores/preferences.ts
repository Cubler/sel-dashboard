import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Theme } from '~/types/api'

const KEYS = {
  THEME: 'sel:theme',
  AUTO_START: 'sel:autoStart',
} as const

export const usePreferencesStore = defineStore('preferences', () => {
  const theme = ref<Theme>((localStorage.getItem(KEYS.THEME) as Theme | null) ?? 'auto')
  const autoStartPolling = ref(localStorage.getItem(KEYS.AUTO_START) !== 'false')

  function applyTheme(t: Theme): void {
    const root = document.documentElement
    if (t === 'dark') {
      root.classList.add('dark')
    }
    else if (t === 'light') {
      root.classList.remove('dark')
    }
    else {
      // 'auto': mirror the OS preference
      root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
  }

  function init(): void {
    applyTheme(theme.value)

    // Keep 'auto' mode live as the OS preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (theme.value === 'auto') {
        document.documentElement.classList.toggle('dark', e.matches)
      }
    })
  }

  watch(theme, (val) => {
    localStorage.setItem(KEYS.THEME, val)
    applyTheme(val)
  })

  watch(autoStartPolling, (val) => {
    localStorage.setItem(KEYS.AUTO_START, String(val))
  })

  return { theme, autoStartPolling, init, applyTheme }
})
