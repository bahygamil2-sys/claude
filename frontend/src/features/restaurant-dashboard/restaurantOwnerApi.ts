import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { Order, Paginated, Restaurant } from "@/types/api";

export interface RestaurantInput {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  city: string;
  area?: string;
  addressLine: string;
  lat: number;
  lng: number;
  phone: string;
  deliveryFee: number;
  minOrderAmount: number;
  logoUrl?: string;
  coverImageUrl?: string;
  categoryIds?: string[];
}

export function useMyRestaurants() {
  return useQuery({
    queryKey: ["my-restaurants"],
    queryFn: async () => (await apiClient.get<{ restaurants: Restaurant[] }>("/restaurants/mine")).data.restaurants,
  });
}

export function useCreateRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RestaurantInput) => (await apiClient.post<{ restaurant: Restaurant }>("/restaurants", input)).data.restaurant,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-restaurants"] }),
  });
}

export function useUpdateRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<RestaurantInput> & { isOpen?: boolean; openTime?: string; closeTime?: string; avgPreparationTimeMinutes?: number } }) =>
      (await apiClient.patch<{ restaurant: Restaurant }>(`/restaurants/${id}`, input)).data.restaurant,
    onSuccess: (restaurant) => {
      qc.invalidateQueries({ queryKey: ["my-restaurants"] });
      qc.invalidateQueries({ queryKey: ["restaurant", restaurant.slug] });
      qc.invalidateQueries({ queryKey: ["restaurant", restaurant.id] });
    },
  });
}

export interface RestaurantOrdersFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export function useRestaurantOrdersFeed(restaurantId: string | undefined, filters: RestaurantOrdersFilters) {
  return useQuery({
    queryKey: ["restaurant-orders", restaurantId, filters],
    queryFn: async () => (await apiClient.get<Paginated<Order>>(`/restaurants/${restaurantId}/orders`, { params: filters })).data,
    enabled: Boolean(restaurantId),
    placeholderData: (prev) => prev,
  });
}
