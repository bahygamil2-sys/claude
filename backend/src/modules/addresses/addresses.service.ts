import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import type { CreateAddressInput, UpdateAddressInput } from "./addresses.schema";

async function getOwnedOrThrow(userId: string, addressId: string) {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) throw ApiError.notFound("Address not found");
  return address;
}

export async function listMine(userId: string) {
  return prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
}

export async function create(userId: string, input: CreateAddressInput) {
  const existingCount = await prisma.address.count({ where: { userId } });
  const shouldBeDefault = input.isDefault || existingCount === 0;

  if (shouldBeDefault) {
    await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }

  return prisma.address.create({ data: { ...input, userId, isDefault: shouldBeDefault } });
}

export async function update(userId: string, addressId: string, input: UpdateAddressInput) {
  await getOwnedOrThrow(userId, addressId);

  if (input.isDefault) {
    await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }

  return prisma.address.update({ where: { id: addressId }, data: input });
}

export async function remove(userId: string, addressId: string) {
  const address = await getOwnedOrThrow(userId, addressId);
  await prisma.address.delete({ where: { id: addressId } });

  if (address.isDefault) {
    const fallback = await prisma.address.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
    if (fallback) await prisma.address.update({ where: { id: fallback.id }, data: { isDefault: true } });
  }
}

export async function setDefault(userId: string, addressId: string) {
  await getOwnedOrThrow(userId, addressId);
  await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  return prisma.address.update({ where: { id: addressId }, data: { isDefault: true } });
}
