import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const listBranchesQuerySchema = z.object({
  brandId: z.string().min(1).optional(),
});

export const createBranchSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().min(1),
  openedAt: isoDate,
});

export const updateBranchSchema = z.object({
  name: z.string().min(1).optional(),
  openedAt: isoDate.optional(),
  closedAt: isoDate.nullable().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().nullable().optional(),
});

export const addAliasSchema = z.object({
  rawName: z.string().min(1),
});

export type ListBranchesQuery = z.infer<typeof listBranchesQuerySchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type AddAliasInput = z.infer<typeof addAliasSchema>;
