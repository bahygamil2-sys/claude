import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useBranches } from "./branchesApi";
import { BranchFormModal } from "./BranchFormModal";
import { useLocalized } from "@/hooks/useLocalized";
import { Button } from "@/components/Button";
import { Card, CardBody } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { FullPageSpinner } from "@/components/Spinner";
import type { RestaurantBranch } from "@/types/api";

export default function BranchesPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  const pick = useLocalized();
  const session = useAuthStore((s) => s.session);
  const isOwner = session?.actorType === "BRAND_USER" && session.user.role === "OWNER";
  const branchesQuery = useBranches();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<RestaurantBranch | null>(null);

  function openCreate() {
    setEditingBranch(null);
    setModalOpen(true);
  }
  function openEdit(branch: RestaurantBranch) {
    setEditingBranch(branch);
    setModalOpen(true);
  }

  if (branchesQuery.isLoading) return <FullPageSpinner />;
  const branches = branchesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">{t("dashboard:branches.title")}</h1>
        {isOwner && (
          <Button size="sm" onClick={openCreate}>
            <Plus size={15} className="me-1" />
            {t("dashboard:branches.addBranch")}
          </Button>
        )}
      </div>

      {branches.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-neutral-500">{t("dashboard:branches.empty")}</CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card
              key={branch.id}
              className={isOwner ? "cursor-pointer transition hover:border-brand-300" : undefined}
              onClick={isOwner ? () => openEdit(branch) : undefined}
            >
              <CardBody className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-neutral-900">{pick(branch.name, branch.nameAr)}</p>
                    <p className="text-xs text-neutral-500">{pick(branch.city, branch.cityAr)}</p>
                  </div>
                  <Badge tone={branch.isActive ? "success" : "neutral"}>
                    {branch.isActive ? t("dashboard:branches.isActive") : t("dashboard:branches.isInactive")}
                  </Badge>
                </div>
                <p className="text-sm text-neutral-600">{pick(branch.address, branch.addressAr)}</p>
                {branch.phone && <p className="text-xs text-neutral-400">{branch.phone}</p>}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {isOwner && <BranchFormModal open={modalOpen} onClose={() => setModalOpen(false)} branch={editingBranch} />}
    </div>
  );
}
