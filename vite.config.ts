import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { mockApiPlugin } from './server/mock-plugin'

export default defineConfig({
  plugins: [
    vue(),
    mockApiPlugin(),
  ],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
