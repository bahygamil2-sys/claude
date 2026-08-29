import { Prisma, Role, RestaurantStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { bucketKey, formatRange, GroupBy, reportOrderWhere, ReportRange, startOfTodayUTC } from "./reports.util";

type ScopeFilter = { city?: string; categoryId?: string };

function restaurantWhere(scope: ScopeFilter): Prisma.RestaurantWhereInput {
  return {
    ...(scope.city ? { city: { equals: scope.city, mode: "insensitive" } } : {}),
    ...(scope.categoryId ? { categories: { some: { id: scope.categoryId } } } : {}),
  };
}

export async function overview(range: ReportRange & ScopeFilter) {
  const where = reportOrderWhere(range);
  const orders = await prisma.order.findMany({ where, select: { total: true } });
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

  const rWhere = restaurantWhere(range);
  const [totalRestaurants, activeRestaurants, pendingRestaurants, totalCustomers] = await Promise.all([
    prisma.restaurant.count({ where: rWhere }),
    prisma.restaurant.count({ where: { ...rWhere, status: RestaurantStatus.APPROVED } }),
    prisma.restaurant.count({ where: { ...rWhere, status: RestaurantStatus.PENDING } }),
    prisma.user.count({ where: { role: Role.CUSTOMER } }),
  ]);

  const todayWhere = reportOrderWhere({ ...range, dateFrom: startOfTodayUTC(), dateTo: undefined });
  const todaysOrders = await prisma.order.findMany({ where: todayWhere, select: { total: true } });

  return {
    range: formatRange(range),
    totalOrders,
    totalRevenue,
    avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    totalRestaurants,
    activeRestaurants,
    pendingRestaurants,
    totalCustomers,
    ordersToday: todaysOrders.length,
    revenueToday: todaysOrders.reduce((sum, o) => sum + Number(o.total), 0),
  };
}

export async function salesOverTime(range: ReportRange & { groupBy: GroupBy } & ScopeFilter & { restaurantId?: string }) {
  const where = reportOrderWhere(range);
  const orders = await prisma.order.findMany({ where, select: { createdAt: true, total: true } });

  const buckets = new Map<string, { orders: number; revenue: number }>();
  for (const order of orders) {
    const key = bucketKey(order.createdAt, range.groupBy);
    const entry = buckets.get(key) ?? { orders: 0, revenue: 0 };
    entry.orders += 1;
    entry.revenue += Number(order.total);
    buckets.set(key, entry);
  }

  const series = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucket, v]) => ({ bucket, orders: v.orders, revenue: v.revenue }));

  return { range: formatRange(range), groupBy: range.groupBy, series };
}

export async function ordersByStatus(range: ReportRange & ScopeFilter & { restaurantId?: string }) {
  const where: Prisma.OrderWhereInput = {
    ...(range.restaurantId ? { restaurantId: range.restaurantId } : {}),
    ...(range.city ? { restaurant: { city: { equals: range.city, mode: "insensitive" } } } : {}),
    ...(range.categoryId ? { restaurant: { categories: { some: { id: range.categoryId } } } } : {}),
    createdAt: { gte: range.dateFrom, lte: range.dateTo },
  };
  const grouped = await prisma.order.groupBy({ by: ["status"], where, _count: true });
  return { range: formatRange(range), breakdown: grouped.map((g) => ({ status: g.status, count: g._count })) };
}

export async function topRestaurants(range: ReportRange & ScopeFilter & { limit: number }) {
  const where = reportOrderWhere(range);
  const orders = await prisma.order.findMany({ where, select: { restaurantId: true, total: true } });

  const byRestaurant = new Map<string, { orderCount: number; revenue: number }>();
  for (const order of orders) {
    const entry = byRestaurant.get(order.restaurantId) ?? { orderCount: 0, revenue: 0 };
    entry.orderCount += 1;
    entry.revenue += Number(order.total);
    byRestaurant.set(order.restaurantId, entry);
  }

  const ranked = [...byRestaurant.entries()].sort(([, a], [, b]) => b.revenue - a.revenue).slice(0, range.limit);
  const restaurants = await prisma.restaurant.findMany({
    where: { id: { in: ranked.map(([id]) => id) } },
    select: { id: true, name: true, nameAr: true, city: true, slug: true },
  });
  const byId = new Map(restaurants.map((r) => [r.id, r]));

  return {
    range: formatRange(range),
    restaurants: ranked.map(([restaurantId, v]) => ({
      restaurantId,
      name: byId.get(restaurantId)?.name ?? "Unknown",
      nameAr: byId.get(restaurantId)?.nameAr ?? "",
      city: byId.get(restaurantId)?.city ?? "",
      slug: byId.get(restaurantId)?.slug ?? "",
      orderCount: v.orderCount,
      revenue: v.revenue,
    })),
  };
}

export async function topCategories(range: ReportRange & { city?: string; limit: number }) {
  const where = reportOrderWhere(range);
  const orders = await prisma.order.findMany({
    where,
    select: { total: true, restaurant: { select: { categories: { select: { id: true, name: true, nameAr: true } } } } },
  });

  const byCategory = new Map<string, { name: string; nameAr: string; orderCount: number; revenue: number }>();
  for (const order of orders) {
    for (const category of order.restaurant.categories) {
      const entry = byCategory.get(category.id) ?? { name: category.name, nameAr: category.nameAr, orderCount: 0, revenue: 0 };
      entry.orderCount += 1;
      entry.revenue += Number(order.total);
      byCategory.set(category.id, entry);
    }
  }

  const categories = [...byCategory.entries()]
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, range.limit)
    .map(([categoryId, v]) => ({ categoryId, ...v }));

  return { range: formatRange(range), categories };
}

export async function newSignups(range: ReportRange & { groupBy: GroupBy }) {
  const users = await prisma.user.findMany({
    where: { role: { in: [Role.CUSTOMER, Role.RESTAURANT_OWNER] }, createdAt: { gte: range.dateFrom, lte: range.dateTo } },
    select: { createdAt: true, role: true },
  });

  const buckets = new Map<string, { customers: number; owners: number }>();
  for (const user of users) {
    const key = bucketKey(user.createdAt, range.groupBy);
    const entry = buckets.get(key) ?? { customers: 0, owners: 0 };
    if (user.role === Role.CUSTOMER) entry.customers += 1;
    else entry.owners += 1;
    buckets.set(key, entry);
  }

  const series = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucket, v]) => ({ bucket, customers: v.customers, owners: v.owners }));

  return { range: formatRange(range), groupBy: range.groupBy, series };
}

export async function liveActivity(limit: number) {
  const history = await prisma.orderStatusHistory.findMany({
    orderBy: { changedAt: "desc" },
    take: limit,
    include: {
      order: {
        select: {
          orderNumber: true,
          restaurant: { select: { name: true, nameAr: true } },
          customer: { select: { name: true } },
        },
      },
    },
  });

  return {
    items: history.map((h) => ({
      id: h.id,
      type: "order_status_changed" as const,
      status: h.status,
      orderNumber: h.order.orderNumber,
      restaurantName: h.order.restaurant.name,
      restaurantNameAr: h.order.restaurant.nameAr,
      customerName: h.order.customer.name,
      at: h.changedAt,
    })),
  };
}
