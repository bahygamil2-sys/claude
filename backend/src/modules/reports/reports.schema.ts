import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { dateFromField, dateToField } from "../../lib/zodDateRange";

const rangeFields = {
  dateFrom: dateFromField,
  dateTo: dateToField,
};
const groupByField = { groupBy: z.enum(["day", "week", "month"]).optional().default("day") };
const limitField = { limit: z.coerce.number().int().min(1).max(50).optional().default(10) };

export const restaurantSummaryQuerySchema = z.object({ ...rangeFields, status: z.nativeEnum(OrderStatus).optional() });
export const restaurantSalesOverTimeQuerySchema = z.object({ ...rangeFields, ...groupByField });
export const restaurantTopItemsQuerySchema = z.object({ ...rangeFields, ...limitField });
export const restaurantRangeOnlyQuerySchema = z.object({ ...rangeFields });

const adminScopeFields = {
  city: z.string().trim().optional(),
  categoryId: z.string().uuid().optional(),
  restaurantId: z.string().uuid().optional(),
};

export const adminOverviewQuerySchema = z.object({ ...rangeFields, city: z.string().trim().optional(), categoryId: z.string().uuid().optional() });
export const adminSalesOverTimeQuerySchema = z.object({ ...rangeFields, ...groupByField, ...adminScopeFields });
export const adminOrdersByStatusQuerySchema = z.object({ ...rangeFields, ...adminScopeFields });
export const adminTopRestaurantsQuerySchema = z.object({
  ...rangeFields,
  ...limitField,
  city: z.string().trim().optional(),
  categoryId: z.string().uuid().optional(),
});
export const adminTopCategoriesQuerySchema = z.object({ ...rangeFields, ...limitField, city: z.string().trim().optional() });
export const adminNewSignupsQuerySchema = z.object({ ...rangeFields, ...groupByField });
export const adminLiveActivityQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).optional().default(20) });
