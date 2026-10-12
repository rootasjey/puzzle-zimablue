export default defineNuxtRouteMiddleware(async () => {
  const { loggedIn, user, fetch } = useUserSession()
  await fetch()
  if (!loggedIn.value || user.value?.role !== 'admin') {
    return navigateTo('/admin/connexion')
  }
})
