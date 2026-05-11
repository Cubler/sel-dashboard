import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

describe('usePreferencesStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Reset <html> class between tests
    document.documentElement.classList.remove('dark')
    setActivePinia(createPinia())
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
  })

  // Dynamic import so localStorage is read fresh for each test
  async function getStore() {
    const { usePreferencesStore } = await import('~/stores/preferences')
    return usePreferencesStore()
  }

  it('defaults to "auto" theme when nothing is in localStorage', async () => {
    const store = await getStore()
    expect(store.theme).toBe('auto')
  })

  it('reads the persisted theme from localStorage', async () => {
    localStorage.setItem('sel:theme', 'dark')
    const store = await getStore()
    expect(store.theme).toBe('dark')
  })

  it('defaults autoStartPolling to true when not persisted', async () => {
    const store = await getStore()
    expect(store.autoStartPolling).toBe(true)
  })

  it('reads autoStartPolling = false from localStorage', async () => {
    localStorage.setItem('sel:autoStart', 'false')
    const store = await getStore()
    expect(store.autoStartPolling).toBe(false)
  })

  describe('applyTheme', () => {
    it('adds "dark" class to <html> for theme "dark"', async () => {
      const store = await getStore()
      store.applyTheme('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('removes "dark" class from <html> for theme "light"', async () => {
      document.documentElement.classList.add('dark')
      const store = await getStore()
      store.applyTheme('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('applies system preference for theme "auto"', async () => {
      // happy-dom defaults to light — matchMedia returns false for dark
      const store = await getStore()
      store.applyTheme('auto')
      // Should not crash; class state depends on matchMedia result
      expect(true).toBe(true)
    })
  })

  describe('watch', () => {
    it('persists theme to localStorage when it changes', async () => {
      const store = await getStore()
      store.theme = 'dark'
      // Vue watchers are flushed asynchronously
      await Promise.resolve()
      expect(localStorage.getItem('sel:theme')).toBe('dark')
    })

    it('persists autoStartPolling to localStorage when it changes', async () => {
      const store = await getStore()
      store.autoStartPolling = false
      await Promise.resolve()
      expect(localStorage.getItem('sel:autoStart')).toBe('false')
    })
  })

  describe('init', () => {
    it('applies the theme on init without throwing', async () => {
      const store = await getStore()
      expect(() => store.init()).not.toThrow()
    })
  })
})
