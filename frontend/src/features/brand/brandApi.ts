import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { Brand } from "@/types/api";

export interface UpdateBrandInput {
  name?: string;
  nameAr?: string;
  logoUrl?: string;
  description?: string;
  descriptionAr?: string;
}

export function useOwnBrand() {
  return useQuery({
    queryKey: ["own-brand"],
    queryFn: async () => (await apiClient.get<{ brand: Brand }>("/brand")).data.brand,
  });
}

export function useUpdateOwnBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateBrandInput) => (await apiClient.patch<{ brand: Brand }>("/brand", input)).data.brand,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["own-brand"] }),
  });
}
