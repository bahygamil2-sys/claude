import { Prisma, Role, RestaurantStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import { assertOwnerOrAdmin } from "../../lib/authz";
import { slugify, uniqueSlug } from "../../lib/slugify";
import type { CreateRestaurantInput, ListRestaurantsQuery, UpdateRestaurantInput, UpdateRestaurantStatusInput } from "./restaurants.schema";

const SORT_MAP: Record<ListRestaurantsQuery["sort"], Prisma.RestaurantOrderByWithRelationInput> = {
  rating: { ratingAvg: "desc" },
  deliveryTime: { avgPreparationTimeMinutes: "asc" },
  minOrder: { minOrderAmount: "asc" },
};

export async function listPublic(query: ListRestaurantsQuery) {
  const where: Prisma.RestaurantWhereInput = {
    status: RestaurantStatus.APPROVED,
    ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
    ...(query.categoryId ? { categories: { some: { id: query.categoryId } } } : {}),
    ...(query.search
      ? { OR: [{ name: { contains: query.search, mode: "insensitive" } }, { nameAr: { contains: query.search, mode: "insensitive" } }] }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      orderBy: SORT_MAP[query.sort],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { categories: true },
    }),
    prisma.restaurant.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) };
}

export async function getByIdOrSlug(idOrSlug: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: { categories: true },
  });
  if (!restaurant) throw ApiError.notFound("Restaurant not found");
  return restaurant;
}

export async function getMine(ownerId: string) {
  return prisma.restaurant.findMany({ where: { ownerId }, include: { categories: true }, orderBy: { createdAt: "desc" } });
}

export async function getOwnedOrThrow(id: string, user: { id: string; role: Role }) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) throw ApiError.notFound("Restaurant not found");
  assertOwnerOrAdmin(restaurant.ownerId, user);
  return restaurant;
}

export async function create(ownerId: string, input: CreateRestaurantInput) {
  const baseSlug = slugify(input.name);
  const slug = await uniqueSlug(baseSlug, async (candidate) => {
    const existing = await prisma.restaurant.findUnique({ where: { slug: candidate } });
    return Boolean(existing);
  });

  const { categoryIds, ...rest } = input;
  return prisma.restaurant.create({
    data: {
      ...rest,
      slug,
      ownerId,
      status: RestaurantStatus.PENDING,
      categories: { connect: categoryIds.map((id) => ({ id })) },
    },
    include: { categories: true },
  });
}

export async function update(id: string, user: { id: string; role: Role }, input: UpdateRestaurantInput) {
  await getOwnedOrThrow(id, user);
  const { categoryIds, ...rest } = input;
  return prisma.restaurant.update({
    where: { id },
    data: {
      ...rest,
      ...(categoryIds ? { categories: { set: categoryIds.map((catId) => ({ id: catId })) } } : {}),
    },
    include: { categories: true },
  });
}

export async function updateStatus(id: string, input: UpdateRestaurantStatusInput) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) throw ApiError.notFound("Restaurant not found");
  return prisma.restaurant.update({ where: { id }, data: { status: input.status } });
}

export async function getMenu(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) throw ApiError.notFound("Restaurant not found");

  const menuCategories = await prisma.menuCategory.findMany({
    where: { restaurantId },
    orderBy: { sortOrder: "asc" },
    include: {
      menuItems: {
        orderBy: { sortOrder: "asc" },
        include: { optionGroups: { orderBy: { sortOrder: "asc" }, include: { options: { orderBy: { sortOrder: "asc" } } } } },
      },
    },
  });

  const uncategorized = await prisma.menuItem.findMany({
    where: { restaurantId, menuCategoryId: null },
    orderBy: { sortOrder: "asc" },
    include: { optionGroups: { orderBy: { sortOrder: "asc" }, include: { options: { orderBy: { sortOrder: "asc" } } } } },
  });

  return { menuCategories, uncategorized };
}
