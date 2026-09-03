import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) {
    if (to.meta.requiresAuth) {
      const cookie = useRequestEvent()?.node?.req?.headers?.cookie || "";

      const hasToken = cookie.includes("accessToken=");

      if (!hasToken) {
        return navigateTo("/login");
      }
    }
    return;
  }

  const authStore = useAuthStore();

  if (!authStore.token && import.meta.client) {
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) {
      authStore.token = storedToken;
      authStore.setTokenCookie(storedToken);
      try {
        const raw = localStorage.getItem("user");
        if (raw) authStore.user = JSON.parse(raw);
      } catch {
        authStore.user = null;
      }
    }
  }

  const token = authStore.token;

  if (to.meta.requiresAuth && !token) {
    return navigateTo("/login");
  }

  if (to.meta.guest && token) {
    authStore.logout();
    return navigateTo("/dashboard");
  }

  if (to.meta.requiredRoles && token) {
    const userRoles = authStore.user?.roles?.map((r) => r.roleName) || [];
    const hasRole = (to.meta.requiredRoles as string[]).some((r) =>
      userRoles.includes(r),
    );
    if (!hasRole) {
      if (import.meta.client) {
        window.dispatchEvent(
          new CustomEvent("rbac-denied", {
            detail: {
              message: `You need one of these roles: ${(to.meta.requiredRoles as string[]).join(", ")}`,
            },
          }),
        );
      }
      return navigateTo("/dashboard");
    }
  }
});
