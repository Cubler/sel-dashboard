import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    coverage: {
      provider: 'v8',
      // Focus on app source — exclude unreachable orchestration files
      include: ['app/**/*.{ts,vue}'],
      exclude: [
        'app/pages/**',
        'app/middleware/**',
        'app/plugins/**',
        'app/app.vue',
        'app/types/**',
        // View-heavy components without dedicated tests (same rationale as pages exclusion)
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
