import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    exclude: ['tests/e2e/**', 'node_modules/**'],
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/pages/**',
        'src/router.ts',
        'src/main.ts',
        'src/app.vue',
        'src/types/**',
        'src/components/ConnectionIndicator.vue',
        'src/components/ConfirmDialog.vue',
        'src/components/ErrorDisplay.vue',
        'src/components/SymbolDetailModal.vue',
        'src/components/ToastNotification.vue',
        'src/components/UserMenu.vue',
      ],
      reporter: ['text', 'html'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
})
