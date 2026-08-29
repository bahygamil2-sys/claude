import { OrderStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { bucketKey, formatRange, GroupBy, reportOrderWhere, ReportRange } from "./reports.util";

export async function summary(restaurantId: string, range: ReportRange & { status?: OrderStatus }) {
  const where = reportOrderWhere({ ...range, restaurantId, status: range.status });
  const orders = await prisma.order.findMany({ where, select: { status: true, total: true } });

  const allInRange = await prisma.order.findMany({
    where: { restaurantId, createdAt: { gte: range.dateFrom, lte: range.dateTo } },
    select: { status: true },
  });

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const deliveredOrders = allInRange.filter((o) => o.status === OrderStatus.DELIVERED).length;
  const cancelledOrders = allInRange.filter((o) => o.status === OrderStatus.CANCELLED).length;
  const completionRate = allInRange.length > 0 ? deliveredOrders / allInRange.length : 0;

  const readyEntries = await prisma.order.findMany({
    where: { restaurantId, createdAt: { gte: range.dateFrom, lte: range.dateTo } },
    select: { createdAt: true, statusHistory: { where: { status: OrderStatus.READY_FOR_PICKUP }, take: 1 } },
  });
  const prepTimes = readyEntries
    .filter((o) => o.statusHistory.length > 0)
    .map((o) => (o.statusHistory[0].changedAt.getTime() - o.createdAt.getTime()) / 60000);
  const avgPrepTimeMinutes = prepTimes.length > 0 ? prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length : null;

  const firstOrderByCustomer = await prisma.order.groupBy({
    by: ["customerId"],
    where: { restaurantId },
    _min: { createdAt: true },
  });
  const newCustomers = firstOrderByCustomer.filter(
    (c) =>
      c._min.createdAt &&
      (!range.dateFrom || c._min.createdAt >= range.dateFrom) &&
      (!range.dateTo || c._min.createdAt <= range.dateTo)
  ).length;

  return {
    range: formatRange(range),
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue,
    avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    completionRate,
    avgPrepTimeMinutes,
    newCustomers,
  };
}

export async function salesOverTime(restaurantId: string, range: ReportRange & { groupBy: GroupBy }) {
  const where = reportOrderWhere({ ...range, restaurantId });
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

export async function topItems(restaurantId: string, range: ReportRange & { limit: number }) {
  const where = reportOrderWhere({ ...range, restaurantId });
  const orderItems = await prisma.orderItem.findMany({
    where: { order: where },
    select: { menuItemId: true, nameSnapshot: true, nameArSnapshot: true, quantity: true, lineTotal: true },
  });

  const byItem = new Map<string, { name: string; nameAr: string; quantitySold: number; revenue: number }>();
  for (const item of orderItems) {
    const key = item.menuItemId ?? item.nameSnapshot;
    const entry = byItem.get(key) ?? { name: item.nameSnapshot, nameAr: item.nameArSnapshot, quantitySold: 0, revenue: 0 };
    entry.quantitySold += item.quantity;
    entry.revenue += Number(item.lineTotal);
    byItem.set(key, entry);
  }

  const items = [...byItem.entries()]
    .sort(([, a], [, b]) => b.quantitySold - a.quantitySold)
    .slice(0, range.limit)
    .map(([menuItemId, v]) => ({ menuItemId, ...v }));

  return { range: formatRange(range), items };
}

export async function ordersByStatus(restaurantId: string, range: ReportRange) {
  const grouped = await prisma.order.groupBy({
    by: ["status"],
    where: { restaurantId, createdAt: { gte: range.dateFrom, lte: range.dateTo } },
    _count: true,
  });
  return { range: formatRange(range), breakdown: grouped.map((g) => ({ status: g.status, count: g._count })) };
}

export async function ordersByHour(restaurantId: string, range: ReportRange) {
  const where = reportOrderWhere({ ...range, restaurantId });
  const orders = await prisma.order.findMany({ where, select: { createdAt: true } });

  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  for (const order of orders) {
    hours[order.createdAt.getUTCHours()].count += 1;
  }

  return { range: formatRange(range), hours };
}
