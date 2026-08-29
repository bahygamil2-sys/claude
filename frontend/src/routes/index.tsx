import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PublicSurveyLayout } from "@/layouts/PublicSurveyLayout";
import { BrandDashboardLayout } from "@/layouts/BrandDashboardLayout";
import { AdminDashboardLayout } from "@/layouts/AdminDashboardLayout";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { FullPageSpinner } from "@/components/Spinner";
import { RequireBrandUser } from "./RequireBrandUser";
import { RequireBrandRole } from "./RequireBrandRole";
import { RequireAdmin } from "./RequireAdmin";
import LoginPage from "@/features/auth/LoginPage";
import SignupPage from "@/features/auth/SignupPage";
import AcceptInvitePage from "@/features/auth/AcceptInvitePage";
import DashboardOverviewPage from "@/features/dashboard/DashboardOverviewPage";
import BranchesPage from "@/features/branches/BranchesPage";
import SettingsPage from "@/features/brand/SettingsPage";
import TeamPage from "@/features/team/TeamPage";
import SurveysListPage from "@/features/surveys/SurveysListPage";
import SurveyBuilderPage from "@/features/surveys/SurveyBuilderPage";
import SurveyLinksPage from "@/features/surveys/SurveyLinksPage";
import AnalyticsPage from "@/features/surveys/AnalyticsPage";
import AdminLoginPage from "@/features/admin/AdminLoginPage";
import AdminOverviewPage from "@/features/admin/AdminOverviewPage";
import AdminBrandsPage from "@/features/admin/AdminBrandsPage";
import AdminBrandDetailPage from "@/features/admin/AdminBrandDetailPage";

// Its own chunk: a respondent scanning a QR code on their phone should never
// download the brand/admin dashboard bundle to see this page.
const SurveyRespondPage = lazy(() => import("@/features/public/SurveyRespondPage"));

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
      </Route>

      <Route element={<PublicSurveyLayout />}>
        <Route
          path="/r/:token"
          element={
            <Suspense fallback={<FullPageSpinner />}>
              <SurveyRespondPage />
            </Suspense>
          }
        />
      </Route>

      <Route
        element={
          <RequireBrandUser>
            <BrandDashboardLayout />
          </RequireBrandUser>
        }
      >
        <Route path="/dashboard" element={<DashboardOverviewPage />} />
        <Route path="/branches" element={<BranchesPage />} />
        <Route path="/surveys" element={<SurveysListPage />} />
        <Route path="/surveys/:id/edit" element={<SurveyBuilderPage />} />
        <Route path="/surveys/:id/links" element={<SurveyLinksPage />} />
        <Route path="/surveys/:id/analytics" element={<AnalyticsPage />} />
        <Route
          path="/team"
          element={
            <RequireBrandRole roles={["OWNER"]}>
              <TeamPage />
            </RequireBrandRole>
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route
        element={
          <RequireAdmin>
            <AdminDashboardLayout />
          </RequireAdmin>
        }
      >
        <Route path="/admin/dashboard" element={<AdminOverviewPage />} />
        <Route path="/admin/brands" element={<AdminBrandsPage />} />
        <Route path="/admin/brands/:id" element={<AdminBrandDetailPage />} />
      </Route>

      <Route path="/unauthorized" element={<PlaceholderPage title="403 — Unauthorized" />} />
      <Route path="*" element={<PlaceholderPage title="404 — Not Found" />} />
    </Routes>
  );
}
