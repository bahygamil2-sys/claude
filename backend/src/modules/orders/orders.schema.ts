import { z } from "zod";
import { OrderStatus, PaymentMethod } from "@prisma/client";
import { dateFromField, dateToField } from "../../lib/zodDateRange";

export const orderIdParamSchema = z.object({ id: z.string().uuid() });

export const createOrderSchema = z.object({
  restaurantId: z.string().uuid(),
  addressId: z.string().uuid(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.coerce.number().int().min(1).max(20),
        selectedOptionIds: z.array(z.string().uuid()).optional().default([]),
      })
    )
    .min(1)
    .max(30),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().trim().max(300).optional(),
});

const dateRangeQuery = {
  dateFrom: dateFromField,
  dateTo: dateToField,
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
};

export const listMyOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  ...dateRangeQuery,
});

export const restaurantOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  ...dateRangeQuery,
});

export const adminOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  restaurantId: z.string().uuid().optional(),
  city: z.string().trim().optional(),
  ...dateRangeQuery,
});

export const updateOrderStatusSchema = z.object({ status: z.nativeEnum(OrderStatus) });
export const cancelOrderSchema = z.object({ reason: z.string().trim().max(300).optional() });
export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ListMyOrdersQuery = z.infer<typeof listMyOrdersQuerySchema>;
export type RestaurantOrdersQuery = z.infer<typeof restaurantOrdersQuerySchema>;
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
