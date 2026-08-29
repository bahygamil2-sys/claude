import { z } from "zod";

export const addressIdParamSchema = z.object({ id: z.string().uuid() });

export const createAddressSchema = z.object({
  label: z.string().trim().min(1).max(50),
  city: z.string().trim().min(1).max(100),
  area: z.string().trim().max(100).optional(),
  street: z.string().trim().min(1).max(200),
  building: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(300).optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
