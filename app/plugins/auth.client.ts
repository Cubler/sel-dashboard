import { useSymbolPolling } from '~/composables/useSymbolPolling'

// Restores auth state from localStorage before the first route guard runs,
// so a valid persisted token keeps the user on /dashboard after a page refresh.
export default defineNuxtPlugin(() => {
  useSymbolPolling().init()
})
