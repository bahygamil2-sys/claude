import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import { generateTempPassword, hashPassword } from "../../lib/password";
import type { CreateUserInput, UpdateUserInput } from "./users.schema";

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  brandAccess: { brandId: string }[];
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    brandIds: user.brandAccess.map((a) => a.brandId),
  };
}

async function assertBrandsExist(brandIds: string[]) {
  if (brandIds.length === 0) return;
  const count = await prisma.brand.count({ where: { id: { in: brandIds } } });
  if (count !== brandIds.length) throw ApiError.badRequest("One or more brand ids don't exist");
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    include: { brandAccess: { select: { brandId: true } } },
    orderBy: { createdAt: "asc" },
  });
  return users.map(toPublicUser);
}

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("A user with this email already exists");

  const brandIds = input.role === "ADMIN" ? [] : input.brandIds;
  await assertBrandsExist(brandIds);

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash,
      mustChangePassword: true,
      brandAccess: { create: brandIds.map((brandId) => ({ brandId })) },
    },
    include: { brandAccess: { select: { brandId: true } } },
  });

  return { user: toPublicUser(user), tempPassword };
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("User not found");

  const nextRole = input.role ?? existing.role;
  const brandIds = input.brandIds === undefined ? undefined : nextRole === "ADMIN" ? [] : input.brandIds;
  if (brandIds) await assertBrandsExist(brandIds);

  const user = await prisma.$transaction(async (tx) => {
    if (brandIds !== undefined) {
      await tx.userBrandAccess.deleteMany({ where: { userId: id } });
      if (brandIds.length > 0) {
        await tx.userBrandAccess.createMany({ data: brandIds.map((brandId) => ({ userId: id, brandId })) });
      }
    }

    const updated = await tx.user.update({
      where: { id },
      data: { name: input.name, role: input.role, isActive: input.isActive },
      include: { brandAccess: { select: { brandId: true } } },
    });

    // Deactivating revokes every outstanding refresh token immediately —
    // otherwise the account stays usable until each token's own expiry,
    // since access tokens carry a snapshot that isn't re-checked mid-flight.
    if (input.isActive === false) {
      await tx.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    }

    return updated;
  });

  return toPublicUser(user);
}

export async function resetPassword(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound("User not found");

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { passwordHash, mustChangePassword: true } }),
    // Force re-login everywhere with the new password.
    prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);

  return { tempPassword };
}
