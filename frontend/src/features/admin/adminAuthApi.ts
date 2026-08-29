import { apiClient } from "@/lib/apiClient";
import type { AdminUser } from "@/types/api";

export async function adminLoginRequest(email: string, password: string) {
  const res = await apiClient.post<{ admin: AdminUser; accessToken: string }>("/admin/auth/login", { email, password });
  return res.data;
}
