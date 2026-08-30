import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import { assertBrandAccess, getAccessibleBrandIds } from "../../lib/rbac";
import type { AccessTokenPayload } from "../../lib/tokens";
import type { CreateBrandInput, UpdateBrandInput } from "./brands.schema";

export async function listBrands(user: AccessTokenPayload) {
  const accessibleIds = getAccessibleBrandIds(user);
  return prisma.brand.findMany({
    where: accessibleIds ? { id: { in: accessibleIds } } : {},
    orderBy: { name: "asc" },
  });
}

export async function getBrand(user: AccessTokenPayload, id: string) {
  assertBrandAccess(user, id);
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) throw ApiError.notFound("Brand not found");
  return brand;
}

export async function createBrand(input: CreateBrandInput) {
  const existing = await prisma.brand.findUnique({ where: { slug: input.slug } });
  if (existing) throw ApiError.conflict("A brand with this slug already exists");
  return prisma.brand.create({ data: input });
}

export async function updateBrand(id: string, input: UpdateBrandInput) {
  const existing = await prisma.brand.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Brand not found");

  if (input.slug && input.slug !== existing.slug) {
    const slugTaken = await prisma.brand.findUnique({ where: { slug: input.slug } });
    if (slugTaken) throw ApiError.conflict("A brand with this slug already exists");
  }

  return prisma.brand.update({ where: { id }, data: input });
}
