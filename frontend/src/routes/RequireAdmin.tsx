import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const location = useLocation();

  if (session?.actorType !== "ADMIN") {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
