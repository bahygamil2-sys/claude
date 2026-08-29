import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { Brand, BrandRole, BrandStatus, BrandUserStatus, Paginated, RestaurantBranch } from "@/types/api";

export interface AdminStats {
  brands: { total: number; byStatus: Record<string, number> };
  branches: { total: number };
  surveys: { total: number; byStatus: Record<string, number> };
  responses: { total: number };
  brandsCreatedOverTime: { date: string; count: number }[];
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => (await apiClient.get<AdminStats>("/admin/reports/stats")).data,
  });
}

export interface AdminBrandListItem extends Brand {
  _count: { branches: number; surveys: number; users: number };
}

export interface AdminBrandsFilters {
  status?: BrandStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminBrands(filters: AdminBrandsFilters) {
  return useQuery({
    queryKey: ["admin-brands", filters],
    queryFn: async () => (await apiClient.get<Paginated<AdminBrandListItem>>("/admin/brands", { params: filters })).data,
    placeholderData: (prev) => prev,
  });
}

export interface AdminBrandUserSummary {
  id: string;
  email: string;
  name: string;
  role: BrandRole;
  status: BrandUserStatus;
  createdAt: string;
}

export interface AdminBrandDetail extends Brand {
  branches: RestaurantBranch[];
  users: AdminBrandUserSummary[];
  _count: { surveys: number };
}

export function useAdminBrand(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-brand", id],
    queryFn: async () => (await apiClient.get<{ brand: AdminBrandDetail }>(`/admin/brands/${id}`)).data.brand,
    enabled: Boolean(id),
  });
}

export function useUpdateBrandStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BrandStatus }) =>
      (await apiClient.patch<{ brand: Brand }>(`/admin/brands/${id}/status`, { status })).data.brand,
    onSuccess: (brand) => {
      qc.invalidateQueries({ queryKey: ["admin-brand", brand.id] });
      qc.invalidateQueries({ queryKey: ["admin-brands"] });
    },
  });
}
