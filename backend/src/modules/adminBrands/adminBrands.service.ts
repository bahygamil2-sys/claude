import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import type { ListBrandsQuery, UpdateBrandStatusInput } from "./adminBrands.schema";

export async function list(query: ListBrandsQuery) {
  const where: Prisma.BrandWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? { OR: [{ name: { contains: query.search, mode: "insensitive" } }, { nameAr: { contains: query.search, mode: "insensitive" } }] }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { _count: { select: { branches: true, surveys: true, users: true } } },
    }),
    prisma.brand.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) };
}

export async function getOne(id: string) {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      branches: { orderBy: { createdAt: "desc" } },
      users: { select: { id: true, email: true, name: true, role: true, status: true, createdAt: true } },
      _count: { select: { surveys: true } },
    },
  });
  if (!brand) throw ApiError.notFound("Brand not found");
  return brand;
}

export async function updateStatus(id: string, input: UpdateBrandStatusInput) {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) throw ApiError.notFound("Brand not found");
  return prisma.brand.update({ where: { id }, data: { status: input.status } });
}
