import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types/api";

export function useUpdateProfile() {
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation({
    mutationFn: async (input: { name?: string; phone?: string }) => (await apiClient.patch<{ user: User }>("/auth/me", input)).data.user,
    onSuccess: (user) => {
      if (accessToken) setSession(user, accessToken);
    },
  });
}
