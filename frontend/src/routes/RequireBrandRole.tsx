import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type { BrandRole } from "@/types/api";

export function RequireBrandRole({ roles, children }: { roles: BrandRole[]; children: ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const location = useLocation();

  if (session?.actorType !== "BRAND_USER") {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (!roles.includes(session.user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
