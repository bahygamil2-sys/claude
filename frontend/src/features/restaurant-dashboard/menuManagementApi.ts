import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { MenuCategory, MenuItem } from "@/types/api";

function invalidateMenu(qc: ReturnType<typeof useQueryClient>) {
  // Public menu queries are keyed by slug or id — invalidating the whole "restaurant-menu"
  // prefix covers both without needing to know which one is currently cached.
  qc.invalidateQueries({ queryKey: ["restaurant-menu"] });
}

export interface MenuCategoryInput {
  name: string;
  nameAr: string;
  sortOrder?: number;
}

export function useCreateMenuCategory(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MenuCategoryInput) =>
      (await apiClient.post<{ menuCategory: MenuCategory }>(`/restaurants/${restaurantId}/menu-categories`, input)).data.menuCategory,
    onSuccess: () => invalidateMenu(qc),
  });
}

export function useUpdateMenuCategory(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<MenuCategoryInput> }) =>
      (await apiClient.patch<{ menuCategory: MenuCategory }>(`/restaurants/${restaurantId}/menu-categories/${id}`, input)).data.menuCategory,
    onSuccess: () => invalidateMenu(qc),
  });
}

export function useDeleteMenuCategory(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/restaurants/${restaurantId}/menu-categories/${id}`),
    onSuccess: () => invalidateMenu(qc),
  });
}

export interface MenuItemOptionInput {
  name: string;
  nameAr: string;
  priceDelta: number;
}
export interface MenuItemOptionGroupInput {
  name: string;
  nameAr: string;
  isRequired?: boolean;
  minSelect?: number;
  maxSelect?: number;
  options: MenuItemOptionInput[];
}
export interface MenuItemInput {
  menuCategoryId?: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  imageUrl?: string;
  isVegetarian?: boolean;
  sortOrder?: number;
  optionGroups?: MenuItemOptionGroupInput[];
}

export function useCreateMenuItem(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MenuItemInput) => (await apiClient.post<{ menuItem: MenuItem }>(`/restaurants/${restaurantId}/menu-items`, input)).data.menuItem,
    onSuccess: () => invalidateMenu(qc),
  });
}

export function useUpdateMenuItem(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<MenuItemInput> }) =>
      (await apiClient.patch<{ menuItem: MenuItem }>(`/restaurants/${restaurantId}/menu-items/${id}`, input)).data.menuItem,
    onSuccess: () => invalidateMenu(qc),
  });
}

export function useDeleteMenuItem(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/restaurants/${restaurantId}/menu-items/${id}`),
    onSuccess: () => invalidateMenu(qc),
  });
}

export function useSetItemAvailability(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      (await apiClient.patch<{ menuItem: MenuItem }>(`/restaurants/${restaurantId}/menu-items/${id}/availability`, { isAvailable })).data.menuItem,
    onSuccess: () => invalidateMenu(qc),
  });
}
