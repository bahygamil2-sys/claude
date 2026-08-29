import { z } from "zod";

export const brandUserIdParamSchema = z.object({ id: z.string().uuid() });

export const inviteBrandUserSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(2).max(100),
  branchIds: z.array(z.string().uuid()).default([]),
});

export const updateBrandUserSchema = z.object({
  branchIds: z.array(z.string().uuid()).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export type InviteBrandUserInput = z.infer<typeof inviteBrandUserSchema>;
export type UpdateBrandUserInput = z.infer<typeof updateBrandUserSchema>;
