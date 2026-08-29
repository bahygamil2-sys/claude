import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types/api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const apiClient = axios.create({ baseURL: API_BASE, withCredentials: true });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ accessToken: string; user: User }>(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        useAuthStore.getState().setSession(res.data.user, res.data.accessToken);
        return res.data.accessToken;
      })
      .catch(() => {
        useAuthStore.getState().clear();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const isAuthEndpoint = /\/auth\/(login|register|refresh)$/.test(original?.url ?? "");

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

/** Called once on app boot: exchanges the httpOnly refresh cookie (if any) for a fresh access token. */
export async function bootstrapSession() {
  await refreshAccessToken();
}
