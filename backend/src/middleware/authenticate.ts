import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/ApiError";
import { verifyAccessToken } from "../lib/tokens";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(ApiError.unauthorized("Missing access token"));
    return;
  }
  try {
    req.user = verifyAccessToken(header.slice("Bearer ".length));
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
}

export function requireRole(...roles: Array<"ADMIN" | "EDITOR" | "VIEWER">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden("Your role doesn't allow this action"));
      return;
    }
    next();
  };
}
