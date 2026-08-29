import { z } from "zod";
import { RestaurantStatus } from "@prisma/client";

export const restaurantIdParamSchema = z.object({ id: z.string().uuid() });
export const restaurantIdOrSlugParamSchema = z.object({ idOrSlug: z.string().min(1) });

export const listRestaurantsQuerySchema = z.object({
  city: z.string().trim().optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(["rating", "deliveryTime", "minOrder"]).optional().default("rating"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const createRestaurantSchema = z.object({
  name: z.string().trim().min(2).max(150),
  nameAr: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000).optional(),
  descriptionAr: z.string().trim().max(1000).optional(),
  city: z.string().trim().min(1).max(100),
  area: z.string().trim().max(100).optional(),
  addressLine: z.string().trim().min(1).max(250),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  phone: z.string().trim().min(6).max(30),
  deliveryFee: z.coerce.number().min(0),
  minOrderAmount: z.coerce.number().min(0),
  logoUrl: z.string().trim().url().optional(),
  coverImageUrl: z.string().trim().url().optional(),
  categoryIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateRestaurantSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  nameAr: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(1000).optional(),
  descriptionAr: z.string().trim().max(1000).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  area: z.string().trim().max(100).optional(),
  addressLine: z.string().trim().min(1).max(250).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  phone: z.string().trim().min(6).max(30).optional(),
  deliveryFee: z.coerce.number().min(0).optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  avgPreparationTimeMinutes: z.coerce.number().int().min(1).max(180).optional(),
  isOpen: z.boolean().optional(),
  openTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
  closeTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
  logoUrl: z.string().trim().url().optional(),
  coverImageUrl: z.string().trim().url().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
});

export const updateRestaurantStatusSchema = z.object({
  status: z.nativeEnum(RestaurantStatus),
  reason: z.string().trim().max(300).optional(),
});

export type ListRestaurantsQuery = z.infer<typeof listRestaurantsQuerySchema>;
export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type UpdateRestaurantStatusInput = z.infer<typeof updateRestaurantStatusSchema>;
