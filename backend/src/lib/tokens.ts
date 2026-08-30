import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { config } from "../config";

// Access token claims are a snapshot taken at issuance (login or refresh) —
// not re-checked against the DB on every request. That's a deliberate
// tradeoff for a short (15min) TTL: a revoked brand assignment or a
// deactivated account takes effect on the next refresh, not instantly. The
// refresh endpoint re-checks `isActive` on every rotation, which is the real
// enforcement point for deactivation.
export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  brandIds: string[]; // ignored when role === 'ADMIN' (global by role)
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwtAccessSecret, { expiresIn: `${config.accessTokenTtlMinutes}m` });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwtAccessSecret) as AccessTokenPayload;
}

// Refresh tokens are opaque random strings, never JWTs — the DB row (hash,
// expiry, revocation, rotation chain) is the actual source of truth, so a
// token can be revoked before its nominal expiry.
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + config.refreshTokenTtlDays);
  return d;
}
