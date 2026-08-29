import { OrderStatus, Prisma } from "@prisma/client";

export type ReportRange = { dateFrom?: Date; dateTo?: Date };
export type GroupBy = "day" | "week" | "month";

export type OrderFilterOpts = ReportRange & {
  status?: OrderStatus;
  restaurantId?: string;
  city?: string;
  categoryId?: string;
};

/**
 * Shared filter for report aggregates: revenue/order-count numbers exclude CANCELLED orders
 * by default (an abandoned order isn't "business volume"), unless a specific status is requested.
 */
export function reportOrderWhere(opts: OrderFilterOpts): Prisma.OrderWhereInput {
  return {
    ...(opts.restaurantId ? { restaurantId: opts.restaurantId } : {}),
    ...(opts.city ? { restaurant: { city: { equals: opts.city, mode: "insensitive" } } } : {}),
    ...(opts.categoryId ? { restaurant: { categories: { some: { id: opts.categoryId } } } } : {}),
    ...(opts.dateFrom || opts.dateTo ? { createdAt: { gte: opts.dateFrom, lte: opts.dateTo } } : {}),
    ...(opts.status ? { status: opts.status } : { status: { not: OrderStatus.CANCELLED } }),
  };
}

export function formatRange(opts: ReportRange) {
  return { dateFrom: opts.dateFrom?.toISOString() ?? null, dateTo: opts.dateTo?.toISOString() ?? null };
}

/** UTC-based bucket key (day: YYYY-MM-DD, week: Monday's YYYY-MM-DD, month: YYYY-MM). */
export function bucketKey(date: Date, groupBy: GroupBy): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  if (groupBy === "month") return d.toISOString().slice(0, 7);
  if (groupBy === "week") {
    const dayOfWeek = d.getUTCDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    d.setUTCDate(d.getUTCDate() - diffToMonday);
  }
  return d.toISOString().slice(0, 10);
}

export function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
