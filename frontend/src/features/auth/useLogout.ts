import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { apiClient } from "@/lib/apiClient";

export function useLogout() {
  const navigate = useNavigate();
  const session = useAuthStore((s) => s.session);
  const clearAuth = useAuthStore((s) => s.clear);

  return async () => {
    const isAdmin = session?.actorType === "ADMIN";
    try {
      await apiClient.post(isAdmin ? "/admin/auth/logout" : "/brand/auth/logout");
    } finally {
      clearAuth();
      navigate(isAdmin ? "/admin/login" : "/login");
    }
  };
}
