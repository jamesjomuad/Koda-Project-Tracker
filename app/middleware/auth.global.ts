export default defineNuxtRouteMiddleware(async (to) => {
  const isLoginPage = to.path === '/login';
  const { user, loading, fetchSession } = useAuth();

  if (loading.value) {
    await fetchSession();
  }

  if (!user.value && !isLoginPage) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }

  if (user.value && isLoginPage) {
    return navigateTo('/');
  }
});