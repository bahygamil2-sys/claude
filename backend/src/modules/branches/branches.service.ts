import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import { assertBrandAccess, getAccessibleBrandIds } from "../../lib/rbac";
import { normalizeBranchName } from "../../lib/branchName";
import type { AccessTokenPayload } from "../../lib/tokens";
import type { AddAliasInput, CreateBranchInput, ListBranchesQuery, UpdateBranchInput } from "./branches.schema";

async function ensureAlias(branchId: string, brandId: string, rawName: string) {
  const normalizedName = normalizeBranchName(rawName);
  const existing = await prisma.branchNameAlias.findUnique({ where: { brandId_normalizedName: { brandId, normalizedName } } });
  if (existing) {
    if (existing.branchId !== branchId) {
      throw ApiError.conflict(`"${rawName}" is already registered as a name for another branch in this brand`);
    }
    return existing;
  }
  return prisma.branchNameAlias.create({ data: { branchId, brandId, rawName, normalizedName } });
}

async function getOwnedBranch(user: AccessTokenPayload, id: string) {
  const branch = await prisma.restaurantBranch.findUnique({ where: { id } });
  if (!branch) throw ApiError.notFound("Branch not found");
  assertBrandAccess(user, branch.brandId);
  return branch;
}

export async function listBranches(user: AccessTokenPayload, query: ListBranchesQuery) {
  const accessibleIds = getAccessibleBrandIds(user);

  if (query.brandId) {
    assertBrandAccess(user, query.brandId);
    return prisma.restaurantBranch.findMany({
      where: { brandId: query.brandId },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
  }

  return prisma.restaurantBranch.findMany({
    where: accessibleIds ? { brandId: { in: accessibleIds } } : {},
    orderBy: [{ brandId: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
  });
}

export async function createBranch(user: AccessTokenPayload, input: CreateBranchInput) {
  assertBrandAccess(user, input.brandId);

  const existing = await prisma.restaurantBranch.findUnique({
    where: { brandId_name: { brandId: input.brandId, name: input.name } },
  });
  if (existing) throw ApiError.conflict("A branch with this name already exists for this brand");

  const branch = await prisma.restaurantBranch.create({
    data: { brandId: input.brandId, name: input.name, openedAt: new Date(input.openedAt) },
  });
  await ensureAlias(branch.id, branch.brandId, branch.name);
  return branch;
}

export async function updateBranch(user: AccessTokenPayload, id: string, input: UpdateBranchInput) {
  const branch = await getOwnedBranch(user, id);

  const updated = await prisma.restaurantBranch.update({
    where: { id },
    data: {
      name: input.name,
      openedAt: input.openedAt ? new Date(input.openedAt) : undefined,
      closedAt: input.closedAt === undefined ? undefined : input.closedAt ? new Date(input.closedAt) : null,
      isActive: input.isActive,
      displayOrder: input.displayOrder,
    },
  });

  if (input.name && input.name !== branch.name) {
    await ensureAlias(updated.id, updated.brandId, updated.name);
  }

  return updated;
}

export async function listAliases(user: AccessTokenPayload, branchId: string) {
  await getOwnedBranch(user, branchId);
  return prisma.branchNameAlias.findMany({ where: { branchId }, orderBy: { createdAt: "asc" } });
}

export async function addAlias(user: AccessTokenPayload, branchId: string, input: AddAliasInput) {
  const branch = await getOwnedBranch(user, branchId);
  return ensureAlias(branch.id, branch.brandId, input.rawName);
}
