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
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
})
