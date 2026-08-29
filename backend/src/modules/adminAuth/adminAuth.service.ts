import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import { generateRefreshToken, hashRefreshToken, refreshTokenExpiry, signAccessToken } from "../../lib/tokens";
import type { AdminLoginInput } from "./adminAuth.schema";

export function sanitizeAdmin<T extends { passwordHash: string }>(admin: T) {
  const { passwordHash: _passwordHash, ...rest } = admin;
  return rest;
}

async function issueTokens(adminId: string) {
  const accessToken = signAccessToken({ sub: adminId, actorType: "ADMIN" });
  const rawRefreshToken = generateRefreshToken();
  const tokenRow = await prisma.adminRefreshToken.create({
    data: { adminId, tokenHash: hashRefreshToken(rawRefreshToken), expiresAt: refreshTokenExpiry() },
  });
  return { accessToken, rawRefreshToken, refreshTokenId: tokenRow.id };
}

export async function login(input: AdminLoginInput) {
  const admin = await prisma.platformAdmin.findUnique({ where: { email: input.email } });
  if (!admin) throw ApiError.unauthorized("Invalid email or password");

  const passwordMatches = await bcrypt.compare(input.password, admin.passwordHash);
  if (!passwordMatches) throw ApiError.unauthorized("Invalid email or password");

  const { accessToken, rawRefreshToken } = await issueTokens(admin.id);
  return { admin: sanitizeAdmin(admin), accessToken, rawRefreshToken };
}

export async function refresh(rawRefreshToken: string) {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const existing = await prisma.adminRefreshToken.findUnique({ where: { tokenHash }, include: { admin: true } });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token is invalid or expired");
  }

  const { accessToken, rawRefreshToken: newRawRefreshToken, refreshTokenId } = await issueTokens(existing.admin.id);

  await prisma.adminRefreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), replacedByTokenId: refreshTokenId },
  });

  return { admin: sanitizeAdmin(existing.admin), accessToken, rawRefreshToken: newRawRefreshToken };
}

export async function logout(rawRefreshToken: string | undefined) {
  if (!rawRefreshToken) return;
  const tokenHash = hashRefreshToken(rawRefreshToken);
  await prisma.adminRefreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getMe(adminId: string) {
  const admin = await prisma.platformAdmin.findUnique({ where: { id: adminId } });
  if (!admin) throw ApiError.notFound("Admin not found");
  return sanitizeAdmin(admin);
}
