import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { OrdersByHourReport, OrdersByStatusReport, ReportRangeParams, SalesOverTimeReport, SummaryReport, TopItemsReport } from "./reportTypes";

type GroupBy = "day" | "week" | "month";

export function useRestaurantSummary(restaurantId: string | undefined, params: ReportRangeParams) {
  return useQuery({
    queryKey: ["restaurant-report-summary", restaurantId, params],
    queryFn: async () => (await apiClient.get<SummaryReport>(`/restaurants/${restaurantId}/reports/summary`, { params })).data,
    enabled: Boolean(restaurantId),
  });
}

export function useRestaurantSalesOverTime(restaurantId: string | undefined, params: ReportRangeParams & { groupBy: GroupBy }) {
  return useQuery({
    queryKey: ["restaurant-report-sales", restaurantId, params],
    queryFn: async () => (await apiClient.get<SalesOverTimeReport>(`/restaurants/${restaurantId}/reports/sales-over-time`, { params })).data,
    enabled: Boolean(restaurantId),
  });
}

export function useRestaurantTopItems(restaurantId: string | undefined, params: ReportRangeParams & { limit?: number }) {
  return useQuery({
    queryKey: ["restaurant-report-top-items", restaurantId, params],
    queryFn: async () => (await apiClient.get<TopItemsReport>(`/restaurants/${restaurantId}/reports/top-items`, { params })).data,
    enabled: Boolean(restaurantId),
  });
}

export function useRestaurantOrdersByStatus(restaurantId: string | undefined, params: ReportRangeParams) {
  return useQuery({
    queryKey: ["restaurant-report-status", restaurantId, params],
    queryFn: async () => (await apiClient.get<OrdersByStatusReport>(`/restaurants/${restaurantId}/reports/orders-by-status`, { params })).data,
    enabled: Boolean(restaurantId),
  });
}

export function useRestaurantOrdersByHour(restaurantId: string | undefined, params: ReportRangeParams) {
  return useQuery({
    queryKey: ["restaurant-report-hour", restaurantId, params],
    queryFn: async () => (await apiClient.get<OrdersByHourReport>(`/restaurants/${restaurantId}/reports/orders-by-hour`, { params })).data,
    enabled: Boolean(restaurantId),
  });
}
