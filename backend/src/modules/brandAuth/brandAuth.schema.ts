import { z } from "zod";

export const brandSignupSchema = z.object({
  brandName: z.string().trim().min(2).max(150),
  brandNameAr: z.string().trim().min(2).max(150),
  ownerName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const brandLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type BrandSignupInput = z.infer<typeof brandSignupSchema>;
export type BrandLoginInput = z.infer<typeof brandLoginSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
