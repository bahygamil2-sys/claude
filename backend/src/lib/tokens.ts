import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { BrandRole } from "@prisma/client";
import { env } from "../config/env";

export type AdminAccessTokenPayload = { sub: string; actorType: "ADMIN" };
export type BrandAccessTokenPayload = { sub: string; actorType: "BRAND_USER"; brandId: string; role: BrandRole };
export type AccessTokenPayload = AdminAccessTokenPayload | BrandAccessTokenPayload;

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m` });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

/** Opaque, high-entropy refresh token. Only its SHA-256 hash is ever persisted. */
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export function hashRefreshToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function refreshTokenExpiry(): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + env.REFRESH_TOKEN_TTL_DAYS);
  return expires;
}

/** Opaque token for the brand-user invite-acceptance link (not a JWT — one-time, DB-checked). */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
