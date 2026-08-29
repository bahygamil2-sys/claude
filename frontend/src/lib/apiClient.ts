import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";
import type { AdminUser, BrandUser } from "@/types/api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const apiClient = axios.create({ baseURL: API_BASE, withCredentials: true });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

// Two separate httpOnly refresh cookies exist (rai_admin_refresh, rai_brand_refresh),
// scoped to their own /admin/auth and /brand/auth paths — this picks the one matching
// the persisted session's actor type rather than guessing or trying both.
async function doRefresh(): Promise<string | null> {
  const actorType = useAuthStore.getState().session?.actorType;
  try {
    if (actorType === "ADMIN") {
      const res = await axios.post<{ admin: AdminUser; accessToken: string }>(
        `${API_BASE}/admin/auth/refresh`,
        {},
        { withCredentials: true }
      );
      useAuthStore.getState().setSession({ actorType: "ADMIN", user: res.data.admin }, res.data.accessToken);
      return res.data.accessToken;
    }
    if (actorType === "BRAND_USER") {
      const res = await axios.post<{ user: BrandUser; accessToken: string }>(
        `${API_BASE}/brand/auth/refresh`,
        {},
        { withCredentials: true }
      );
      useAuthStore.getState().setSession({ actorType: "BRAND_USER", user: res.data.user }, res.data.accessToken);
      return res.data.accessToken;
    }
    return null;
  } catch {
    useAuthStore.getState().clear();
    return null;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const AUTH_ENDPOINT_RE = /\/(admin|brand)\/auth\/(login|signup|refresh|accept-invite)$/;

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const isAuthEndpoint = AUTH_ENDPOINT_RE.test(original?.url ?? "");

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return apiClient(original);
      }
    }
    return Promise.reject(error);
  }
);

/** Called once on app boot: with a persisted session, exchanges its matching httpOnly
 * refresh cookie for a fresh access token. No persisted session means skip the call
 * entirely — a fresh browser has no session to restore. */
export async function bootstrapSession() {
  if (!useAuthStore.getState().session) return;
  await refreshAccessToken();
}
