import { z } from "zod";

export const branchIdParamSchema = z.object({ id: z.string().uuid() });

export const createBranchSchema = z.object({
  name: z.string().trim().min(2).max(150),
  nameAr: z.string().trim().min(2).max(150),
  address: z.string().trim().min(2).max(300),
  addressAr: z.string().trim().min(2).max(300),
  city: z.string().trim().min(1).max(100),
  cityAr: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(30).optional(),
});

export const updateBranchSchema = createBranchSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
