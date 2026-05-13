import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Theme } from '~/types/api'
import { storage } from '~/services/storageService'

export const usePreferencesStore = defineStore('preferences', () => {
  const theme = ref<Theme>((storage.get('theme') as Theme | null) ?? 'auto')
  const autoStartPolling = ref(storage.getBool('autoStart', true))

  function applyTheme(t: Theme): void {
    const root = document.documentElement
    if (t === 'dark') {
      root.classList.add('dark')
    }
    else if (t === 'light') {
      root.classList.remove('dark')
    }
    else {
      root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
  }

  function init(): void {
    applyTheme(theme.value)

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (theme.value === 'auto') {
        document.documentElement.classList.toggle('dark', e.matches)
      }
    })
  }

  watch(theme, (val) => {
    storage.set('theme', val)
    applyTheme(val)
  })

  watch(autoStartPolling, (val) => {
    storage.set('autoStart', String(val))
  })

  return { theme, autoStartPolling, init, applyTheme }
})
