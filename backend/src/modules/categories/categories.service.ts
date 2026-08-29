import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import type { CreateCategoryInput, UpdateCategoryInput } from "./categories.schema";

export async function listAll() {
  return prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function create(input: CreateCategoryInput) {
  const existing = await prisma.category.findUnique({ where: { slug: input.slug } });
  if (existing) throw ApiError.conflict("A category with this slug already exists");
  return prisma.category.create({ data: input });
}

export async function update(id: string, input: UpdateCategoryInput) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound("Category not found");
  return prisma.category.update({ where: { id }, data: input });
}

export async function remove(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound("Category not found");
  await prisma.category.delete({ where: { id } });
}
