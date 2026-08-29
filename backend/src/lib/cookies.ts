import type { Response } from "express";
import { env, isProduction } from "../config/env";

export const ADMIN_REFRESH_COOKIE_NAME = "rai_admin_refresh";
const ADMIN_REFRESH_COOKIE_PATH = "/api/v1/admin/auth";

export const BRAND_REFRESH_COOKIE_NAME = "rai_brand_refresh";
const BRAND_REFRESH_COOKIE_PATH = "/api/v1/brand/auth";

function cookieOptions(path: string) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function setAdminRefreshCookie(res: Response, rawRefreshToken: string) {
  res.cookie(ADMIN_REFRESH_COOKIE_NAME, rawRefreshToken, cookieOptions(ADMIN_REFRESH_COOKIE_PATH));
}
export function clearAdminRefreshCookie(res: Response) {
  res.clearCookie(ADMIN_REFRESH_COOKIE_NAME, { path: ADMIN_REFRESH_COOKIE_PATH });
}

export function setBrandRefreshCookie(res: Response, rawRefreshToken: string) {
  res.cookie(BRAND_REFRESH_COOKIE_NAME, rawRefreshToken, cookieOptions(BRAND_REFRESH_COOKIE_PATH));
}
export function clearBrandRefreshCookie(res: Response) {
  res.clearCookie(BRAND_REFRESH_COOKIE_NAME, { path: BRAND_REFRESH_COOKIE_PATH });
}
