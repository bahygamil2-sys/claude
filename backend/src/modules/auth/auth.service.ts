import type { User } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import { resolveBrandIdsForUser } from "../../lib/rbac";
import { hashPassword, verifyPassword } from "../../lib/password";
import { generateRefreshToken, hashToken, refreshTokenExpiry, signAccessToken, type AccessTokenPayload } from "../../lib/tokens";
import type { ChangePasswordInput, LoginInput } from "./auth.schema";

function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt,
  };
}

async function issueTokenPair(user: User, meta: { userAgent?: string; ipAddress?: string }) {
  const brandIds = await resolveBrandIdsForUser(user.id, user.role);
  const accessToken = signAccessToken({ sub: user.id, role: user.role, brandIds });

  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiry(),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    },
  });

  return { accessToken, refreshToken };
}

export async function login(input: LoginInput, meta: { userAgent?: string; ipAddress?: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw ApiError.unauthorized("Incorrect email or password");

  const passwordOk = await verifyPassword(input.password, user.passwordHash);
  if (!passwordOk) throw ApiError.unauthorized("Incorrect email or password");

  if (!user.isActive) throw ApiError.forbidden("This account has been deactivated");

  const { accessToken, refreshToken } = await issueTokenPair(user, meta);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return { user: toPublicUser(user), accessToken, refreshToken };
}

export async function refresh(rawToken: string | undefined, meta: { userAgent?: string; ipAddress?: string }) {
  if (!rawToken) throw ApiError.unauthorized("Missing refresh token");

  const tokenHash = hashToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token is invalid or expired");
  }

  // The real enforcement point for deactivation/role changes — access tokens
  // are short-lived but outlive a single request, so this is where a
  // deactivated account or a since-changed role actually takes effect.
  if (!existing.user.isActive) throw ApiError.forbidden("This account has been deactivated");

  const { accessToken, refreshToken } = await issueTokenPair(existing.user, meta);
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  return { user: toPublicUser(existing.user), accessToken, refreshToken };
}

export async function logout(rawToken: string | undefined) {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function me(payload: AccessTokenPayload) {
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw ApiError.unauthorized();
  return { ...toPublicUser(user), brandIds: payload.brandIds };
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");

  const currentOk = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!currentOk) throw ApiError.badRequest("Current password is incorrect");

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash, mustChangePassword: false } });
}
