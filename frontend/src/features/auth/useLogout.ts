import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { logoutRequest } from "./authApi";

// Cart is device-scoped, not user-scoped, so it deliberately survives logout — a guest's
// in-progress cart shouldn't vanish if they log in (or out) mid-session.
export function useLogout() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clear);

  return async () => {
    try {
      await logoutRequest();
    } finally {
      clearAuth();
      navigate("/");
    }
  };
}
