import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    exclude: ['tests/e2e/**', 'node_modules/**'],
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      include: ['app/**/*.{ts,vue}'],
      exclude: [
        'app/pages/**',
        'app/middleware/**',
        'app/plugins/**',
        'app/router.ts',
        'app/main.ts',
        'app/app.vue',
        'app/types/**',
        'app/components/ConnectionIndicator.vue',
        'app/components/SymbolDetailModal.vue',
        'app/components/UserMenu.vue',
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
