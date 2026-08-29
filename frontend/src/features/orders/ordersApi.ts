import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { Order, OrderStatus, OrderTracking, PaymentMethod, Paginated } from "@/types/api";

export interface CreateOrderInput {
  restaurantId: string;
  addressId: string;
  items: { menuItemId: string; quantity: number; selectedOptionIds?: string[] }[];
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface OrderListFilters {
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export function useMyOrders(filters: OrderListFilters) {
  return useQuery({
    queryKey: ["my-orders", filters],
    queryFn: async () => (await apiClient.get<Paginated<Order>>("/orders", { params: filters })).data,
    placeholderData: (prev) => prev,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => (await apiClient.get<{ order: Order }>(`/orders/${id}`)).data.order,
    enabled: Boolean(id),
  });
}

export function useOrderTracking(id: string | undefined, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ["order-tracking", id],
    queryFn: async () => (await apiClient.get<OrderTracking>(`/orders/${id}/tracking`)).data,
    enabled: Boolean(id),
    refetchInterval: options?.refetchInterval,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => (await apiClient.post<{ order: Order }>("/orders", input)).data.order,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-orders"] }),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) =>
      (await apiClient.patch<{ order: Order }>(`/orders/${id}/cancel`, { reason })).data.order,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["order", vars.id] });
      qc.invalidateQueries({ queryKey: ["restaurant-orders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) =>
      (await apiClient.patch<{ order: Order }>(`/orders/${id}/status`, { status })).data.order,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["restaurant-orders"] });
      qc.invalidateQueries({ queryKey: ["order", vars.id] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, rating, comment }: { orderId: string; rating: number; comment?: string }) =>
      (await apiClient.post(`/orders/${orderId}/review`, { rating, comment })).data,
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["order", vars.orderId] }),
  });
}
