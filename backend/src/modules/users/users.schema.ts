import { z } from "zod";

const roleEnum = z.enum(["ADMIN", "EDITOR", "VIEWER"]);

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: roleEnum,
  brandIds: z.array(z.string()).default([]),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: roleEnum.optional(),
  brandIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
