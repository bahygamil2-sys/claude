import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { ApiError } from "../../lib/ApiError";
import { BRAND_REFRESH_COOKIE_NAME, clearBrandRefreshCookie, setBrandRefreshCookie } from "../../lib/cookies";
import * as brandAuthService from "./brandAuth.service";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { brand, user, accessToken, rawRefreshToken } = await brandAuthService.signup(req.body);
  setBrandRefreshCookie(res, rawRefreshToken);
  res.status(201).json({ brand, user, accessToken });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, rawRefreshToken } = await brandAuthService.login(req.body);
  setBrandRefreshCookie(res, rawRefreshToken);
  res.status(200).json({ user, accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.cookies?.[BRAND_REFRESH_COOKIE_NAME];
  if (!raw) throw ApiError.unauthorized("Missing refresh token");
  const { user, accessToken, rawRefreshToken } = await brandAuthService.refresh(raw);
  setBrandRefreshCookie(res, rawRefreshToken);
  res.status(200).json({ user, accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.cookies?.[BRAND_REFRESH_COOKIE_NAME];
  await brandAuthService.logout(raw);
  clearBrandRefreshCookie(res);
  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await brandAuthService.getMe(req.user!.sub);
  res.status(200).json({ user });
});

export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, rawRefreshToken } = await brandAuthService.acceptInvite(req.body);
  setBrandRefreshCookie(res, rawRefreshToken);
  res.status(200).json({ user, accessToken });
});
