import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import type { CreateMenuCategoryInput, CreateMenuItemInput, UpdateMenuCategoryInput, UpdateMenuItemInput } from "./menu.schema";

const ITEM_INCLUDE = { optionGroups: { include: { options: true } } } as const;

async function assertItemBelongsToRestaurant(restaurantId: string, itemId: string) {
  const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
  if (!item || item.restaurantId !== restaurantId) throw ApiError.notFound("Menu item not found");
  return item;
}

async function assertCategoryBelongsToRestaurant(restaurantId: string, categoryId: string) {
  const category = await prisma.menuCategory.findUnique({ where: { id: categoryId } });
  if (!category || category.restaurantId !== restaurantId) throw ApiError.notFound("Menu category not found");
  return category;
}

export async function listCategories(restaurantId: string) {
  return prisma.menuCategory.findMany({ where: { restaurantId }, orderBy: { sortOrder: "asc" } });
}

export async function createCategory(restaurantId: string, input: CreateMenuCategoryInput) {
  return prisma.menuCategory.create({ data: { ...input, restaurantId } });
}

export async function updateCategory(restaurantId: string, categoryId: string, input: UpdateMenuCategoryInput) {
  await assertCategoryBelongsToRestaurant(restaurantId, categoryId);
  return prisma.menuCategory.update({ where: { id: categoryId }, data: input });
}

export async function deleteCategory(restaurantId: string, categoryId: string) {
  await assertCategoryBelongsToRestaurant(restaurantId, categoryId);
  await prisma.menuCategory.delete({ where: { id: categoryId } });
}

export async function createItem(restaurantId: string, input: CreateMenuItemInput) {
  const { optionGroups, ...rest } = input;
  return prisma.menuItem.create({
    data: {
      ...rest,
      restaurantId,
      optionGroups: {
        create: optionGroups.map((g) => ({
          name: g.name,
          nameAr: g.nameAr,
          isRequired: g.isRequired,
          minSelect: g.minSelect,
          maxSelect: g.maxSelect,
          options: { create: g.options.map((o, idx) => ({ ...o, sortOrder: idx })) },
        })),
      },
    },
    include: ITEM_INCLUDE,
  });
}

export async function updateItem(restaurantId: string, itemId: string, input: UpdateMenuItemInput) {
  await assertItemBelongsToRestaurant(restaurantId, itemId);
  const { optionGroups, ...rest } = input;

  return prisma.$transaction(async (tx) => {
    if (optionGroups !== undefined) {
      await tx.menuItemOptionGroup.deleteMany({ where: { menuItemId: itemId } });
    }
    return tx.menuItem.update({
      where: { id: itemId },
      data: {
        ...rest,
        ...(optionGroups !== undefined
          ? {
              optionGroups: {
                create: optionGroups.map((g) => ({
                  name: g.name,
                  nameAr: g.nameAr,
                  isRequired: g.isRequired,
                  minSelect: g.minSelect,
                  maxSelect: g.maxSelect,
                  options: { create: g.options.map((o, idx) => ({ ...o, sortOrder: idx })) },
                })),
              },
            }
          : {}),
      },
      include: ITEM_INCLUDE,
    });
  });
}

export async function deleteItem(restaurantId: string, itemId: string) {
  await assertItemBelongsToRestaurant(restaurantId, itemId);
  await prisma.menuItem.delete({ where: { id: itemId } });
}

export async function setAvailability(restaurantId: string, itemId: string, isAvailable: boolean) {
  await assertItemBelongsToRestaurant(restaurantId, itemId);
  return prisma.menuItem.update({ where: { id: itemId }, data: { isAvailable } });
}
