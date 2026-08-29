import { z } from "zod";

export const brandIdParamSchema = z.object({ id: z.string().uuid() });

export const updateBrandStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export const listBrandsQuerySchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type UpdateBrandStatusInput = z.infer<typeof updateBrandStatusSchema>;
export type ListBrandsQuery = z.infer<typeof listBrandsQuerySchema>;
