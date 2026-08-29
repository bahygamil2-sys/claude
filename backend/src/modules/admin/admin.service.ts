import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import { sanitizeUser } from "../auth/auth.service";
import type { adminListRestaurantsQuerySchema, listUsersQuerySchema } from "./admin.schema";
import type { z } from "zod";

export async function listUsers(query: z.infer<typeof listUsersQuerySchema>) {
  const where: Prisma.UserWhereInput = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.search
      ? { OR: [{ name: { contains: query.search, mode: "insensitive" } }, { email: { contains: query.search, mode: "insensitive" } }] }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { items: items.map(sanitizeUser), total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) };
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");
  const updated = await prisma.user.update({ where: { id: userId }, data: { isActive } });
  return sanitizeUser(updated);
}

export async function listRestaurants(query: z.infer<typeof adminListRestaurantsQuerySchema>) {
  const where: Prisma.RestaurantWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
    ...(query.categoryId ? { categories: { some: { id: query.categoryId } } } : {}),
    ...(query.search
      ? { OR: [{ name: { contains: query.search, mode: "insensitive" } }, { nameAr: { contains: query.search, mode: "insensitive" } }] }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { categories: true, owner: { select: { name: true, email: true, phone: true } } },
    }),
    prisma.restaurant.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) };
}
