import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import type { UpdateBrandInput } from "./brands.schema";

export async function getOwnBrand(brandId: string) {
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) throw ApiError.notFound("Brand not found");
  return brand;
}

export async function updateOwnBrand(brandId: string, input: UpdateBrandInput) {
  return prisma.brand.update({ where: { id: brandId }, data: input });
}
