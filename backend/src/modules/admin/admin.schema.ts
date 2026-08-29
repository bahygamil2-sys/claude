import { z } from "zod";
import { RestaurantStatus, Role } from "@prisma/client";

export const userIdParamSchema = z.object({ id: z.string().uuid() });

export const listUsersQuerySchema = z.object({
  role: z.nativeEnum(Role).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const updateUserStatusSchema = z.object({ isActive: z.boolean() });

export const adminListRestaurantsQuerySchema = z.object({
  status: z.nativeEnum(RestaurantStatus).optional(),
  city: z.string().trim().optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
});
