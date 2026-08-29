import { prisma } from "./prisma";
import { ApiError } from "./ApiError";
import type { BrandAccessTokenPayload } from "./tokens";

/**
 * OWNER sees every branch in their brand. MANAGER is scoped to whatever
 * BrandUserBranch rows exist for them — looked up fresh on every call rather
 * than cached in the JWT, so a branch-access change takes effect immediately
 * instead of waiting out the access token's lifetime.
 *
 * Returns `null` to mean "no restriction" (OWNER), or the explicit allowed
 * branchId list (MANAGER) — callers intersect their own query with this,
 * never trusting a client-supplied branchId/filter on its own.
 */
export async function getAccessibleBranchIds(user: BrandAccessTokenPayload): Promise<string[] | null> {
  if (user.role === "OWNER") return null;
  const rows = await prisma.brandUserBranch.findMany({
    where: { brandUserId: user.sub },
    select: { branchId: true },
  });
  return rows.map((r) => r.branchId);
}

export async function assertBranchAccess(user: BrandAccessTokenPayload, branchId: string): Promise<void> {
  if (user.role === "OWNER") return;
  const allowed = await getAccessibleBranchIds(user);
  if (!allowed?.includes(branchId)) throw ApiError.forbidden("You do not have access to this branch");
}

/** Rejects any branchId that doesn't belong to this brand — never trust a client-supplied id on its own. */
export async function assertBranchesBelongToBrand(brandId: string, branchIds: string[]): Promise<void> {
  if (branchIds.length === 0) return;
  const count = await prisma.restaurantBranch.count({ where: { id: { in: branchIds }, brandId } });
  if (count !== branchIds.length) throw ApiError.badRequest("One or more branches do not belong to this brand");
}
