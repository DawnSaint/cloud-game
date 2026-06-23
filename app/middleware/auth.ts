import { useMainStore } from '~/stores/main'

export default defineNuxtRouteMiddleware((to) => {
  const store = useMainStore()

  if (!store.isLoggedIn) {
    return navigateTo({
      path: '/auth',
      query: { redirect: to.fullPath },
    })
  }
})
