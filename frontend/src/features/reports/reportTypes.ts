export interface ReportRangeParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface RangeEcho {
  dateFrom: string | null;
  dateTo: string | null;
}

export interface SummaryReport {
  range: RangeEcho;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  completionRate: number;
  avgPrepTimeMinutes: number | null;
  newCustomers: number;
}

export interface SalesOverTimeReport {
  range: RangeEcho;
  groupBy: "day" | "week" | "month";
  series: { bucket: string; orders: number; revenue: number }[];
}

export interface TopItemsReport {
  range: RangeEcho;
  items: { menuItemId: string; name: string; nameAr: string; quantitySold: number; revenue: number }[];
}

export interface OrdersByStatusReport {
  range: RangeEcho;
  breakdown: { status: string; count: number }[];
}

export interface OrdersByHourReport {
  range: RangeEcho;
  hours: { hour: number; count: number }[];
}

export interface AdminOverviewReport {
  range: RangeEcho;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  totalRestaurants: number;
  activeRestaurants: number;
  pendingRestaurants: number;
  totalCustomers: number;
  ordersToday: number;
  revenueToday: number;
}

export interface TopRestaurantsReport {
  range: RangeEcho;
  restaurants: { restaurantId: string; name: string; nameAr: string; city: string; slug: string; orderCount: number; revenue: number }[];
}

export interface TopCategoriesReport {
  range: RangeEcho;
  categories: { categoryId: string; name: string; nameAr: string; orderCount: number; revenue: number }[];
}

export interface NewSignupsReport {
  range: RangeEcho;
  groupBy: "day" | "week" | "month";
  series: { bucket: string; customers: number; owners: number }[];
}

export interface LiveActivityItem {
  id: string;
  type: string;
  status: string;
  orderNumber: string;
  restaurantName: string;
  restaurantNameAr: string;
  customerName: string;
  at: string;
}
