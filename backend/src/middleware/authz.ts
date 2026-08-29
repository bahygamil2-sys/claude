import type { NextFunction, Request, Response } from "express";
import type { BrandRole } from "@prisma/client";
import { ApiError } from "../lib/ApiError";

/** Must run after authenticate(). Rejects unless the caller is a platform admin. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.actorType !== "ADMIN") return next(ApiError.forbidden());
  next();
}

/** Must run after authenticate(). Rejects unless the caller is a brand user (any role). */
export function requireBrandUser(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.actorType !== "BRAND_USER") return next(ApiError.forbidden());
  next();
}

/** Must run after authenticate(). Rejects unless the caller is a brand user with one of `roles`. */
export function requireBrandRole(...roles: BrandRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.actorType !== "BRAND_USER" || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden());
    }
    next();
  };
}
