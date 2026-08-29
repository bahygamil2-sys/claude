import { useTranslation } from "react-i18next";
import { Building2, ClipboardList, MessageSquare, Store } from "lucide-react";
import { useAdminStats } from "./adminApi";
import { StatCard } from "@/components/StatCard";
import { FullPageSpinner } from "@/components/Spinner";

export default function AdminOverviewPage() {
  const { t } = useTranslation("admin");
  const statsQuery = useAdminStats();

  if (statsQuery.isLoading) return <FullPageSpinner />;
  const stats = statsQuery.data;
  if (!stats) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-neutral-900">{t("overview.title")}</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("overview.brands")} value={stats.brands.total} icon={<Store size={18} />} tone="brand" />
        <StatCard label={t("overview.branches")} value={stats.branches.total} icon={<Building2 size={18} />} />
        <StatCard label={t("overview.surveys")} value={stats.surveys.total} icon={<ClipboardList size={18} />} />
        <StatCard label={t("overview.responses")} value={stats.responses.total} icon={<MessageSquare size={18} />} />
      </div>
    </div>
  );
}
