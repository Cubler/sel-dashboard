<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
    <div class="w-full max-w-md">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h1 class="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Industrial Data Monitor
        </h1>

        <form novalidate @submit.prevent="handleSubmit">
          <!-- Server URL -->
          <div class="mb-5">
            <label
              for="serverUrl"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Server URL
            </label>
            <input
              id="serverUrl"
              v-model.trim="form.serverUrl"
              type="url"
              autocomplete="url"
              autofocus
              placeholder="https://192.168.3.2"
              :class="inputClass(!!fieldErrors.serverUrl)"
              :aria-invalid="!!fieldErrors.serverUrl || undefined"
              :aria-describedby="fieldErrors.serverUrl ? 'serverUrl-error' : undefined"
            />
            <p
              v-if="fieldErrors.serverUrl"
              id="serverUrl-error"
              role="alert"
              class="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {{ fieldErrors.serverUrl }}
            </p>
          </div>

          <!-- Username -->
          <div class="mb-5">
            <label
              for="username"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              v-model.trim="form.username"
              type="text"
              autocomplete="username"
              :class="inputClass(!!fieldErrors.username)"
              :aria-invalid="!!fieldErrors.username || undefined"
              :aria-describedby="fieldErrors.username ? 'username-error' : undefined"
            />
            <p
              v-if="fieldErrors.username"
              id="username-error"
              role="alert"
              class="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {{ fieldErrors.username }}
            </p>
          </div>

          <!-- Password -->
          <div class="mb-5">
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              :class="inputClass(!!fieldErrors.password)"
              :aria-invalid="!!fieldErrors.password || undefined"
              :aria-describedby="fieldErrors.password ? 'password-error' : undefined"
            />
            <p
              v-if="fieldErrors.password"
              id="password-error"
              role="alert"
              class="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {{ fieldErrors.password }}
            </p>
          </div>

          <!-- Remember credentials -->
          <div class="mb-6 flex items-center">
            <input
              id="remember"
              v-model="rememberCredentials"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              for="remember"
              class="ml-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none"
            >
              Remember credentials
            </label>
          </div>

          <!-- Auth error -->
          <div
            v-if="authError"
            role="alert"
            class="mb-5 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20"
          >
            <p class="text-sm text-red-700 dark:text-red-400">
              {{ authError.message }}
            </p>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="authLoading"
            class="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            <svg
              v-if="authLoading"
              class="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{{ authLoading ? 'Connecting...' : 'Connect to Server' }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSymbolPolling } from '~/composables/useSymbolPolling'
import { storage } from '~/services/storageService'

const { login, authError, authLoading } = useSymbolPolling()
const router = useRouter()

const form = reactive({
  serverUrl: storage.get('serverUrl') ?? 'https://192.168.3.2',
  username: storage.get('username') ?? '',
  password: '',
})

const fieldErrors = reactive({
  serverUrl: '',
  username: '',
  password: '',
})

const rememberCredentials = ref(
  !!(storage.get('username') || storage.get('serverUrl')),
)

function inputClass(hasError: boolean): string {
  const base = 'w-full rounded-md border px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
  return hasError
    ? `${base} border-red-500 dark:border-red-500`
    : `${base} border-gray-300 dark:border-gray-600`
}

function validate(): boolean {
  fieldErrors.serverUrl = ''
  fieldErrors.username = ''
  fieldErrors.password = ''

  let valid = true

  if (!form.serverUrl) {
    fieldErrors.serverUrl = 'Server URL is required'
    valid = false
  }
  else {
    try { new URL(form.serverUrl) }
    catch { fieldErrors.serverUrl = 'Enter a valid URL (e.g. https://192.168.3.2)'; valid = false }
  }

  if (!form.username) {
    fieldErrors.username = 'Username is required'
    valid = false
  }

  if (!form.password) {
    fieldErrors.password = 'Password is required'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validate()) return

  const success = await login({
    serverUrl: form.serverUrl,
    username: form.username,
    password: form.password,
  })

  if (success) {
    if (rememberCredentials.value) {
      storage.set('username', form.username)
      storage.set('serverUrl', form.serverUrl)
    }
    else {
      storage.remove('username')
      storage.remove('serverUrl')
    }
    router.push('/dashboard')
  }
}
</script>
