import type { Request } from "express";
import { ApiError } from "./ApiError";
import type { BrandAccessTokenPayload } from "./tokens";

/**
 * Narrows req.user to the BRAND_USER shape. Safe to call in any controller
 * mounted behind requireBrandUser — that middleware already guarantees this
 * holds, but TS can't see across the middleware boundary, so this asserts it
 * explicitly instead of every call site falling back to an untyped `as` cast
 * or (worse) a silent empty-string default.
 */
export function brandUserContext(req: Request): BrandAccessTokenPayload {
  if (!req.user || req.user.actorType !== "BRAND_USER") {
    throw ApiError.unauthorized("Brand user session required");
  }
  return req.user;
}
