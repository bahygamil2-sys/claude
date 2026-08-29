import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useAdminBrand, useUpdateBrandStatus } from "./adminApi";
import { useLocalized } from "@/hooks/useLocalized";
import { Button } from "@/components/Button";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { Badge, BrandStatusBadge, BrandUserStatusBadge } from "@/components/Badge";
import { FullPageSpinner } from "@/components/Spinner";
import { toast } from "@/store/toastStore";
import { getApiErrorMessage } from "@/lib/apiError";

const BRAND_USER_STATUS_LABEL_KEY: Record<string, string> = {
  ACTIVE: "dashboard:team.statusActive",
  INVITED: "dashboard:team.statusInvited",
  DISABLED: "dashboard:team.statusDisabled",
};

export default function AdminBrandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["admin", "common", "dashboard"]);
  const pick = useLocalized();
  const navigate = useNavigate();
  const brandQuery = useAdminBrand(id);
  const updateStatus = useUpdateBrandStatus();
  const [confirming, setConfirming] = useState(false);

  if (brandQuery.isLoading) return <FullPageSpinner />;
  const brand = brandQuery.data;
  if (!brand) return null;

  async function toggleStatus() {
    const nextStatus = brand!.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await updateStatus.mutateAsync({ id: brand!.id, status: nextStatus });
      toast.success(t(nextStatus === "SUSPENDED" ? "brandDetail.suspended" : "brandDetail.activated"));
      setConfirming(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => navigate("/admin/brands")}
        className="flex w-fit items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft size={15} />
        {t("brandDetail.back")}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-neutral-900">{pick(brand.name, brand.nameAr)}</h1>
          <BrandStatusBadge status={brand.status} label={t(`common:brandStatus.${brand.status}`)} />
        </div>
        {confirming ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <span className="text-xs text-amber-800">{t("brandDetail.confirmSuspend")}</span>
            <Button size="sm" variant="danger" loading={updateStatus.isPending} onClick={() => void toggleStatus()}>
              {t("common:actions.confirm")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              {t("common:actions.cancel")}
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant={brand.status === "ACTIVE" ? "danger" : "outline"}
            loading={updateStatus.isPending}
            onClick={() => (brand.status === "ACTIVE" ? setConfirming(true) : void toggleStatus())}
          >
            {t(brand.status === "ACTIVE" ? "brandDetail.suspend" : "brandDetail.activate")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="text-sm font-semibold text-neutral-800">
            {t("brandDetail.branches")} ({brand.branches.length})
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {brand.branches.map((branch) => (
              <div key={branch.id} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">{pick(branch.name, branch.nameAr)}</span>
                <Badge tone={branch.isActive ? "success" : "neutral"}>{pick(branch.city, branch.cityAr)}</Badge>
              </div>
            ))}
            {brand.branches.length === 0 && <p className="text-sm text-neutral-400">—</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="text-sm font-semibold text-neutral-800">
            {t("brandDetail.team")} ({brand.users.length})
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {brand.users.map((user) => (
              <div key={user.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-neutral-800">{user.name}</p>
                  <p className="text-xs text-neutral-400">{user.email}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge tone={user.role === "OWNER" ? "brand" : "neutral"}>{t(`common:roles.${user.role}`)}</Badge>
                  <BrandUserStatusBadge status={user.status} label={t(BRAND_USER_STATUS_LABEL_KEY[user.status] ?? user.status)} />
                </div>
              </div>
            ))}
            {brand.users.length === 0 && <p className="text-sm text-neutral-400">—</p>}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <p className="text-sm text-neutral-600">
            {t("brandDetail.surveysCount")}: <span className="font-semibold text-neutral-900">{brand._count.surveys}</span>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
