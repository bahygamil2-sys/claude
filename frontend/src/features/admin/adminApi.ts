import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { Category, Paginated, Restaurant, RestaurantStatus, Role, User } from "@/types/api";
import type { AdminOrderListItem, AdminRestaurantListItem } from "./adminTypes";

export interface AdminUsersFilters {
  role?: Role;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminUsers(filters: AdminUsersFilters) {
  return useQuery({
    queryKey: ["admin-users", filters],
    queryFn: async () => (await apiClient.get<Paginated<User>>("/admin/users", { params: filters })).data,
    placeholderData: (prev) => prev,
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      (await apiClient.patch<{ user: User }>(`/admin/users/${id}/status`, { isActive })).data.user,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export interface AdminRestaurantsFilters {
  status?: RestaurantStatus;
  city?: string;
  categoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminRestaurants(filters: AdminRestaurantsFilters) {
  return useQuery({
    queryKey: ["admin-restaurants", filters],
    queryFn: async () => (await apiClient.get<Paginated<AdminRestaurantListItem>>("/admin/restaurants", { params: filters })).data,
    placeholderData: (prev) => prev,
  });
}

export function useUpdateRestaurantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RestaurantStatus }) =>
      (await apiClient.patch<{ restaurant: Restaurant }>(`/restaurants/${id}/status`, { status })).data.restaurant,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-restaurants"] }),
  });
}

export interface AdminOrdersFilters {
  status?: string;
  restaurantId?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminOrders(filters: AdminOrdersFilters) {
  return useQuery({
    queryKey: ["admin-orders", filters],
    queryFn: async () => (await apiClient.get<Paginated<AdminOrderListItem>>("/admin/orders", { params: filters })).data,
    placeholderData: (prev) => prev,
  });
}

export interface CategoryInput {
  name: string;
  nameAr: string;
  slug: string;
  icon?: string;
  sortOrder?: number;
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CategoryInput) => (await apiClient.post<{ category: Category }>("/categories", input)).data.category,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CategoryInput> }) =>
      (await apiClient.patch<{ category: Category }>(`/categories/${id}`, input)).data.category,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
