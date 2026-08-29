import { Role } from "@prisma/client";
import { ApiError } from "./ApiError";

type AuthUser = { id: string; role: Role };

/** Throws 403 unless the requester owns the resource (by matching id) or is an admin. */
export function assertOwnerOrAdmin(resourceOwnerId: string, user: AuthUser) {
  if (user.role === Role.ADMIN) return;
  if (user.id === resourceOwnerId) return;
  throw ApiError.forbidden();
}
