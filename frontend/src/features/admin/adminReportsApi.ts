import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type {
  AdminOverviewReport,
  AdminScopeParams,
  LiveActivityItem,
  NewSignupsReport,
  OrdersByStatusReport,
  ReportRangeParams,
  SalesOverTimeReport,
  TopCategoriesReport,
  TopRestaurantsReport,
} from "@/features/reports/reportTypes";

type GroupBy = "day" | "week" | "month";

export function useAdminOverview(params: ReportRangeParams & { city?: string; categoryId?: string }) {
  return useQuery({
    queryKey: ["admin-report-overview", params],
    queryFn: async () => (await apiClient.get<AdminOverviewReport>("/admin/reports/overview", { params })).data,
  });
}

export function useAdminSalesOverTime(params: ReportRangeParams & { groupBy: GroupBy } & AdminScopeParams) {
  return useQuery({
    queryKey: ["admin-report-sales", params],
    queryFn: async () => (await apiClient.get<SalesOverTimeReport>("/admin/reports/sales-over-time", { params })).data,
  });
}

export function useAdminOrdersByStatus(params: ReportRangeParams & AdminScopeParams) {
  return useQuery({
    queryKey: ["admin-report-status", params],
    queryFn: async () => (await apiClient.get<OrdersByStatusReport>("/admin/reports/orders-by-status", { params })).data,
  });
}

export function useAdminTopRestaurants(params: ReportRangeParams & { limit?: number; city?: string; categoryId?: string }) {
  return useQuery({
    queryKey: ["admin-report-top-restaurants", params],
    queryFn: async () => (await apiClient.get<TopRestaurantsReport>("/admin/reports/top-restaurants", { params })).data,
  });
}

export function useAdminTopCategories(params: ReportRangeParams & { limit?: number; city?: string }) {
  return useQuery({
    queryKey: ["admin-report-top-categories", params],
    queryFn: async () => (await apiClient.get<TopCategoriesReport>("/admin/reports/top-categories", { params })).data,
  });
}

export function useAdminNewSignups(params: ReportRangeParams & { groupBy: GroupBy }) {
  return useQuery({
    queryKey: ["admin-report-new-signups", params],
    queryFn: async () => (await apiClient.get<NewSignupsReport>("/admin/reports/new-signups", { params })).data,
  });
}

export function useAdminLiveActivity(limit = 20) {
  return useQuery({
    queryKey: ["admin-live-activity", limit],
    queryFn: async () => (await apiClient.get<{ items: LiveActivityItem[] }>("/admin/reports/live-activity", { params: { limit } })).data.items,
  });
}
