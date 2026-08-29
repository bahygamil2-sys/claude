import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { ApiError } from "../../lib/ApiError";
import { clearRefreshCookie, REFRESH_COOKIE_NAME, setRefreshCookie } from "../../lib/cookies";
import * as authService from "./auth.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, rawRefreshToken } = await authService.register(req.body);
  setRefreshCookie(res, rawRefreshToken);
  res.status(201).json({ user, accessToken });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, rawRefreshToken } = await authService.login(req.body);
  setRefreshCookie(res, rawRefreshToken);
  res.status(200).json({ user, accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!raw) throw ApiError.unauthorized("Missing refresh token");
  const { user, accessToken, rawRefreshToken } = await authService.refresh(raw);
  setRefreshCookie(res, rawRefreshToken);
  res.status(200).json({ user, accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.cookies?.[REFRESH_COOKIE_NAME];
  await authService.logout(raw);
  clearRefreshCookie(res);
  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  res.status(200).json({ user });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.updateMe(req.user!.id, req.body);
  res.status(200).json({ user });
});
