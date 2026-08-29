import { apiClient } from "@/lib/apiClient";
import type { Role, User } from "@/types/api";

type SessionResponse = { user: User; accessToken: string };

export async function loginRequest(email: string, password: string) {
  const res = await apiClient.post<SessionResponse>("/auth/login", { email, password });
  return res.data;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: Extract<Role, "CUSTOMER" | "RESTAURANT_OWNER">;
}

export async function registerRequest(input: RegisterInput) {
  const res = await apiClient.post<SessionResponse>("/auth/register", input);
  return res.data;
}

export async function logoutRequest() {
  await apiClient.post("/auth/logout");
}

export async function fetchMe() {
  const res = await apiClient.get<{ user: User }>("/auth/me");
  return res.data.user;
}
