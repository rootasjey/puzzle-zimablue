export default defineNuxtRouteMiddleware(async () => {
  const { $localePath } = useNuxtApp()
  const { loggedIn, user, fetch } = useUserSession()
  await fetch()
  if (!loggedIn.value || user.value?.role !== 'admin') {
    return navigateTo($localePath({ name: 'admin-sign-in' }))
  }
})
