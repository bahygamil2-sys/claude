import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { loginSchema, changePasswordSchema } from "./auth.schema";
import * as authService from "./auth.service";

const REFRESH_COOKIE = "bsd_refresh";
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/api/v1/auth",
};

function requestMeta(req: Request) {
  return { userAgent: req.headers["user-agent"], ipAddress: req.ip };
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await authService.login(input, requestMeta(req));
  res.cookie(REFRESH_COOKIE, refreshToken, { ...REFRESH_COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 * 1000 });
  res.status(200).json({ user, accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.refresh(
    req.cookies?.[REFRESH_COOKIE] as string | undefined,
    requestMeta(req)
  );
  res.cookie(REFRESH_COOKIE, refreshToken, { ...REFRESH_COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 * 1000 });
  res.status(200).json({ user, accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE] as string | undefined);
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_OPTS.path });
  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.me(req.user!);
  res.status(200).json(result);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const input = changePasswordSchema.parse(req.body);
  await authService.changePassword(req.user!.sub, input);
  res.status(204).send();
});
