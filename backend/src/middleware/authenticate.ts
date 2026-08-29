import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/ApiError";
import { verifyAccessToken } from "../lib/tokens";

/** Requires a valid `Authorization: Bearer <accessToken>` header; sets req.user. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Missing access token"));
  }
  try {
    req.user = verifyAccessToken(header.slice("Bearer ".length));
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
}
