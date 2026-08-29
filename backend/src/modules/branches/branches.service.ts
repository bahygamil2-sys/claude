import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import { assertBranchAccess, getAccessibleBranchIds } from "../../lib/branchAccess";
import type { BrandAccessTokenPayload } from "../../lib/tokens";
import type { CreateBranchInput, UpdateBranchInput } from "./branches.schema";

export async function list(user: BrandAccessTokenPayload) {
  const accessibleIds = await getAccessibleBranchIds(user);
  return prisma.restaurantBranch.findMany({
    where: { brandId: user.brandId, ...(accessibleIds ? { id: { in: accessibleIds } } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOne(user: BrandAccessTokenPayload, id: string) {
  const branch = await prisma.restaurantBranch.findFirst({ where: { id, brandId: user.brandId } });
  if (!branch) throw ApiError.notFound("Branch not found");
  await assertBranchAccess(user, id);
  return branch;
}

export async function create(user: BrandAccessTokenPayload, input: CreateBranchInput) {
  return prisma.restaurantBranch.create({ data: { ...input, brandId: user.brandId } });
}

export async function update(user: BrandAccessTokenPayload, id: string, input: UpdateBranchInput) {
  const branch = await prisma.restaurantBranch.findFirst({ where: { id, brandId: user.brandId } });
  if (!branch) throw ApiError.notFound("Branch not found");
  return prisma.restaurantBranch.update({ where: { id }, data: input });
}
