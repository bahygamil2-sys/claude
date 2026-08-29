import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { Category, Paginated, Restaurant, RestaurantMenu, Review } from "@/types/api";

export interface RestaurantListFilters {
  city?: string;
  categoryId?: string;
  search?: string;
  sort?: "rating" | "deliveryTime" | "minOrder";
  page?: number;
  pageSize?: number;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await apiClient.get<{ categories: Category[] }>("/categories")).data.categories,
    staleTime: 5 * 60_000,
  });
}

export function useRestaurants(filters: RestaurantListFilters) {
  return useQuery({
    queryKey: ["restaurants", filters],
    queryFn: async () => (await apiClient.get<Paginated<Restaurant>>("/restaurants", { params: filters })).data,
    placeholderData: (prev) => prev,
  });
}

export function useRestaurant(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ["restaurant", idOrSlug],
    queryFn: async () => (await apiClient.get<{ restaurant: Restaurant }>(`/restaurants/${idOrSlug}`)).data.restaurant,
    enabled: Boolean(idOrSlug),
  });
}

export function useRestaurantMenu(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ["restaurant-menu", idOrSlug],
    queryFn: async () => (await apiClient.get<RestaurantMenu>(`/restaurants/${idOrSlug}/menu`)).data,
    enabled: Boolean(idOrSlug),
  });
}

export function useRestaurantReviews(idOrSlug: string | undefined, page = 1) {
  return useQuery({
    queryKey: ["restaurant-reviews", idOrSlug, page],
    queryFn: async () => (await apiClient.get<Paginated<Review>>(`/restaurants/${idOrSlug}/reviews`, { params: { page } })).data,
    enabled: Boolean(idOrSlug),
  });
}
