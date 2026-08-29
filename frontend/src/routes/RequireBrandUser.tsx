import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function RequireBrandUser({ children }: { children: ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const location = useLocation();

  if (session?.actorType !== "BRAND_USER") {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
