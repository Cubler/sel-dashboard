import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './app.vue'
import { router } from './router'
import { useSymbolPolling } from './composables/useSymbolPolling'
import { usePreferencesStore } from './stores/preferences'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Restore auth state from localStorage before first route guard fires
useSymbolPolling().init()
// Apply persisted theme before mount to avoid flash
usePreferencesStore().init()

app.mount('#app')
