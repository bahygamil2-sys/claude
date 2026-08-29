import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { Address } from "@/types/api";

export interface AddressInput {
  label: string;
  city: string;
  area?: string;
  street: string;
  building?: string;
  notes?: string;
  lat: number;
  lng: number;
  isDefault?: boolean;
}

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => (await apiClient.get<{ addresses: Address[] }>("/addresses")).data.addresses,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddressInput) => (await apiClient.post<{ address: Address }>("/addresses", input)).data.address,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<AddressInput> }) =>
      (await apiClient.patch<{ address: Address }>(`/addresses/${id}`, input)).data.address,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/addresses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.patch<{ address: Address }>(`/addresses/${id}/default`)).data.address,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}
