import { prisma } from "./prisma";
import { ApiError } from "./ApiError";
import type { AccessTokenPayload } from "./tokens";
import type { UserRole } from "@prisma/client";

/** DB-fresh brand-id lookup for a user — called at login/refresh, when a JWT
 * claim would be stale, since access-control changes must take effect the
 * next time a token is actually issued. */
export async function resolveBrandIdsForUser(userId: string, role: UserRole): Promise<string[]> {
  if (role === "ADMIN") return [];
  const rows = await prisma.userBrandAccess.findMany({ where: { userId }, select: { brandId: true } });
  return rows.map((r) => r.brandId);
}

/**
 * The single place every scoped query/write funnels through. Returns `null`
 * for ADMIN (unrestricted — global by role, no brand filter needed) or the
 * caller's assigned brand ids otherwise. Never trust a client-supplied brand
 * id without checking it against this.
 */
export function getAccessibleBrandIds(user: AccessTokenPayload): string[] | null {
  if (user.role === "ADMIN") return null;
  return user.brandIds;
}

/** Throws 403 (naming the offending id) rather than silently filtering — a
 * scoped user should never mistake a partial result for a complete one. */
export function assertBrandAccess(user: AccessTokenPayload, brandId: string): void {
  if (user.role === "ADMIN") return;
  if (!user.brandIds.includes(brandId)) {
    throw ApiError.forbidden(`No access to brand ${brandId}`);
  }
}

export function assertBrandsAccess(user: AccessTokenPayload, brandIds: string[]): void {
  for (const id of brandIds) assertBrandAccess(user, id);
}
