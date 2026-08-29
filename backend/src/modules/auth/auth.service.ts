import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import { generateRefreshToken, hashRefreshToken, refreshTokenExpiry, signAccessToken } from "../../lib/tokens";
import type { LoginInput, RegisterInput, UpdateMeInput } from "./auth.schema";

const BCRYPT_ROUNDS = 10;

export function sanitizeUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

async function issueTokens(user: { id: string; role: import("@prisma/client").Role }) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const rawRefreshToken = generateRefreshToken();
  const refreshTokenRow = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(rawRefreshToken),
      expiresAt: refreshTokenExpiry(),
    },
  });
  return { accessToken, rawRefreshToken, refreshTokenId: refreshTokenRow.id };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, name: input.name, phone: input.phone, role: input.role },
  });

  const { accessToken, rawRefreshToken } = await issueTokens(user);
  return { user: sanitizeUser(user), accessToken, rawRefreshToken };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) throw ApiError.unauthorized("Invalid email or password");
  if (!user.isActive) throw ApiError.forbidden("This account has been suspended");

  const { accessToken, rawRefreshToken } = await issueTokens(user);
  return { user: sanitizeUser(user), accessToken, rawRefreshToken };
}

export async function refresh(rawRefreshToken: string) {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token is invalid or expired");
  }
  if (!existing.user.isActive) throw ApiError.forbidden("This account has been suspended");

  const { accessToken, rawRefreshToken: newRawRefreshToken, refreshTokenId } = await issueTokens(existing.user);

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), replacedByTokenId: refreshTokenId },
  });

  return { user: sanitizeUser(existing.user), accessToken, rawRefreshToken: newRawRefreshToken };
}

export async function logout(rawRefreshToken: string | undefined) {
  if (!rawRefreshToken) return;
  const tokenHash = hashRefreshToken(rawRefreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");
  return sanitizeUser(user);
}

export async function updateMe(userId: string, input: UpdateMeInput) {
  const user = await prisma.user.update({ where: { id: userId }, data: input });
  return sanitizeUser(user);
}
