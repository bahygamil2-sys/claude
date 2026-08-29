import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import { generateInviteToken } from "../../lib/tokens";
import { assertBranchesBelongToBrand } from "../../lib/branchAccess";
import type { BrandAccessTokenPayload } from "../../lib/tokens";
import type { InviteBrandUserInput, UpdateBrandUserInput } from "./brandUsers.schema";

const INVITE_TTL_DAYS = 7;

function sanitize<T extends { passwordHash: string | null }>(user: T) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function list(user: BrandAccessTokenPayload) {
  const users = await prisma.brandUser.findMany({
    where: { brandId: user.brandId },
    include: { branchAccess: { select: { branchId: true } } },
    orderBy: { createdAt: "asc" },
  });
  return users.map(sanitize);
}

export async function invite(user: BrandAccessTokenPayload, input: InviteBrandUserInput) {
  const existing = await prisma.brandUser.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  await assertBranchesBelongToBrand(user.brandId, input.branchIds);

  const inviteTokenExpiresAt = new Date();
  inviteTokenExpiresAt.setDate(inviteTokenExpiresAt.getDate() + INVITE_TTL_DAYS);

  const created = await prisma.brandUser.create({
    data: {
      brandId: user.brandId,
      email: input.email,
      name: input.name,
      role: "MANAGER",
      status: "INVITED",
      inviteToken: generateInviteToken(),
      inviteTokenExpiresAt,
      branchAccess: { create: input.branchIds.map((branchId) => ({ branchId })) },
    },
  });

  return sanitize(created);
}

export async function update(user: BrandAccessTokenPayload, targetId: string, input: UpdateBrandUserInput) {
  const target = await prisma.brandUser.findFirst({ where: { id: targetId, brandId: user.brandId } });
  if (!target) throw ApiError.notFound("Team member not found");
  if (target.role === "OWNER") throw ApiError.forbidden("The brand owner's access cannot be modified here");

  if (input.branchIds) {
    await assertBranchesBelongToBrand(user.brandId, input.branchIds);
    await prisma.$transaction([
      prisma.brandUserBranch.deleteMany({ where: { brandUserId: targetId } }),
      prisma.brandUserBranch.createMany({ data: input.branchIds.map((branchId) => ({ brandUserId: targetId, branchId })) }),
    ]);
  }

  const updated = await prisma.brandUser.update({
    where: { id: targetId },
    data: { ...(input.status ? { status: input.status } : {}) },
    include: { branchAccess: { select: { branchId: true } } },
  });

  return sanitize(updated);
}
