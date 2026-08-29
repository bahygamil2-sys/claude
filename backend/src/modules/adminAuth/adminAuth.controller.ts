import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { ApiError } from "../../lib/ApiError";
import { ADMIN_REFRESH_COOKIE_NAME, clearAdminRefreshCookie, setAdminRefreshCookie } from "../../lib/cookies";
import * as adminAuthService from "./adminAuth.service";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { admin, accessToken, rawRefreshToken } = await adminAuthService.login(req.body);
  setAdminRefreshCookie(res, rawRefreshToken);
  res.status(200).json({ admin, accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.cookies?.[ADMIN_REFRESH_COOKIE_NAME];
  if (!raw) throw ApiError.unauthorized("Missing refresh token");
  const { admin, accessToken, rawRefreshToken } = await adminAuthService.refresh(raw);
  setAdminRefreshCookie(res, rawRefreshToken);
  res.status(200).json({ admin, accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.cookies?.[ADMIN_REFRESH_COOKIE_NAME];
  await adminAuthService.logout(raw);
  clearAdminRefreshCookie(res);
  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const admin = await adminAuthService.getMe(req.user!.sub);
  res.status(200).json({ admin });
});
