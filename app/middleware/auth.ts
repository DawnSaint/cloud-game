import { useMainStore } from '~/stores/main'

export default defineNuxtRouteMiddleware((to) => {
  const store = useMainStore()

  if (!store.isLoggedIn) {
    return navigateTo({
      path: '/profile',
      query: { redirect: to.fullPath },
    })
  }
})
