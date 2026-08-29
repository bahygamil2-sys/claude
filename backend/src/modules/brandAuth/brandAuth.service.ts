import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/ApiError";
import { generateRefreshToken, hashRefreshToken, refreshTokenExpiry, signAccessToken } from "../../lib/tokens";
import type { AcceptInviteInput, BrandLoginInput, BrandSignupInput } from "./brandAuth.schema";
import type { BrandUser } from "@prisma/client";

const BCRYPT_ROUNDS = 10;

export function sanitizeBrandUser<T extends { passwordHash: string | null }>(user: T) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

async function issueTokens(user: Pick<BrandUser, "id" | "brandId" | "role">) {
  const accessToken = signAccessToken({ sub: user.id, actorType: "BRAND_USER", brandId: user.brandId, role: user.role });
  const rawRefreshToken = generateRefreshToken();
  const tokenRow = await prisma.brandUserRefreshToken.create({
    data: { brandUserId: user.id, tokenHash: hashRefreshToken(rawRefreshToken), expiresAt: refreshTokenExpiry() },
  });
  return { accessToken, rawRefreshToken, refreshTokenId: tokenRow.id };
}

export async function signup(input: BrandSignupInput) {
  const existing = await prisma.brandUser.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const { brand, owner } = await prisma.$transaction(async (tx) => {
    const brand = await tx.brand.create({
      data: { name: input.brandName, nameAr: input.brandNameAr },
    });
    const owner = await tx.brandUser.create({
      data: {
        brandId: brand.id,
        email: input.email,
        passwordHash,
        name: input.ownerName,
        role: "OWNER",
        status: "ACTIVE",
      },
    });
    return { brand, owner };
  });

  const { accessToken, rawRefreshToken } = await issueTokens(owner);
  return { brand, user: sanitizeBrandUser(owner), accessToken, rawRefreshToken };
}

export async function login(input: BrandLoginInput) {
  const user = await prisma.brandUser.findUnique({ where: { email: input.email }, include: { brand: true } });
  if (!user || !user.passwordHash) throw ApiError.unauthorized("Invalid email or password");

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) throw ApiError.unauthorized("Invalid email or password");
  if (user.status === "DISABLED") throw ApiError.forbidden("This account has been disabled");
  if (user.status === "INVITED") throw ApiError.forbidden("Accept your invite before logging in");
  if (user.brand.status === "SUSPENDED") throw ApiError.forbidden("This brand's account has been suspended");

  const { accessToken, rawRefreshToken } = await issueTokens(user);
  return { user: sanitizeBrandUser(user), accessToken, rawRefreshToken };
}

export async function refresh(rawRefreshToken: string) {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const existing = await prisma.brandUserRefreshToken.findUnique({
    where: { tokenHash },
    include: { brandUser: { include: { brand: true } } },
  });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token is invalid or expired");
  }
  if (existing.brandUser.status !== "ACTIVE" || existing.brandUser.brand.status === "SUSPENDED") {
    throw ApiError.forbidden("This account no longer has access");
  }

  const { accessToken, rawRefreshToken: newRawRefreshToken, refreshTokenId } = await issueTokens(existing.brandUser);

  await prisma.brandUserRefreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), replacedByTokenId: refreshTokenId },
  });

  return { user: sanitizeBrandUser(existing.brandUser), accessToken, rawRefreshToken: newRawRefreshToken };
}

export async function logout(rawRefreshToken: string | undefined) {
  if (!rawRefreshToken) return;
  const tokenHash = hashRefreshToken(rawRefreshToken);
  await prisma.brandUserRefreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getMe(userId: string) {
  const user = await prisma.brandUser.findUnique({ where: { id: userId }, include: { brand: true } });
  if (!user) throw ApiError.notFound("Account not found");
  return sanitizeBrandUser(user);
}

export async function acceptInvite(input: AcceptInviteInput) {
  const user = await prisma.brandUser.findUnique({ where: { inviteToken: input.token } });
  if (!user || user.status !== "INVITED" || !user.inviteTokenExpiresAt || user.inviteTokenExpiresAt < new Date()) {
    throw ApiError.badRequest("This invite link is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const updated = await prisma.brandUser.update({
    where: { id: user.id },
    data: { passwordHash, status: "ACTIVE", inviteToken: null, inviteTokenExpiresAt: null },
  });

  const { accessToken, rawRefreshToken } = await issueTokens(updated);
  return { user: sanitizeBrandUser(updated), accessToken, rawRefreshToken };
}
