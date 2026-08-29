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
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
}

/** Like authenticate, but continues anonymously instead of rejecting when no/invalid token is present. */
export function authenticateOptional(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // Anonymous fallback: an invalid/expired token on an optional-auth route is not an error.
  }
  next();
}
