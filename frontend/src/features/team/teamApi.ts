import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { BrandUser } from "@/types/api";

// Backend's sanitize() only strips passwordHash — inviteToken/inviteTokenExpiresAt
// come through so the Owner can build and share the invite link immediately,
// with no separate email infrastructure (see brandUsers.service.ts).
export interface TeamMember extends BrandUser {
  inviteToken: string | null;
  inviteTokenExpiresAt: string | null;
  branchAccess: { branchId: string }[];
}

export interface InviteInput {
  email: string;
  name: string;
  branchIds: string[];
}

export function useTeam() {
  return useQuery({
    queryKey: ["team"],
    queryFn: async () => (await apiClient.get<{ users: TeamMember[] }>("/brand-users")).data.users,
  });
}

export function useInviteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: InviteInput) => (await apiClient.post<{ user: TeamMember }>("/brand-users", input)).data.user,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });
}

export function useUpdateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: { branchIds?: string[]; status?: "ACTIVE" | "DISABLED" } }) =>
      (await apiClient.patch<{ user: TeamMember }>(`/brand-users/${id}`, input)).data.user,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });
}
