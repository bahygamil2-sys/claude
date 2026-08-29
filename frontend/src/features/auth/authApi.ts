import { apiClient } from "@/lib/apiClient";
import type { Brand, BrandUser } from "@/types/api";

type BrandSessionResponse = { user: BrandUser; accessToken: string };

export interface BrandSignupInput {
  brandName: string;
  brandNameAr: string;
  ownerName: string;
  email: string;
  password: string;
}

export async function brandSignupRequest(input: BrandSignupInput) {
  const res = await apiClient.post<BrandSessionResponse & { brand: Brand }>("/brand/auth/signup", input);
  return res.data;
}

export async function brandLoginRequest(email: string, password: string) {
  const res = await apiClient.post<BrandSessionResponse>("/brand/auth/login", { email, password });
  return res.data;
}

export async function brandLogoutRequest() {
  await apiClient.post("/brand/auth/logout");
}

export async function acceptInviteRequest(token: string, password: string) {
  const res = await apiClient.post<BrandSessionResponse>("/brand/auth/accept-invite", { token, password });
  return res.data;
}
