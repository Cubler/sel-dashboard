// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import eslintConfigPrettier from 'eslint-config-prettier'

export default withNuxt(
  eslintConfigPrettier,  
  {
    rules: {
      'no-console': 'warn',
      'vue/no-unused-vars': 'error',
    },
  }
)
