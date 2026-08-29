import { z } from "zod";

export const updateBrandSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  nameAr: z.string().trim().min(2).max(150).optional(),
  logoUrl: z.string().trim().url().optional(),
  description: z.string().trim().max(2000).optional(),
  descriptionAr: z.string().trim().max(2000).optional(),
});

export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
