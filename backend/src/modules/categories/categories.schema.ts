import { z } from "zod";

export const categoryIdParamSchema = z.object({ id: z.string().uuid() });

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  nameAr: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  imageUrl: z.string().trim().url().optional(),
  icon: z.string().trim().max(10).optional(),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
