import { prisma } from "../../lib/prisma";

export async function listByRestaurant(restaurantId: string, page: number, pageSize: number) {
  const where = { restaurantId };
  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { customer: { select: { name: true } } },
    }),
    prisma.review.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
