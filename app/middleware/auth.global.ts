import { apiService } from '~/services/apiService'

export default defineNuxtRouteMiddleware((to) => {
  if (to.path !== '/login' && !apiService.isTokenValid()) {
    return navigateTo('/login')
  }
  if (to.path === '/login' && apiService.isTokenValid()) {
    return navigateTo('/dashboard')
  }
})
