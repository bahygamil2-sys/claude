import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, CheckCircle2, ClipboardList, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useBranches } from "@/features/branches/branchesApi";
import { useSurveys } from "@/features/surveys/surveysApi";
import { StatCard } from "@/components/StatCard";
import { FullPageSpinner } from "@/components/Spinner";

export default function DashboardOverviewPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  const session = useAuthStore((s) => s.session);
  const branchesQuery = useBranches();
  const surveysQuery = useSurveys();

  if (branchesQuery.isLoading || surveysQuery.isLoading) return <FullPageSpinner />;

  const branches = branchesQuery.data ?? [];
  const surveys = surveysQuery.data ?? [];
  const publishedCount = surveys.filter((s) => s.status === "PUBLISHED").length;
  const totalResponses = surveys.reduce((sum, s) => sum + (s._count?.responses ?? 0), 0);
  const isOwner = session?.actorType === "BRAND_USER" && session.user.role === "OWNER";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">{t("dashboard:overview.title")}</h1>
        <p className="text-sm text-neutral-500">{t("dashboard:overview.welcome", { name: session?.user.name })}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("dashboard:overview.branches")} value={branches.length} icon={<Building2 size={18} />} tone="brand" />
        <StatCard label={t("dashboard:overview.surveys")} value={surveys.length} icon={<ClipboardList size={18} />} />
        <StatCard label={t("dashboard:overview.publishedSurveys")} value={publishedCount} icon={<CheckCircle2 size={18} />} />
        <StatCard label={t("dashboard:overview.totalResponses")} value={totalResponses} icon={<MessageSquare size={18} />} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">{t("dashboard:overview.quickLinks")}</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/branches"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {t("dashboard:overview.manageBranches")}
          </Link>
          <Link
            to="/surveys"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {t("dashboard:overview.manageSurveys")}
          </Link>
          {isOwner && (
            <Link
              to="/team"
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {t("dashboard:overview.manageTeam")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
