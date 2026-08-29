import { z } from "zod";

export const restaurantIdParamSchema = z.object({ id: z.string().uuid() });
export const menuCategoryParamSchema = z.object({ id: z.string().uuid(), categoryId: z.string().uuid() });
export const menuItemParamSchema = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });

export const createMenuCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  nameAr: z.string().trim().min(1).max(100),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export const updateMenuCategorySchema = createMenuCategorySchema.partial();

const optionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  nameAr: z.string().trim().min(1).max(100),
  priceDelta: z.coerce.number().default(0),
});

const optionGroupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  nameAr: z.string().trim().min(1).max(100),
  isRequired: z.boolean().optional().default(false),
  minSelect: z.coerce.number().int().min(0).optional().default(0),
  maxSelect: z.coerce.number().int().min(1).optional().default(1),
  options: z.array(optionSchema).min(1),
});

export const createMenuItemSchema = z.object({
  menuCategoryId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(150),
  nameAr: z.string().trim().min(1).max(150),
  description: z.string().trim().max(500).optional(),
  descriptionAr: z.string().trim().max(500).optional(),
  price: z.coerce.number().min(0),
  imageUrl: z.string().trim().url().optional(),
  isVegetarian: z.boolean().optional().default(false),
  sortOrder: z.coerce.number().int().optional().default(0),
  optionGroups: z.array(optionGroupSchema).optional().default([]),
});

export const updateMenuItemSchema = z.object({
  menuCategoryId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(150).optional(),
  nameAr: z.string().trim().min(1).max(150).optional(),
  description: z.string().trim().max(500).optional(),
  descriptionAr: z.string().trim().max(500).optional(),
  price: z.coerce.number().min(0).optional(),
  imageUrl: z.string().trim().url().optional(),
  isVegetarian: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  optionGroups: z.array(optionGroupSchema).optional(),
});

export const setAvailabilitySchema = z.object({ isAvailable: z.boolean() });

export type CreateMenuCategoryInput = z.infer<typeof createMenuCategorySchema>;
export type UpdateMenuCategoryInput = z.infer<typeof updateMenuCategorySchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
