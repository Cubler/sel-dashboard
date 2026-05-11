<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="max-w-screen-xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
          Industrial Data Monitor
        </h1>
        <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>User: {{ auth.username }}</span>
          <span v-if="auth.serverUrl">Server: {{ displayServer }}</span>
          <button
            class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
            @click="handleLogout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-screen-xl mx-auto px-4 py-10">
      <p class="text-gray-400 text-sm">Dashboard — coming in Phase 5.</p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const displayServer = computed(() => {
  try {
    return new URL(auth.serverUrl).hostname
  }
  catch {
    return auth.serverUrl
  }
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
