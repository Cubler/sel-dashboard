import { createRouter, createWebHistory } from 'vue-router'
import { apiService } from './services/apiService'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('./pages/login.vue') },
  { path: '/dashboard', component: () => import('./pages/dashboard.vue') },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.path !== '/login' && !apiService.isTokenValid()) return '/login'
  if (to.path === '/login' && apiService.isTokenValid()) return '/dashboard'
})
