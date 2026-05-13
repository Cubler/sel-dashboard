// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  experimental: {
    viteEnvironmentApi: true,
  },
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
  ],
  runtimeConfig: {
    public: {
      deviceIp: '', // override with NUXT_PUBLIC_DEVICE_IP to proxy to real device
    },
  },
})