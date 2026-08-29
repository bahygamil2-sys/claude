import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { RestaurantBranch } from "@/types/api";

export interface BranchInput {
  name: string;
  nameAr: string;
  address: string;
  addressAr: string;
  city: string;
  cityAr: string;
  phone?: string;
}

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: async () => (await apiClient.get<{ branches: RestaurantBranch[] }>("/branches")).data.branches,
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BranchInput) => (await apiClient.post<{ branch: RestaurantBranch }>("/branches", input)).data.branch,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches"] }),
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<BranchInput> & { isActive?: boolean } }) =>
      (await apiClient.patch<{ branch: RestaurantBranch }>(`/branches/${id}`, input)).data.branch,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches"] }),
  });
}
